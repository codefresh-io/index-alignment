import { Collection, Db, MongoClient } from 'mongodb';
import { compareDump } from '../compare-dump.js';
import { heavyCollections, indexLimitPerCollection } from '../config.js';
import { getCollectionIndexes } from '../get-indexes.js';
import { logger } from '../logger.js';
import type { CollectionDrift, DatabaseDrift, Index, SyncOptions } from '../types.js';
import { getTargetToDumpDb } from '../utils.js';

const getOrCreateCollection = async (db: Db, collectionName: string): Promise<Collection> => {
  const collections = await db.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    logger.stderr(`Creating collection "${collectionName}"`);
    await db.createCollection(collectionName);
  }
  return db.collection(collectionName);
};

/**
 * Syncs indexes for a collection.
 *
 * This function must strictly adhere to the requirement of doing as minimal impact on performance as possible.
 * This means, that in common case we do want to create new indexes first, then drop extra ones.
 * This is because new indexes may be a replacement for older ones, and dropping older indexes
 * before creating a replacement will cause degraded performance window.
 *
 * We must also consider the upper limit of 64 indexes per collection.
 * If we're not able to create all missing indexes at once without exceeding the limit,
 * we need to:
 * - create as many missing indexes as possible
 * - drop one extra index
 * - repeat the process until all missing indexes are created
 * - drop all extra indexes, if any
 *
 * For the sake of this function, "free slots" are the number of indexes
 * that can be created in a collection at the moment without exceeding the limit of 64 indexes.
 *
 * Algorithm:
 * 1. If there are no missing or extra indexes, RETURN.
 *    Sync is done.
 *    Exit case for recursion calls.
 * 2. If number of missing indexes is greater than the sum of extra indexes and free slots, THROW.
 *    Sync is impossible.
 *    This means that even if all extra indexes are dropped,
 *    there won't be enough free slots to create all missing indexes.
 *    This is a case when we forced to do manual sync.
 * 3. If there are no missing indexes, drop all extra indexes. RETURN.
 *    Sync is done.
 * 4. If there are no extra indexes, create all missing indexes. RETURN.
 *    Sync is done.
 * 5. Create as many missing indexes as possible, filling all free slots.
 * 6. Drop _one_ extra index, releasing a single slot.
 * 7. Repeat the process starting from step 1.
 */
export const syncIndexes = async (collection: Collection, freeSlots: number, missing: Index[] = [], extra: Index[] = []): Promise<void> => {
  const missingIndexes = [...missing];
  const extraIndexes = [...extra];

  if (missingIndexes.length === 0 && extraIndexes.length === 0) return;

  if (missingIndexes.length > extraIndexes.length + freeSlots) {
    logger.stderr(`Not enough free slots to create ${missingIndexes.length} indexes, even if all extra ones are dropped. Consider manual sync with the help of support.`);
    throw new Error('Not enough free slots to create indexes');
  }

  if (missingIndexes.length === 0) {
    await Promise.all(extraIndexes.map((index) => {
      logger.stderr(`Dropping index ${index.name}`);
      return collection.dropIndex(index.name!);
    }));
    logger.stderr(`Dropped ${extraIndexes.length} indexes`);
    return;
  }

  if (extraIndexes.length === 0) {
    missingIndexes.forEach(index => logger.stderr(`Creating index ${index.name}`));
    await collection.createIndexes(missingIndexes);
    logger.stderr(`Created ${missingIndexes.length} indexes`);
    return;
  }

  const toCreate = missingIndexes.splice(0, freeSlots);
  if (toCreate.length !== 0) {
    toCreate.forEach(index => logger.stderr(`Creating index ${index.name}`));
    await collection.createIndexes(toCreate);
    logger.stderr(`Created ${toCreate.length} indexes`);
  }
  const toDrop = extraIndexes.pop()!;
  logger.stderr(`Dropping index ${toDrop.name}`);
  await collection.dropIndex(toDrop.name!);
  logger.stderr(`Dropped 1 index`);

  const newFreeSlots = freeSlots - toCreate.length + 1;
  return syncIndexes(collection, newFreeSlots, missingIndexes, extraIndexes);
};

const syncCollection = async (collection: Collection, drift: CollectionDrift, options: SyncOptions): Promise<void> => {
  const { collectionName, missingIndexes, extraIndexes } = drift;
  logger.stderr(`Syncing collection "${collectionName}"`);
  if (missingIndexes) logger.stderr(`Going to create ${missingIndexes.length} indexes`);
  if (extraIndexes) logger.stderr(`Going to drop ${extraIndexes.length} indexes`);

  const dumpDbName = getTargetToDumpDb(options.dbMap).get(collection.dbName) ?? collection.dbName;
  if (
    missingIndexes?.length !== 0
    && heavyCollections[options.product][dumpDbName]?.includes(collectionName)
    && !options.force
  ) {
    logger.stderr(`\n⚠️ Missing ${missingIndexes!.length} indexes on potentially heavy collection: ${collectionName}. Index creation may take a while.\nSkipping collection sync!\nPlease consider using --force flag to bypass this check\n`);
    return;
  }

  const { indexes } = await getCollectionIndexes(collection);
  const freeSlots = indexLimitPerCollection - indexes.length;
  logger.stderr(`Limit per collection is ${indexLimitPerCollection}`);
  logger.stderr(`Found ${indexes.length} indexes`);
  logger.stderr(`Free slots: ${freeSlots}`);
  logger.stderr(`Indexes to create: ${missingIndexes?.length ?? 0}`);
  logger.stderr(`Indexes to drop: ${extraIndexes?.length ?? 0}`);
  logger.stderr(`Free slots will be filled with new indexes first, then extra indexes will be dropped one by one freeing up a slot, until all indexes are synced`);
  await syncIndexes(collection, freeSlots, missingIndexes, extraIndexes);
  logger.stderr(`Collection "${collectionName}" synced`);
};

const syncDatabase = async (db: Db, drift: DatabaseDrift, options: SyncOptions): Promise<void> => {
  const { databaseName, collections } = drift;
  logger.stderr(`Syncing database "${databaseName}"`);
  for (const [collectionName, collectionDrift] of Object.entries(collections)) {
    const collection = await getOrCreateCollection(db, collectionName);
    await syncCollection(collection, collectionDrift, options);
  }
  logger.stderr(`Database "${databaseName}" synced`);
};

export const sync = async (options: SyncOptions): Promise<void> => {
  logger.stderr(`Syncing indexes for "${options.product}"`);
  const drift = await compareDump(options);
  const client = new MongoClient(options.uri);
  await client.connect();
  for (const [databaseName, databaseDrift] of Object.entries(drift.databases)) {
    const db = client.db(databaseName);
    await syncDatabase(db, databaseDrift, options);
  }
  await client.close();
};

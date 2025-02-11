import { Collection, Db, MongoClient } from 'mongodb';
import { compare } from './compare.js';
import { getCollectionIndexes } from './get-indexes.js';
import { logger } from './logger.js';
import type { CollectionDrift, DatabaseDrift, DbMapRaw, Index, Product } from './types.js';

interface SyncOptions {
  uri: string;
  product: Product;
  dbMap?: DbMapRaw;
}

const LIMIT = 64;

const getOrCreateCollection = async (db: Db, collectionName: string): Promise<Collection> => {
  const collections = await db.listCollections({ name: collectionName }).toArray();
  if (collections.length === 0) {
    logger.stderr(`Creating collection "${collectionName}"`);
    await db.createCollection(collectionName);
  }
  return db.collection(collectionName);
};

export const syncIndexes = async (collection: Collection, freeSlots: number, missing: Index[] = [], extra: Index[] = []): Promise<void> => {
  const missingIndexes = [...missing];
  const extraIndexes = [...extra];

  if (missingIndexes.length === 0 && extraIndexes.length === 0) return;

  if (missingIndexes.length > extraIndexes.length + freeSlots) {
    logger.stderr(`Not enough free slots to create ${missingIndexes.length} indexes. Consider manual sync`);
    throw new Error('Not enough free slots');
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

const syncCollection = async (collection: Collection, drift: CollectionDrift): Promise<void> => {
  const { collectionName, missingIndexes, extraIndexes } = drift;
  logger.stderr(`Syncing collection "${collectionName}"`);
  if (missingIndexes) logger.stderr(`Going to create ${missingIndexes.length} indexes`);
  if (extraIndexes) logger.stderr(`Going to drop ${extraIndexes.length} indexes`);

  const { indexes } = await getCollectionIndexes(collection);
  const freeSlots = LIMIT - indexes.length;
  logger.stderr(`Limit per collection is ${LIMIT}`);
  logger.stderr(`Found ${indexes.length} indexes`);
  logger.stderr(`Free slots: ${freeSlots}`);
  logger.stderr(`Indexes to create: ${missingIndexes?.length ?? 0}`);
  logger.stderr(`Indexes to drop: ${extraIndexes?.length ?? 0}`);
  logger.stderr(`Free slots will be filled with new indexes first, then extra indexes will be dropped one by one freeing up a slot, until all indexes are synced`);
  await syncIndexes(collection, freeSlots, missingIndexes, extraIndexes);
  logger.stderr(`Collection "${collectionName}" synced`);
};

const syncDatabase = async (db: Db, drift: DatabaseDrift): Promise<void> => {
  const { databaseName, collections } = drift;
  logger.stderr(`Syncing database "${databaseName}"`);
  for (const [collectionName, collectionDrift] of Object.entries(collections)) {
    const collection = await getOrCreateCollection(db, collectionName);
    await syncCollection(collection, collectionDrift);
  }
  logger.stderr(`Database "${databaseName}" synced`);
};

export const sync = async (options: SyncOptions): Promise<void> => {
  logger.stderr(`Syncing indexes for "${options.product}"`);
  const drift = await compare(options);
  const client = new MongoClient(options.uri);
  await client.connect();
  for (const [databaseName, databaseDrift] of Object.entries(drift.databases)) {
    const db = client.db(databaseName);
    await syncDatabase(db, databaseDrift);
  }
  await client.close();
};

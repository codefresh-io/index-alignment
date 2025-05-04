import { MongoClient } from 'mongodb';
import { deepStrictEqual } from 'node:assert';
import { heavyCollections } from './config.js';
import { getAllIndexes } from './get-indexes.js';
import { logger } from './logger.js';
import { readDump } from './read-dump.js';
import type { CollectionDrift, CollectionIndexes, DatabaseDrift, DatabaseIndexes, DbMapRaw, FullDrift, Index, Product } from './types.js';
import { getTargetToDumpDb } from './utils.js';

interface CompareOptions {
  uri: string;
  product: Product;
  dbMap?: DbMapRaw;
}

/**
 * Compare two indexes to check if they are equal.
 *
 * Algorithm:
 *
 *  - The `key` property is an object that contains the fields and their sort order.
 * The order of the keys in the object DO MATTER, that's why we need to compare
 * objects including the order of the keys.
 * `JSON.stringify()` is visiting keys in the same predictable and repeatable order
 * as `Object.keys()`, that's why it has been chosen.
 *
 * - The `name` property is not used in the comparison because it can be arbitrary
 * and does not affect the index itself.
 *
 * - Rest of the properties are compared as they are, regardless of the key order,
 * that's why we use `deepStrictEqual` ({@link https://nodejs.org/api/assert.html#assertdeepstrictequalactual-expected-message|docs}).
 *
 * - If both `key` and options (except for `name`) are equal, the indexes are considered equal.
 */
export const isIndexEqual = (a: Index, b: Index): boolean => {
  const aKey = a.key;
  const aOptions = { ...a, key: undefined, name: undefined };
  const bKey = b.key;
  const bOptions = { ...b, key: undefined, name: undefined };
  const isKeyEqual = JSON.stringify(aKey) === JSON.stringify(bKey);
  try {
    deepStrictEqual(aOptions, bOptions);
    return isKeyEqual;
  } catch {
    return false;
  }
};

const compareCollections = (desired: CollectionIndexes, actual?: CollectionIndexes): CollectionDrift => {
  const missingIndexes = desired.indexes.filter((desiredIndex) => {
    const match = actual?.indexes.find(actualIndex => isIndexEqual(desiredIndex, actualIndex));
    return !match;
  });
  const extraIndexes = actual?.indexes.filter((actualIndex) => {
    const match = desired.indexes.find(desiredIndex => isIndexEqual(desiredIndex, actualIndex));
    return !match;
  });
  return {
    collectionName: desired.collectionName,
    ...missingIndexes.length && { missingIndexes },
    ...extraIndexes?.length && { extraIndexes },
  };
};

const compareDatabases = (desired: DatabaseIndexes, actual?: DatabaseIndexes): DatabaseDrift => {
  const dbDrift: DatabaseDrift = { databaseName: desired.databaseName, collections: {} };
  if (!actual) {
    for (const { collectionName, indexes } of desired.collections) {
      dbDrift.collections[collectionName] = { collectionName, missingIndexes: indexes };
    }
    return dbDrift;
  }

  for (const desiredCol of desired.collections) {
    const actualCol = actual.collections.find(actuaCol => actuaCol.collectionName === desiredCol.collectionName);
    const collectionResult = compareCollections(desiredCol, actualCol);
    if (collectionResult.missingIndexes || collectionResult.extraIndexes) {
      dbDrift.collections[desiredCol.collectionName] = collectionResult;
    }
  }
  return dbDrift;
};

export const compare = async ({ product, uri, dbMap }: CompareOptions): Promise<FullDrift> => {
  const desired = await readDump(product, dbMap);
  const client = new MongoClient(uri);
  await client.connect();
  const actual = await getAllIndexes(client);

  const drift: FullDrift = { databases: {} };
  for (const desiredDb of desired) {
    const actualDb = actual.find(db => db.databaseName === desiredDb.databaseName);
    const dbDrift = compareDatabases(desiredDb, actualDb);
    if (Object.keys(dbDrift.collections).length !== 0) {
      drift.databases[desiredDb.databaseName] = dbDrift;
    }
  }
  await client.close();
  return drift;
};

export const compareCli = async (options: CompareOptions): Promise<void> => {
  logger.stderr(`Comparing indexes for "${options.product}"`);
  const targetToDumpDb = getTargetToDumpDb(options.dbMap);
  const drift = await compare(options);
  for (const db of Object.values(drift.databases)) {
    const dumpDbName = targetToDumpDb.get(db.databaseName) ?? db.databaseName;
    for (const col of Object.values(db.collections)) {
      if (!col.missingIndexes && !col.extraIndexes) continue;
      logger.stderr(`db "${db.databaseName}" collection "${col.collectionName}":`);
      if (col.missingIndexes && heavyCollections[options.product][dumpDbName]?.includes(col.collectionName)) {
        logger.stderr(`\t⚠️ Potentially heavy collection: ${col.collectionName}. Index creation may take a while.`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      col.missingIndexes && logger.stderr(`\tMissing: ${col.missingIndexes.length}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      col.extraIndexes && logger.stderr(`\tExtra: ${col.extraIndexes.length}`);
      logger.stderr('');
    }
  }
  logger.stdout(JSON.stringify(drift, null, 2));
};

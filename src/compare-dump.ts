import { getAllIndexes } from './get-indexes.js';
import { getMongoClient } from './get-mongo-client.js';
import { isIndexEqual } from './is-index-equal.js';
import { shouldIgnoreIndexInDump } from './overrides/should-ignore-index-in-dump.js';
import { shouldIgnoreIndexInTarget } from './overrides/should-ignore-index-in-target.js';
import { readDump } from './read-dump.js';
import type { CollectionDiff, CollectionIndexes, CompareOptions, DatabaseDiff, DatabaseIndexes, DbMapRaw, FullDiff } from './types.js';
import { getTargetToDumpDb } from './utils.js';

const compareCollections = (desired: CollectionIndexes, actual?: CollectionIndexes, dbMap?: DbMapRaw, options?: CompareOptions): CollectionDiff => {
  const dumpDbName = getTargetToDumpDb(dbMap).get(desired.databaseName) ?? desired.databaseName;

  const missingIndexes = desired.indexes.filter((desiredIndex) => {
    // Skip indexes that should be ignored in the dump
    if (shouldIgnoreIndexInDump(dumpDbName, desired.collectionName, desiredIndex, options)) return false;

    const match = actual?.indexes.find(actualIndex => isIndexEqual(desiredIndex, actualIndex, options));
    return !match;
  });

  const extraIndexes = actual?.indexes.filter((actualIndex) => {
    // Skip indexes that should be ignored in the target
    if (shouldIgnoreIndexInTarget(dumpDbName, actual.collectionName, actualIndex, options)) return false;

    const match = desired.indexes.find(desiredIndex => isIndexEqual(desiredIndex, actualIndex, options));
    return !match;
  });

  return {
    collectionName: desired.collectionName,
    ...missingIndexes.length && { missingIndexes },
    ...extraIndexes?.length && { extraIndexes },
  };
};

const compareDatabases = (desired: DatabaseIndexes, actual?: DatabaseIndexes, dbMap?: DbMapRaw, options?: CompareOptions): DatabaseDiff => {
  const dbDiff: DatabaseDiff = { databaseName: desired.databaseName, collections: {} };

  for (const desiredCol of desired.collections) {
    const actualCol = actual?.collections.find(actuaCol => actuaCol.collectionName === desiredCol.collectionName);
    const collectionResult = compareCollections(desiredCol, actualCol, dbMap, options);
    if (collectionResult.missingIndexes || collectionResult.extraIndexes) {
      dbDiff.collections[desiredCol.collectionName] = collectionResult;
    }
  }
  return dbDiff;
};

export const compareDump = async (options: CompareOptions): Promise<FullDiff> => {
  const { product, dbMap } = options;
  const desired = await readDump(product, dbMap, options.version);
  const client = getMongoClient(options);
  await client.connect();
  const actual = await getAllIndexes(client);

  const diff: FullDiff = { databases: {} };
  for (const desiredDb of desired) {
    const actualDb = actual.find(db => db.databaseName === desiredDb.databaseName);
    const dbDiff = compareDatabases(desiredDb, actualDb, dbMap, options);
    if (Object.keys(dbDiff.collections).length !== 0) {
      diff.databases[desiredDb.databaseName] = dbDiff;
    }
  }
  await client.close();
  return diff;
};

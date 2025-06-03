import { MongoClient } from 'mongodb';
import { getAllIndexes } from './get-indexes.js';
import { isIndexEqual } from './is-index-equal.js';
import { shouldIgnoreIndexInDump } from './overrides/should-ignore-index-in-dump.js';

import { readDump } from './read-dump.js';
import type { CollectionDrift, CollectionIndexes, CompareOptions, DatabaseDrift, DatabaseIndexes, DbMapRaw, FullDrift } from './types.js';
import { shouldIgnoreIndexInTarget } from './overrides/should-ignore-index-in-target.js';
import { getTargetToDumpDb } from './utils.js';

const compareCollections = (desired: CollectionIndexes, actual?: CollectionIndexes, dbMap?: DbMapRaw): CollectionDrift => {
  const dumpDbName = getTargetToDumpDb(dbMap).get(desired.databaseName) ?? desired.databaseName;

  const missingIndexes = desired.indexes.filter((desiredIndex) => {
    // Skip indexes that should be ignored in the dump
    if (shouldIgnoreIndexInDump(dumpDbName, desired.collectionName, desiredIndex)) return false;

    const match = actual?.indexes.find(actualIndex => isIndexEqual(desiredIndex, actualIndex));
    return !match;
  });

  const extraIndexes = actual?.indexes.filter((actualIndex) => {
    // Skip indexes that should be ignored in the target
    if (shouldIgnoreIndexInTarget(dumpDbName, actual.collectionName, actualIndex)) return false;

    const match = desired.indexes.find(desiredIndex => isIndexEqual(desiredIndex, actualIndex));
    return !match;
  });

  return {
    collectionName: desired.collectionName,
    ...missingIndexes.length && { missingIndexes },
    ...extraIndexes?.length && { extraIndexes },
  };
};

const compareDatabases = (desired: DatabaseIndexes, actual?: DatabaseIndexes, dbMap?: DbMapRaw): DatabaseDrift => {
  const dbDrift: DatabaseDrift = { databaseName: desired.databaseName, collections: {} };

  for (const desiredCol of desired.collections) {
    const actualCol = actual?.collections.find(actuaCol => actuaCol.collectionName === desiredCol.collectionName);
    const collectionResult = compareCollections(desiredCol, actualCol, dbMap);
    if (collectionResult.missingIndexes || collectionResult.extraIndexes) {
      dbDrift.collections[desiredCol.collectionName] = collectionResult;
    }
  }
  return dbDrift;
};

export const compareDump = async ({ product, uri, dbMap }: CompareOptions): Promise<FullDrift> => {
  const desired = await readDump(product, dbMap);
  const client = new MongoClient(uri);
  await client.connect();
  const actual = await getAllIndexes(client);

  const drift: FullDrift = { databases: {} };
  for (const desiredDb of desired) {
    const actualDb = actual.find(db => db.databaseName === desiredDb.databaseName);
    const dbDrift = compareDatabases(desiredDb, actualDb, dbMap);
    if (Object.keys(dbDrift.collections).length !== 0) {
      drift.databases[desiredDb.databaseName] = dbDrift;
    }
  }
  await client.close();
  return drift;
};

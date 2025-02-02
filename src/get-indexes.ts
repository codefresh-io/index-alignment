import type { Collection, Db, MongoClient } from 'mongodb';
import type { CollectionIndexes, DatabaseIndexes, GetIndexesOptions, Index } from './types.js';

export const getCollectionIndexes = async (collection: Collection, options: GetIndexesOptions = {}): Promise<CollectionIndexes> => {
  const { collectionName, dbName: databaseName } = collection;
  const rawIndexes = await collection.listIndexes().toArray();
  const indexes: Index[] = rawIndexes.reduce((acc, index) => {
    if (options.omitHiddenIndexes && index.hidden) return acc;
    delete index.v;
    delete index.background;
    if (index.collation) delete index.collation.version;
    acc.push(index);
    return acc;
  }, [] as Index[]);
  return { databaseName, collectionName, indexes };
};

export const getDatabaseIndexes = async (db: Db, options: GetIndexesOptions = {}): Promise<DatabaseIndexes> => {
  const { databaseName } = db;
  const dbIndexes: DatabaseIndexes = { databaseName, collections: [] };
  for await (const collection of db.listCollections({}, { nameOnly: true, authorizedCollections: true })) {
    const collectionIndexes = await getCollectionIndexes(db.collection(collection.name), options);
    dbIndexes.collections.push(collectionIndexes);
  }
  return dbIndexes;
};

export const getAllIndexes = async (client: MongoClient, options: GetIndexesOptions = {}): Promise<DatabaseIndexes[]> => {
  const listDbsResult = await client.db().admin().listDatabases({ nameOnly: true, authorizedDatabases: true });
  const dbNames = listDbsResult.databases.map(({ name }) => name);
  const allIndexes: DatabaseIndexes[] = [];
  for (const dbName of dbNames) {
    if (dbName === 'admin' || dbName === 'config') continue;
    const dbIndexes = await getDatabaseIndexes(client.db(dbName), options);
    allIndexes.push(dbIndexes);
  }
  return allIndexes;
};

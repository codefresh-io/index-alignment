import { Collection, Db, Document, MongoClient } from 'mongodb';
import { logger } from '../logger.js';

interface StatsOptions {
  uri: string;
}

interface CollectionStats {
  databaseName: string;
  collectionName: string;
  stats: Document[];
  /** `null` if collection is empty */
  oldestDocId: string | null;
}

interface DatabaseStats {
  databaseName: string;
  collections: CollectionStats[];
  stats: Document;
}

export const getCollectionStats = async (collection: Collection): Promise<CollectionStats> => {
  const { collectionName, dbName: databaseName } = collection;
  const statsCursor = await collection.aggregate([
    {
      $collStats: {
        storageStats: {},
        count: {},
      },
    },
  ]);
  const stats: Document[] = [];
  for await (const doc of statsCursor) {
    stats.push(doc);
  }
  const oldestDocument = await collection.findOne({}, {
    sort: { $natural: 1 },
    limit: 1,
    projection: { _id: 1 },
  });
  const oldestDocId = oldestDocument?._id.toString() ?? null;
  return { databaseName, collectionName, stats, oldestDocId };
};

export const getDatabaseStats = async (db: Db): Promise<DatabaseStats> => {
  const { databaseName } = db;
  const stats = await db.stats({ scale: 1 });
  const dbStats: DatabaseStats = { databaseName, collections: [], stats };
  for await (const collection of db.listCollections({}, { nameOnly: true, authorizedCollections: true })) {
    const collectionStats = await getCollectionStats(db.collection(collection.name));
    dbStats.collections.push(collectionStats);
  }
  return dbStats;
};

export const getAllStats = async (client: MongoClient): Promise<unknown> => {
  const listDbsResult = await client.db().admin().listDatabases({ nameOnly: true, authorizedDatabases: true });
  const dbNames = listDbsResult.databases.map(({ name }) => name);
  const allStats: DatabaseStats[] = [];
  for (const dbName of dbNames) {
    if (dbName === 'admin' || dbName === 'config' || dbName === 'local') continue;
    const dbStats = await getDatabaseStats(client.db(dbName));
    allStats.push(dbStats);
  }
  return allStats;
};

export const stats = async (options: StatsOptions): Promise<void> => {
  const { uri } = options;
  logger.stderr('Reading MongoDB stats. Only databases and collections with authorized access will be covered');

  const client = new MongoClient(uri);
  await client.connect();
  logger.stderr('Connected to MongoDB');

  const stats = await getAllStats(client);
  logger.stdout(JSON.stringify(stats, null, 2));
  logger.stderr(`✅ Stats read successfully`);
  await client.close();
};

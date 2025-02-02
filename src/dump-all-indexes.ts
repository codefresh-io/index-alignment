import { MongoClient } from 'mongodb';
import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, resolve } from 'node:path';
import { cwd } from 'node:process';
import { getAllIndexes } from './get-indexes.js';

interface DumpOptions {
  uri: string;
  path: string;
}

export const dumpAllIndexes = async (options: DumpOptions): Promise<void> => {
  const { uri, path } = options;
  const dumpDirPath = isAbsolute(path) ? path : resolve(cwd(), path);
  console.info(`Dumping all indexes to "${dumpDirPath}". Hidden indexes and databases "admin" and "system" will be ignored.`);

  await mkdir(dumpDirPath, { recursive: true });
  const client = new MongoClient(uri);
  await client.connect();
  console.info('Connected to MongoDB');

  const allIndexes = await getAllIndexes(client, { omitHiddenIndexes: true });
  for (const dbIndexes of allIndexes) {
    const dbDirPath = resolve(dumpDirPath, dbIndexes.databaseName);
    await mkdir(dbDirPath, { recursive: true });
    for (const collectionIndexes of dbIndexes.collections) {
      const collectionFilePath = resolve(dbDirPath, `${collectionIndexes.collectionName}.json`);
      await writeFile(collectionFilePath, JSON.stringify(collectionIndexes, null, 2));
    }
  }
  console.info(`✅ Dumped all indexes to "${dumpDirPath}"`);
  await client.close();
};

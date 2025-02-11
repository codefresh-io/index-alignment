import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { logger } from './logger.js';
import type { CollectionIndexes, DatabaseIndexes, DbMapRaw, Product } from './types.js';

const DumpDirs: Record<Product, string> = {
  classic: resolve(cwd(), 'indexes', 'classic'),
  gitops: resolve(cwd(), 'indexes', 'gitops'),
} as const;

export const readDump = async (product: Product, dbMapRaw: DbMapRaw = []): Promise<DatabaseIndexes[]> => {
  const dbMap = dbMapRaw.reduce((map, kv) => {
    const [dumpDb, targetDb] = kv.split('=');
    map.set(dumpDb!, targetDb!);
    return map;
  }, new Map<string, string>());

  logger.stderr(`Reading desired indexes for ${product}`);
  const pathToDump = DumpDirs[product];
  const dirEnts = await readdir(pathToDump, { recursive: true, withFileTypes: true });
  const filePaths = dirEnts.reduce((acc, dirEnt) => {
    if (!dirEnt.isFile()) return acc;
    acc.push(resolve(cwd(), dirEnt.parentPath, dirEnt.name));
    return acc;
  }, [] as string[]);

  const dump: CollectionIndexes[] = await Promise.all(
    filePaths.map(async (filePath) => {
      const fileContent = await readFile(filePath, 'utf-8');
      const indexes = JSON.parse(fileContent) as CollectionIndexes;
      indexes.databaseName = dbMap.get(indexes.databaseName) ?? indexes.databaseName;
      return indexes;
    }),
  );
  logger.stderr(`Read ${dump.length} indexes from ${pathToDump}`);
  const result: DatabaseIndexes[] = [];
  for (const { databaseName, collectionName, indexes } of dump) {
    const db = result.find(db => db.databaseName === databaseName);
    if (db) {
      db.collections.push({ databaseName, collectionName, indexes });
    } else {
      result.push({ databaseName, collections: [{ databaseName, collectionName, indexes }] });
    }
  }
  return result;
};

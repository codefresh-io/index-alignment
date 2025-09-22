import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { cwd } from 'node:process';
import { onpremVersions } from './config.js';
import { logger } from './logger.js';
import type { CollectionIndexes, DatabaseIndexes, DbMapRaw, Product } from './types.js';
import { getDumpToTargetDb } from './utils.js';

const getDumpDir = (product: Product, version: string): string => {
  if (!onpremVersions.includes(version as typeof onpremVersions[number])) {
    throw new Error(`Unsupported on-prem version: "${version}". Supported versions: "${onpremVersions.join(' | ')}"`);
  }

  switch (product) {
    case 'classic':
      return resolve(cwd(), 'indexes', version, 'classic');
    case 'gitops':
      return resolve(cwd(), 'indexes', version, 'gitops');
  }
};

export const readDump = async (product: Product, dbMapRaw: DbMapRaw = [], version: string): Promise<DatabaseIndexes[]> => {
  const dumpToTargetDb = getDumpToTargetDb(dbMapRaw);

  logger.stderr(`Reading desired indexes for ${product}`);
  const pathToDump = getDumpDir(product, version);
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
      indexes.databaseName = dumpToTargetDb.get(indexes.databaseName) ?? indexes.databaseName;
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

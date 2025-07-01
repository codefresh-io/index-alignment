import type { DbMapRaw } from './types.js';

export const getDumpToTargetDb = (dbMapRaw: DbMapRaw = []): Map<string, string> => {
  return dbMapRaw.reduce((map, kv) => {
    const [dumpDb, targetDb] = kv.split('=');
    map.set(dumpDb!, targetDb!);
    return map;
  }, new Map<string, string>());
};

export const getTargetToDumpDb = (dbMapRaw: DbMapRaw = []): Map<string, string> => {
  return dbMapRaw.reduce((map, kv) => {
    const [dumpDb, targetDb] = kv.split('=');
    map.set(targetDb!, dumpDb!);
    return map;
  }, new Map<string, string>());
};

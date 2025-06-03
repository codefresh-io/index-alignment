import type { IgnoreInAllCollections, IgnoreList } from '../types.js';
/**
 * These indexes should be ignored in all collections.
 */
export const ignoreInAllCollections: IgnoreInAllCollections = [
  // No need to create `_id` index in collections, it is created by default.
  {
    key: {
      _id: 1,
    },
  },
] as const;

export const ignoreList: IgnoreList = {};

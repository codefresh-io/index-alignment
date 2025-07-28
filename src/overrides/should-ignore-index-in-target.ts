import { isIndexEqual } from '../is-index-equal.js';
import type {
  CollectionName,
  CompareOptions,
  DatabaseName,
  IgnoreInAllCollections,
  IgnoreList,
  Index,
} from '../types.js';

// TODO: Verify unique indexes, they should probably be ignored for now.

/**
 * These indexes should be ignored in all collections.
 */
const ignoreInAllCollections: IgnoreInAllCollections = [] as const;

const ignoreList: IgnoreList = {
  google_production: {
    workflowprocesses: {
      databaseName: 'google_production',
      collectionName: 'workflowprocesses',
      indexes: [
        // Retention policy in SaaS is not applicable to On-Premises. In On-Premises it is configured in Chart values.
        {
          key: {
            created: 1,
          },
        },
        // Retention policy in SaaS is not applicable to On-Premises. In On-Premises it is configured in Chart values.
        {
          key: {
            created: 1,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expireAfterSeconds: 'ANY' as any,
        },
      ],
      ignoreAllIndexes: false,
    },
    workflowrevisions: {
      databaseName: 'google_production',
      collectionName: 'workflowrevisions',
      indexes: [
        // Retention policy in SaaS is not applicable to On-Premises. In On-Premises it is configured in Chart values.
        {
          key: {
            createdAt: 1,
          },
        },
        // Retention policy in SaaS is not applicable to On-Premises. In On-Premises it is configured in Chart values.
        {
          key: {
            createdAt: 1,
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expireAfterSeconds: 'ANY' as any,
        },
      ],
      ignoreAllIndexes: false,
    },
  },
};

export const shouldIgnoreIndexInTarget = (dumpDbName: DatabaseName, collectionName: CollectionName, targetIndex: Index, options?: CompareOptions): boolean => {
  // Check if the index should be ignored in all collections
  if (ignoreInAllCollections.some(ignore => isIndexEqual(ignore, targetIndex, options))) {
    return true;
  }

  const ignoreCollection = ignoreList[dumpDbName]?.[collectionName];

  // Check if all indexes should be ignored in the specific collection
  if (ignoreCollection?.ignoreAllIndexes) {
    return true;
  }

  // Check if the index is in the ignore list for the specific collection
  if (ignoreCollection?.indexes.some(ignore => isIndexEqual(ignore, targetIndex, options))) {
    return true;
  }

  // Check if the index is a custom retention policy index
  if (ignoreCollection?.indexes.some(ignore => isIndexEqual(ignore, {
    ...targetIndex,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expireAfterSeconds: 'ANY' as any,
  }, options))) {
    return true;
  }

  // If no conditions matched, the index should not be ignored
  return false;
};

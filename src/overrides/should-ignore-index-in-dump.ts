import { isIndexEqual } from '../is-index-equal.js';
import type { CollectionName, DatabaseName, IgnoreInAllCollections, IgnoreList, Index } from '../types.js';

// TODO: Verify unique indexes in accounts collection.

/**
 * These indexes should be ignored in all collections.
 */
const ignoreInAllCollections: IgnoreInAllCollections = [
  // No need to create `_id` index in collections, it is created by default.
  {
    key: {
      _id: 1,
    },
  },
] as const;

const ignoreList: IgnoreList = {
  'archive': {
    // 3rd party collection, not used by Codefresh
    'objectlabs-system': {
      databaseName: 'archive',
      collectionName: 'objectlabs-system',
      indexes: [],
      ignoreAllIndexes: true,
    },
  },
  'chart-manager': {
    // 3rd party collection, not used by Codefresh
    'objectlabs-system': {
      databaseName: 'chart-manager',
      collectionName: 'objectlabs-system',
      indexes: [],
      ignoreAllIndexes: true,
    },
  },
  'cluster-providers': {
    // 3rd party collection, not used by Codefresh
    'objectlabs-system': {
      databaseName: 'cluster-providers',
      collectionName: 'objectlabs-system',
      indexes: [],
      ignoreAllIndexes: true,
    },
  },
  'context-manager': {
    // 3rd party collection, not used by Codefresh
    'objectlabs-system': {
      databaseName: 'context-manager',
      collectionName: 'objectlabs-system',
      indexes: [],
      ignoreAllIndexes: true,
    },
  },
  'google_production': {
    // 3rd party collection, not used by Codefresh
    'objectlabs-system.admin.collections': {
      databaseName: 'google_production',
      collectionName: 'objectlabs-system.admin.collections',
      indexes: [],
      ignoreAllIndexes: true,
    },
    // 3rd party collection, not used by Codefresh
    'objectlabs-system': {
      databaseName: 'google_production',
      collectionName: 'objectlabs-system',
      indexes: [],
      ignoreAllIndexes: true,
    },
    'workflowprocesses': {
      databaseName: 'google_production',
      collectionName: 'workflowprocesses',
      indexes: [
        // Retention policy in SaaS is not applicable to On-Premises. In On-Premises it is configured in Chart values.
        {
          key: {
            created: 1,
          },
          name: 'created_1',
          expireAfterSeconds: 24192000,
        },
      ],
      ignoreAllIndexes: false,
    },
    'workflowrevisions': {
      databaseName: 'google_production',
      collectionName: 'workflowrevisions',
      indexes: [
        // Retention policy in SaaS is not applicable to On-Premises. In On-Premises it is configured in Chart values.
        {
          key: {
            createdAt: 1,
          },
          name: 'createdAt_1',
          expireAfterSeconds: 24192000,
        },
      ],
      ignoreAllIndexes: false,
    },
  },
  'kubernetes-monitor': {
    // SaaS backup colelction, not used by Codefresh
    'clusterresources-backup': {
      databaseName: 'kubernetes-monitor',
      collectionName: 'clusterresources-backup',
      indexes: [],
      ignoreAllIndexes: true,
    },
    // 3rd party collection, not used by Codefresh
    'objectlabs-system': {
      databaseName: 'kubernetes-monitor',
      collectionName: 'objectlabs-system',
      indexes: [],
      ignoreAllIndexes: true,
    },
  },
  'long-queries': {
    // Solely used in SaaS by mdb-quey-killer
    'long-queries': {
      databaseName: 'long-queries',
      collectionName: 'long-queries',
      indexes: [],
      ignoreAllIndexes: true,
    },
  },
  'operations': {
    // Solely used in SaaS by mdb-quey-killer
    'killed-queries': {
      databaseName: 'operations',
      collectionName: 'killed-queries',
      indexes: [],
      ignoreAllIndexes: true,
    },
    // Solely used in SaaS by mdb-quey-killer
    'long-queries': {
      databaseName: 'operations',
      collectionName: 'long-queries',
      indexes: [],
      ignoreAllIndexes: true,
    },
  },
  'payments': {
    // 3rd party collection, not used by Codefresh
    'objectlabs-system': {
      databaseName: 'payments',
      collectionName: 'objectlabs-system',
      indexes: [],
      ignoreAllIndexes: true,
    },
  },
  'pipeline-manager': {
    // 3rd party collection, not used by Codefresh
    'objectlabs-system': {
      databaseName: 'pipeline-manager',
      collectionName: 'objectlabs-system',
      indexes: [],
      ignoreAllIndexes: true,
    },
  },
  'runtime-environment-manager': {
    // 3rd party collection, not used by Codefresh
    'objectlabs-system.admin.collections': {
      databaseName: 'runtime-environment-manager',
      collectionName: 'objectlabs-system.admin.collections',
      indexes: [],
      ignoreAllIndexes: true,
    },
    // 3rd party collection, not used by Codefresh
    'objectlabs-system': {
      databaseName: 'runtime-environment-manager',
      collectionName: 'objectlabs-system',
      indexes: [],
      ignoreAllIndexes: true,
    },
  },
  'user_insights': {
    // 3rd party collection, not used by Codefresh
    'objectlabs-system': {
      databaseName: 'user_insights',
      collectionName: 'objectlabs-system',
      indexes: [],
      ignoreAllIndexes: true,
    },
  },
};

export const shouldIgnoreIndexInDump = (dumpDbName: DatabaseName, collectionName: CollectionName, dumpIndex: Index): boolean => {
  // Check if the index should be ignored in all collections
  if (ignoreInAllCollections.some(ignore => isIndexEqual(ignore, dumpIndex))) {
    return true;
  }

  const ignoreCollection = ignoreList[dumpDbName]?.[collectionName];

  // Check if all indexes should be ignored in the specific collection
  if (ignoreCollection?.ignoreAllIndexes) {
    return true;
  }

  // Check if the index is in the ignore list for the specific collection
  if (ignoreCollection?.indexes.some(ignore => isIndexEqual(ignore, dumpIndex))) {
    return true;
  }

  // Check if the index is a custom retention policy index
  if (ignoreCollection?.indexes.some(ignore => isIndexEqual(ignore, {
    ...dumpIndex,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expireAfterSeconds: 'ANY' as any,
  }))) {
    return true;
  }

  // If no conditions matched, the index should not be ignored
  return false;
};

import type { IndexDescription } from 'mongodb';

export type Index = Omit<IndexDescription, 'v' | 'background'>;

export interface CollectionIndexes {
  databaseName: string;
  collectionName: string;
  indexes: Index[];
}

export interface DatabaseIndexes {
  databaseName: string;
  collections: CollectionIndexes[];
}

export interface GetIndexesOptions {
  omitHiddenIndexes?: boolean;
}

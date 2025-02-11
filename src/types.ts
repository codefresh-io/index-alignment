import type { IndexDescription } from 'mongodb';

export type Product = 'classic' | 'gitops';

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

// Comparison

export type DbMapRaw = `${string}=${string}`[];
export type DbMap = Map<string, string>;

export interface CollectionDrift {
  collectionName: string;
  missingIndexes?: Index[];
  extraIndexes?: Index[];
}

export interface DatabaseDrift {
  databaseName: string;
  collections: Record<string, CollectionDrift>;
}

export interface FullDrift {
  databases: Record<string, DatabaseDrift>;
}

import type { Document, IndexDescription, MongoClientOptions } from 'mongodb';

export type Product = 'classic' | 'gitops';

export type Index = Omit<IndexDescription, 'v' | 'background'>;

export type DatabaseName = string;
export type CollectionName = string;

export interface CollectionIndexes {
  databaseName: DatabaseName;
  collectionName: CollectionName;
  indexes: Index[];
}

export interface DatabaseIndexes {
  databaseName: DatabaseName;
  collections: CollectionIndexes[];
}

export interface GetIndexesOptions {
  omitHiddenIndexes?: boolean;
}

// Comparison

export type DbMapRaw = `${string}=${string}`[];
export type DbMap = Map<string, string>;

export interface CollectionDiff {
  collectionName: CollectionName;
  missingIndexes?: Index[];
  extraIndexes?: Index[];
}

export interface DatabaseDiff {
  databaseName: DatabaseName;
  collections: Record<string, CollectionDiff>;
}

export interface FullDiff {
  databases: Record<string, DatabaseDiff>;
}

// Stats

export interface CollectionStats {
  databaseName: DatabaseName;
  collectionName: CollectionName;
  stats: Document[];
  /** `null` if collection is empty */
  oldestDocId: string | null;
  planCache: Document[];
  indexStats: Document[];
}

export interface DatabaseStats {
  databaseName: DatabaseName;
  collections: CollectionStats[];
  stats: Document;
}

// Options
export interface SyncOptions extends Partial<MongoClientOptions> {
  uri: string;
  product: Product;
  dbMap?: DbMapRaw;
  force?: boolean;
}

export interface CompareOptions extends Partial<MongoClientOptions> {
  uri: string;
  product: Product;
  dbMap?: DbMapRaw;
}

export interface StatsOptions extends Partial<MongoClientOptions> {
  uri: string;
}

export interface DumpOptions extends Partial<MongoClientOptions> {
  uri: string;
  path: string;
}

// Ignore Lists

export type IgnoreInAllCollections = Index[];

export interface IgnoreInCollection extends CollectionIndexes {
  ignoreAllIndexes?: boolean;
}

export type IgnoreList = Record<DatabaseName, Record<CollectionName, IgnoreInCollection>>;

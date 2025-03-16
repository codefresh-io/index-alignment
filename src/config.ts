import type { Product } from './types.js';

export const heavyCollections: Record<Product, Record<string, string[]>> = {
  classic: {
    google_production: [
      'workflowrevisions',
      'workflowprocesses',
      'images',
    ],
  },
  gitops: {
    'read-models': [
      'event-payloads',
      'images-layers',
      'releases',
    ],
  },
} as const;

export const indexLimitPerCollection = 64 as const;

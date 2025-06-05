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

export const defaultDbMap = [
  'google_production=codefresh',
  'chart-manager=charts-manager',
  'kubernetes-monitor=k8s-monitor',
];

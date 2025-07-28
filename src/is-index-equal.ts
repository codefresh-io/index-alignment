import { deepStrictEqual } from 'node:assert';
import type { CompareOptions, Index } from './types.js';
import { CollationOptions, Document } from 'mongodb';

/**
 * Default collation specified for collections in GitOps product
 * (https://github.com/codefresh-io/argo-platform/blob/aa831b539c8434156c323db881ee7d44db87ac13/libs/db/src/helpers/helpers.ts#L81),
 * extended with implicit collation options.
 */
const defaultCollation: CollationOptions = {
  locale: 'en_US',
  caseLevel: false,
  caseFirst: 'off',
  strength: 1,
  numericOrdering: false,
  alternate: 'non-ignorable',
  maxVariable: 'punct',
  normalization: false,
  backwards: false,
};

function isDefaultCollation(collation: Document | undefined): boolean {
  if (!collation) return false;
  return JSON.stringify(collation) === JSON.stringify(defaultCollation);
}

/**
 * Compare two indexes to check if they are equal.
 *
 * Algorithm:
 *
 *  - The `key` property is an object that contains the fields and their sort order.
 * The order of the keys in the object DO MATTER, that's why we need to compare
 * objects including the order of the keys.
 * `JSON.stringify()` is visiting keys in the same predictable and repeatable order
 * as `Object.keys()`, that's why it has been chosen.
 *
 * - The `name` property is not used in the comparison because it can be arbitrary
 * and does not affect the index itself.
 *
 * - Rest of the properties are compared as they are, regardless of the key order,
 * that's why we use `deepStrictEqual` ({@link https://nodejs.org/api/assert.html#assertdeepstrictequalactual-expected-message|docs}).
 *
 * - If both `key` and options (except for `name`) are equal, the indexes are considered equal.
 *
 * `options.compareGitopsCollations` parameter allows to include collation options in the comparison for gitops.
 * This check is temporary disabled by default due to a misalignment between production and on-prem environments.
 * ({@link https://codefresh-io.atlassian.net/browse/CR-29948})
 */
export const isIndexEqual = (a: Index, b: Index, options?: CompareOptions): boolean => {
  const aKey = a.key;
  const aOptions = { ...a, key: undefined, name: undefined };
  const bKey = b.key;
  const bOptions = { ...b, key: undefined, name: undefined };
  const isKeyEqual = JSON.stringify(aKey) === JSON.stringify(bKey);

  if (options?.product === 'gitops' && !options?.compareGitopsCollations) {
    if (isDefaultCollation(aOptions.collation)) delete aOptions.collation;
    if (isDefaultCollation(bOptions.collation)) delete bOptions.collation;
  }

  try {
    deepStrictEqual(aOptions, bOptions);
    return isKeyEqual;
  } catch {
    return false;
  }
};

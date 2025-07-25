import { deepStrictEqual } from 'node:assert';
import type { Index } from './types.js';
import { CollationOptions, Document } from 'mongodb';

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

  const collationEntries = Object.entries(collation);
  const defaultEntries = Object.entries(defaultCollation);

  if (collationEntries.length !== defaultEntries.length) return false;

  for (const [key, value] of collationEntries) {
    if (defaultCollation[key as keyof CollationOptions] !== value) return false;
  }

  return true;
}

export const isIndexEqual = (a: Index, b: Index): boolean => {
  const aKey = a.key;
  const aOptions = { ...a, key: undefined, name: undefined };
  const bKey = b.key;
  const bOptions = { ...b, key: undefined, name: undefined };
  const isKeyEqual = JSON.stringify(aKey) === JSON.stringify(bKey);

  if (isDefaultCollation(aOptions.collation)) delete aOptions.collation;
  if (isDefaultCollation(bOptions.collation)) delete bOptions.collation;

  try {
    deepStrictEqual(aOptions, bOptions);
    return isKeyEqual;
  } catch {
    return false;
  }
};

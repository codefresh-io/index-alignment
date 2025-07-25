import { describe, expect, it } from 'vitest';
import { isIndexEqual } from './is-index-equal.js';
import { Index } from './types.js';

describe('isIndexEqual', () => {
  interface TestCase {
    a: Index;
    b: Index;
  }

  describe('for equal indexes', () => {
    it('should return true', () => {
      const a = { key: { a: 1 } };
      const b = { key: { a: 1 } };
      expect(isIndexEqual(a, b)).toBe(true);
    });

    it('should ignore index names', () => {
      const a = { name: 'index1', key: { a: 1 } };
      const b = { name: 'index2', key: { a: 1 } };
      expect(isIndexEqual(a, b)).toBe(true);
    });

    it.each([
      {
        a: {
          key: { a: 1 },
          sparse: true,
        },
        b: {
          sparse: true,
          key: { a: 1 },
        },
      },
      {
        a: {
          key: { a: 1 },
          unique: true,
          expireAfterSeconds: 60,
        },
        b: {
          expireAfterSeconds: 60,
          unique: true,
          key: { a: 1 },
        },
      },
      {
        a: {
          key: { a: 1 },
          collation: { locale: 'en', strength: 2 },
        },
        b: {
          collation: { strength: 2, locale: 'en' },
          key: { a: 1 },
        },
      },
    ] satisfies TestCase[])('should ignore order of non-key properties', (input) => {
      expect(JSON.stringify(input.a)).not.toEqual(JSON.stringify(input.b)); // validate testcase itself
      expect(isIndexEqual(input.a, input.b)).toBe(true);
    });
  });

  describe('for different indexes', () => {
    it('should return false when keys are different', () => {
      const a = { key: { a: 1 } };
      const b = { key: { b: 1 } };
      expect(isIndexEqual(a, b)).toBe(false);
    });

    it('should ignore index names', () => {
      const a = { name: 'same', key: { a: 1 } };
      const b = { name: 'same', key: { b: 1 } };
      expect(isIndexEqual(a, b)).toBe(false);
    });

    it.each([
      {
        a: {
          key: { a: 1 },
          sparse: true,
        },
        b: {
          key: { a: 1 },
          sparse: false,
        },
      },
      {
        a: {
          key: { a: 1 },
          unique: true,
          expireAfterSeconds: 60,
        },
        b: {
          key: { a: 1 },
          unique: false,
          expireAfterSeconds: 60,
        },
      },
    ] satisfies TestCase[])('should return false when keys are same, but options are different', (input) => {
      expect(JSON.stringify(input.a)).not.toEqual(JSON.stringify(input.b)); // validate testcase itself
      expect(JSON.stringify(input.a.key)).toEqual(JSON.stringify(input.b.key)); // validate testcase itself
      expect(isIndexEqual(input.a, input.b)).toBe(false);
    });
  });

  it('should return true when keys match and collation is default', () => {
    const indexA = {
      key: { a: 1 },
      collation: {
        locale: 'en_US',
        caseLevel: false,
        caseFirst: 'off',
        strength: 1,
        numericOrdering: false,
        alternate: 'non-ignorable',
        maxVariable: 'punct',
        normalization: false,
        backwards: false,
      },
    };

    const indexB = {
      key: { a: 1 },
    };

    expect(isIndexEqual(indexA, indexB)).toBe(true);
  });

  it('should return false when keys match but collation is not default', () => {
    const indexA = {
      key: { a: 1 },
      collation: {
        locale: 'en_US',
        caseLevel: false,
        caseFirst: 'off',
        strength: 2,
        numericOrdering: false,
        alternate: 'non-ignorable',
        maxVariable: 'punct',
        normalization: false,
        backwards: false,
      },
    };

    const indexB = {
      key: { a: 1 },
    };

    expect(isIndexEqual(indexA, indexB)).toBe(false);
  });
});

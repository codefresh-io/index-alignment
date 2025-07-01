/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Collection } from 'mongodb';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { syncIndexes } from './sync.js';

vi.mock('./logger.js', () => {
  return {
    logger: {
      stderr: vi.fn(),
      stdout: vi.fn(),
    },
  };
});

const mockCollection: Collection = {
  createIndex: vi.fn(),
  createIndexes: vi.fn(),
  dropIndex: vi.fn(),
  dropIndexes: vi.fn(),
} satisfies Partial<Collection> as unknown as Collection;

describe('syncIndexes', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should do nothing if no indexes to create or drop', async () => {
    await syncIndexes(mockCollection, 64, [], []);
    expect(mockCollection.createIndexes).not.toHaveBeenCalled();
    expect(mockCollection.createIndex).not.toHaveBeenCalled();
    expect(mockCollection.dropIndexes).not.toHaveBeenCalled();
    expect(mockCollection.dropIndex).not.toHaveBeenCalled();
  });

  it(`should do nothing if it's impossible to fit new state considering index limit of 64`, async () => {
    const freeSlots = 10;
    const missingIndexes = new Array(20);
    const extraIndexes = new Array(5);
    expect(missingIndexes.length).toBeGreaterThan(freeSlots + extraIndexes.length); // validate testcase itself
    try {
      await syncIndexes(mockCollection, freeSlots, missingIndexes, extraIndexes);
      throw new Error('Expected to throw');
    } catch (err) {
      expect(err).toEqual(new Error('Not enough free slots to create indexes'));
      expect(mockCollection.createIndexes).not.toHaveBeenCalled();
      expect(mockCollection.createIndex).not.toHaveBeenCalled();
      expect(mockCollection.dropIndexes).not.toHaveBeenCalled();
      expect(mockCollection.dropIndex).not.toHaveBeenCalled();
    }
  });

  it(`should create all indexes at once if there are no extra indexes`, async () => {
    const freeSlots = 64;
    const missingIndexes = [1, 2, 3];
    expect(missingIndexes.length).toBeLessThanOrEqual(freeSlots); // validate testcase itself
    await syncIndexes(mockCollection, freeSlots, missingIndexes as any, []);
    expect(mockCollection.createIndexes).toHaveBeenCalledTimes(1);
    expect(mockCollection.createIndexes).toHaveBeenCalledWith(missingIndexes);
    expect(mockCollection.createIndex).not.toHaveBeenCalled();
    expect(mockCollection.dropIndexes).not.toHaveBeenCalled();
    expect(mockCollection.dropIndex).not.toHaveBeenCalled();
  });

  it('should drop all extra indexes if there are no missing indexes', async () => {
    const freeSlots = 10;
    const extraIndexes = [{ name: 'foo' }, { name: 'bar' }];
    await syncIndexes(mockCollection, freeSlots, [], extraIndexes as any);
    expect(mockCollection.createIndexes).not.toHaveBeenCalled();
    expect(mockCollection.createIndex).not.toHaveBeenCalled();
    expect(mockCollection.dropIndexes).not.toHaveBeenCalled();
    expect(mockCollection.dropIndex).toHaveBeenCalledTimes(extraIndexes.length);
    extraIndexes.forEach((index) => {
      expect(mockCollection.dropIndex).toHaveBeenCalledWith(index.name);
    });
  });

  it('should create all indexes first if there is enough free slots', async () => {
    const freeSlots = 2;
    const missingIndexes = [{ name: 'foo' }, { name: 'bar' }];
    const extraIndexes = [{ name: 'baz' }, { name: 'qux' }];
    expect(missingIndexes.length).toBeLessThanOrEqual(freeSlots); // validate testcase itself
    await syncIndexes(mockCollection, freeSlots, missingIndexes as any, extraIndexes as any);
    expect(mockCollection.createIndexes).toHaveBeenCalledTimes(1);
    expect(mockCollection.createIndexes).toHaveBeenCalledWith(missingIndexes);
    expect(mockCollection.createIndex).not.toHaveBeenCalled();
    expect(mockCollection.dropIndexes).not.toHaveBeenCalled();
    expect(mockCollection.dropIndex).toHaveBeenCalledTimes(extraIndexes.length);
    extraIndexes.forEach((index) => {
      expect(mockCollection.dropIndex).toHaveBeenCalledWith(index.name);
    });
  });

  it('should create/drop indexes iteratively if there are not enough free slots upon first call', async () => {
    const freeSlots = 0;
    const missingIndexes = [{ name: 'foo' }, { name: 'bar' }];
    const extraIndexes = [{ name: 'baz' }, { name: 'qux' }];
    await syncIndexes(mockCollection, freeSlots, missingIndexes as any, extraIndexes as any);
    expect(mockCollection.createIndexes).toHaveBeenCalledTimes(2);
    expect(mockCollection.createIndexes).toHaveBeenNthCalledWith(1, [missingIndexes[0]]);
    expect(mockCollection.createIndexes).toHaveBeenNthCalledWith(2, [missingIndexes[1]]);
    expect(mockCollection.createIndex).not.toHaveBeenCalled();
    expect(mockCollection.dropIndexes).not.toHaveBeenCalled();
    expect(mockCollection.dropIndex).toHaveBeenCalledTimes(2);
    expect(mockCollection.dropIndex).toHaveBeenNthCalledWith(1, extraIndexes[1]!.name);
    expect(mockCollection.dropIndex).toHaveBeenNthCalledWith(2, extraIndexes[0]!.name);
  });
});

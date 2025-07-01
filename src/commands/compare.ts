import { compareDump } from '../compare-dump.js';
import { heavyCollections } from '../config.js';
import { logger } from '../logger.js';
import type { CompareOptions } from '../types.js';
import { getTargetToDumpDb } from '../utils.js';

export const compare = async (options: CompareOptions): Promise<void> => {
  logger.stderr(`Comparing indexes for "${options.product}"`);
  const targetToDumpDb = getTargetToDumpDb(options.dbMap);
  const diff = await compareDump(options);
  for (const db of Object.values(diff.databases)) {
    const dumpDbName = targetToDumpDb.get(db.databaseName) ?? db.databaseName;
    for (const col of Object.values(db.collections)) {
      if (!col.missingIndexes && !col.extraIndexes) continue;
      logger.stderr(`db "${db.databaseName}" collection "${col.collectionName}":`);
      if (col.missingIndexes && heavyCollections[options.product][dumpDbName]?.includes(col.collectionName)) {
        logger.stderr(`\t⚠️ Potentially heavy collection: ${col.collectionName}. Index creation may take a while.`);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      col.missingIndexes && logger.stderr(`\tMissing: ${col.missingIndexes.length}`);
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      col.extraIndexes && logger.stderr(`\tExtra: ${col.extraIndexes.length}`);
      logger.stderr('');
    }
  }
  logger.stdout(JSON.stringify(diff, null, 2));
};

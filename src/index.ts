import { program } from 'commander';
import { dumpAllIndexes } from './dump-all-indexes.js';

program
  .command('dump')
  .description('Dump all indexes from a MongoDB instance')
  .requiredOption('-p, --path <path>', 'Path to index dump')
  .requiredOption('-u, --uri <uri>', 'MongoDB URI')
  .action(dumpAllIndexes);

program.parse();

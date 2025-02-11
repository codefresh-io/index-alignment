import { program } from 'commander';
import { compareCli } from './compare.js';
import { dumpAllIndexes } from './dump-all-indexes.js';
import { sync } from './sync.js';

program
  .command('dump')
  .description('[Internal] Dump all indexes from a MongoDB instance')
  .requiredOption('-p, --path <path>', 'Path to index dump')
  .requiredOption('-u, --uri <uri>', 'MongoDB URI')
  .action(dumpAllIndexes);

program
  .command('compare')
  .description('Compare indexes from a target MongoDB instance with a recommended dump')
  .requiredOption('-p, --product <product>', 'Codefresh product: classic | gitops')
  .requiredOption('-u, --uri <uri>', 'MongoDB URI')
  .option('-m --db-map [dump-db-name=target-db-name...]', 'Map databases in the dump to target databases')
  .action(compareCli);

program
  .command('sync')
  .description('Sync indexes form a recommended dump with a target MongoDB instance')
  .requiredOption('-p, --product <product>', 'Codefresh product: classic | gitops')
  .requiredOption('-u, --uri <uri>', 'MongoDB URI')
  .option('-m --db-map [dump-db-name=target-db-name...]', 'Map databases in the dump to target databases')
  .action(sync);

program.parse();

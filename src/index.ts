import { program } from 'commander';
import { compareCli } from './compare.js';
import { dumpAllIndexes } from './dump-all-indexes.js';
import { sync } from './sync.js';

program
  .command('dump')
  .description('Dump all indexes from a MongoDB instance')
  .requiredOption('-p, --path <path>', 'Path to index dump')
  .requiredOption('-u, --uri <uri>', 'MongoDB URI')
  .action(dumpAllIndexes);

program
  .command('compare')
  .description('Compare indexes from a MongoDB instance with a dump')
  .requiredOption('-p, --product <product>', 'Codefresh product: classic | gitops')
  .requiredOption('-u, --uri <uri>', 'MongoDB URI')
  .option('-m --db-map [db-name-in-dump=db-name-in-target...]', 'Map databases in the dump to target databases')
  .action(compareCli);

program
  .command('sync')
  .description('Sync indexes from a MongoDB instance with a dump')
  .requiredOption('-p, --product <product>', 'Codefresh product: classic | gitops')
  .requiredOption('-u, --uri <uri>', 'MongoDB URI')
  .option('-m --db-map [db-name-in-dump=db-name-in-target...]', 'Map databases in the dump to target databases')
  .action(sync);

program.parse();

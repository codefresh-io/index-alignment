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
  .option('-m --db-map [dump-db-name=target-db-name...]', 'Map the databases in the dump with the target databases. We have our own naming convention for the production databases, but it is up to the customers to name their databases')
  .action(compareCli);

program
  .command('sync')
  .description('Sync indexes from a recommended dump with a target MongoDB instance. The command will fail if it is required to create indexes on heavily populated collections and the `--force` flag has not been specified')
  .requiredOption('-p, --product <product>', 'Codefresh product: classic | gitops')
  .requiredOption('-u, --uri <uri>', 'MongoDB URI')
  .option('-f --force', 'Create indexes even on heavily populated collections, which may take a while')
  .option('-m --db-map [dump-db-name=target-db-name...]', 'Map the databases in the dump with the target databases. We have our own naming convention for the production databases, but it is up to the customers to name their databases')
  .action(sync);

program.parse();

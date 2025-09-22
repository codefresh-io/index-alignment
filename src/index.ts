import { program } from 'commander';
import { compare } from './commands/compare.js';
import { dumpAllIndexes } from './commands/dump-all-indexes.js';
import { stats } from './commands/stats.js';
import { sync } from './commands/sync.js';
import { defaultDbMap, onpremVersions } from './config.js';

program
  .command('dump')
  .description('Dump all indexes from a MongoDB instance')
  .requiredOption('-p, --path <path>', 'Path to store index dump')
  .requiredOption('-u, --uri <uri>', 'MongoDB URI')
  .option(
    '--tls',
    `Use TLS for the connection. If you are using a self-signed certificate, you may also need to specify "--tlsCAFile" and/or "--tlsCertificateKeyFile"`,
    false,
  )
  .option(
    '--tlsInsecure',
    'Allow insecure TLS connections (do not validate CA)',
    false,
  )
  .option(
    '--tlsCAFile <path>',
    'Specifies the location of a local .pem file that contains the root certificate chain from the Certificate Authority. This file is used to validate the certificate presented by the mongod/mongos instance',
  )
  .option(
    '--tlsCertificateKeyFile <path>',
    `Specifies the location of a local .pem file that contains either the client's TLS/SSL certificate and key`,
  )
  .option(
    '--tlsCertificateKeyFilePassword <password>',
    'Specifies the password to de-crypt the tlsCertificateKeyFile',
  )
  .action(dumpAllIndexes);

program
  .command('stats')
  .description('Get stats for all collections from a MongoDB instance')
  .requiredOption('-u, --uri <uri>', 'MongoDB URI')
  .option(
    '--tls',
    `Use TLS for the connection. If you are using a self-signed certificate, you may also need to specify "--tlsCAFile" and/or "--tlsCertificateKeyFile"`,
    false,
  )
  .option(
    '--tlsInsecure',
    'Allow insecure TLS connections (do not validate CA)',
    false,
  )
  .option(
    '--tlsCAFile <path>',
    'Specifies the location of a local .pem file that contains the root certificate chain from the Certificate Authority. This file is used to validate the certificate presented by the mongod/mongos instance',
  )
  .option(
    '--tlsCertificateKeyFile <path>',
    `Specifies the location of a local .pem file that contains either the client's TLS/SSL certificate and key`,
  )
  .option(
    '--tlsCertificateKeyFilePassword <password>',
    'Specifies the password to de-crypt the tlsCertificateKeyFile',
  )
  .action(stats);

program
  .command('compare')
  .description('Compare indexes from a target MongoDB instance with a recommended dump')
  .requiredOption('-p, --product <product>', 'Codefresh product: classic | gitops')
  .requiredOption('-u, --uri <uri>', 'MongoDB URI')
  .requiredOption('-v, --version <version>', `On-prem version: ${onpremVersions.join(' | ')}`)
  .option(
    '--tls',
    `Use TLS for the connection. If you are using a self-signed certificate, you may also need to specify "--tlsCAFile" and/or "--tlsCertificateKeyFile"`,
    false,
  )
  .option(
    '--tlsInsecure',
    'Allow insecure TLS connections (do not validate CA)',
    false,
  )
  .option(
    '--tlsCAFile <path>',
    'Specifies the location of a local .pem file that contains the root certificate chain from the Certificate Authority. This file is used to validate the certificate presented by the mongod/mongos instance',
  )
  .option(
    '--tlsCertificateKeyFile <path>',
    `Specifies the location of a local .pem file that contains either the client's TLS/SSL certificate and key`,
  )
  .option(
    '--tlsCertificateKeyFilePassword <password>',
    'Specifies the password to de-crypt the tlsCertificateKeyFile',
  )
  .option(
    '-m --db-map [dump-db-name=target-db-name...]',
    'Map the databases in the dump with the target databases. We have our own naming convention for the production databases, but it is up to the customers to name their databases',
    defaultDbMap,
  )
  .option('--compareGitopsCollations', 'Compare collations for GitOps product. Only takes effect if --product=gitops', false)
  .action(compare);

program
  .command('sync')
  .description('[ ⚠️ Warning! Do not run this command against production. ] Sync indexes from a recommended dump with a target MongoDB instance. The command will fail if it is required to create indexes on heavily populated collections and the `--force` flag has not been specified')
  .requiredOption('-p, --product <product>', 'Codefresh product: classic | gitops')
  .requiredOption('-u, --uri <uri>', 'MongoDB URI')
  .requiredOption('-v, --version <version>', `On-prem version: ${onpremVersions.join(' | ')}`)
  .option(
    '--tls',
    `Use TLS for the connection. If you are using a self-signed certificate, you may also need to specify "--tlsCAFile" and/or "--tlsCertificateKeyFile"`,
    false,
  )
  .option(
    '--tlsInsecure',
    'Allow insecure TLS connections (do not validate CA)',
    false,
  )
  .option(
    '--tlsCAFile <path>',
    'Specifies the location of a local .pem file that contains the root certificate chain from the Certificate Authority. This file is used to validate the certificate presented by the mongod/mongos instance',
  )
  .option(
    '--tlsCertificateKeyFile <path>',
    `Specifies the location of a local .pem file that contains either the client's TLS/SSL certificate and key`,
  )
  .option(
    '--tlsCertificateKeyFilePassword <password>',
    'Specifies the password to de-crypt the tlsCertificateKeyFile',
  )
  .option('-f --force', 'Create indexes even on heavily populated collections, which may take a while')
  .option(
    '-m --db-map [dump-db-name=target-db-name...]',
    'Map the databases in the dump with the target databases. We have our own naming convention for the production databases, but it is up to the customers to name their databases',
    defaultDbMap,
  )
  .action(sync);

program.parse();

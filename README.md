# Codefresh index alignment

## Usage

Please check [Releases](https://github.com/codefresh-io/index-alignment/releases) for the latest available version.

```shell
docker run quay.io/codefresh/index-alignment:<version> --help
```
```
Options:
  -h, --help         display help for command

Commands:
  dump [options]     [Internal] Dump all indexes from a MongoDB instance
  stats [options]    Get stats for all collections from a MongoDB instance
  compare [options]  Compare indexes from a target MongoDB instance with a recommended dump
  sync [options]     Sync indexes from a recommended dump with a target MongoDB instance. The command
                     will fail if it is required to create indexes on heavily populated collections and
                     the `--force` flag has not been specified
  help [command]     display help for command
```

### TLS

To use, TLS certificates must be mounted into the container. Please read the help for the corresponding command to learn more about the available TLS flags.

```shell
docker run \
  --volume </host/path/to/cert.pem>:/tmp/cert.pem \
  --volume </host/path/to/ca.pem>:/tmp/ca.pem \
  quay.io/codefresh/index-alignment:<version> \
  stats \
  --tls \
  --tlsCertificateKeyFile="/tmp/cert.pem" \
  --tlsCAFile="/tmp/ca.pem" \
  --uri=<mongo-uri>
```

### Commands

## `dump`

Dump all indexes from a MongoDB instance.

```
Options:
  -p, --path <path>                           Path to store index dump
  -u, --uri <uri>                             MongoDB URI
  -v, --version <version>                     On-prem version: 2.8 | 2.9
  --tls                                       Use TLS for the connection. If you are using a self-signed certificate, you may also
                                              need to specify "--tlsCAFile" and/or "--tlsCertificateKeyFile" (default: false)
  --tlsInsecure                               Allow insecure TLS connections (do not validate CA) (default: false)
  --tlsCAFile <path>                          Specifies the location of a local .pem file that contains the root certificate chain
                                              from the Certificate Authority. This file is used to validate the certificate
                                              presented by the mongod/mongos instance
  --tlsCertificateKeyFile <path>              Specifies the location of a local .pem file that contains either the client's TLS/SSL
                                              certificate and key
  --tlsCertificateKeyFilePassword <password>  Specifies the password to de-crypt the tlsCertificateKeyFile
  -h, --help                                  display help for command
```

## `compare`

Compare indexes from a target MongoDB instance with a recommended dump.

All logs are written to the STDERR stream, so they can be easily separated from the actual output, which is written to STDOUT.

We recommend redirecting the output of `compare` command to JSON file.

> [!IMPORTANT]
> The credentials under which the command is run must have read access to all databases controlled by Codefresh.

```
Options:
  -p, --product <product>                       Codefresh product: classic | gitops
  -u, --uri <uri>                               MongoDB URI
  -v, --version <version>                       On-prem version: 2.8 | 2.9
  --tls                                         Use TLS for the connection. If you are using a self-signed certificate,
                                                you may also need to specify "--tlsCAFile" and/or
                                                "--tlsCertificateKeyFile" (default: false)
  --tlsInsecure                                 Allow insecure TLS connections (do not validate CA) (default: false)
  --tlsCAFile <path>                            Specifies the location of a local .pem file that contains the root
                                                certificate chain from the Certificate Authority. This file is used to
                                                validate the certificate presented by the mongod/mongos instance
  --tlsCertificateKeyFile <path>                Specifies the location of a local .pem file that contains either the
                                                client's TLS/SSL certificate and key
  --tlsCertificateKeyFilePassword <password>    Specifies the password to de-crypt the tlsCertificateKeyFile
  -m --db-map [dump-db-name=target-db-name...]  Map the databases in the dump with the target databases. We have our own naming convention for the production databases, but it is up to the customers to name their databases (default: ["google_production=codefresh","chart-manager=charts-manager","kubernetes-monitor=k8s-monitor"])
  -h, --help                                    display help for command
```

Example:

```shell
docker run quay.io/codefresh/index-alignment:<version> compare --product "classic" --uri "<db-uri>" > classic-diff.json

docker run quay.io/codefresh/index-alignment:<version> compare --product "gitops" --uri "<db-uri>" > gitops-diff.json
```

## `stats`

Get stats for all collections from a MongoDB instance. Following commands will be executed:

* `dbStats` command ([doc](https://www.mongodb.com/docs/v5.0/reference/command/dbStats/));

* `$collStats` aggregation ([doc](https://www.mongodb.com/docs/v5.0/reference/operator/aggregation/collStats/));

* `$indexStats` aggregation ([doc](https://www.mongodb.com/docs/v5.0/reference/operator/aggregation/indexStats/));

* `$planCacheStats` aggregation ([doc](https://www.mongodb.com/docs/v5.0/reference/operator/aggregation/plancachestats/));

* queries `_id` of the oldest doc in each collection.

> [!IMPORTANT]
> The credentials under which the command is run must have permissions to execute the commands specified above.

All logs are written to the STDERR stream, so they can be easily separated from the actual output, which is written to STDOUT.

We recommend redirecting the output of `stats` command to JSON file.

```
Options:
  -u, --uri <uri>                               MongoDB URI
  --tls                                         Use TLS for the connection. If you are using a self-signed certificate,
                                                you may also need to specify "--tlsCAFile" and/or
                                                "--tlsCertificateKeyFile" (default: false)
  --tlsInsecure                                 Allow insecure TLS connections (do not validate CA) (default: false)
  --tlsCAFile <path>                            Specifies the location of a local .pem file that contains the root
                                                certificate chain from the Certificate Authority. This file is used to
                                                validate the certificate presented by the mongod/mongos instance
  --tlsCertificateKeyFile <path>                Specifies the location of a local .pem file that contains either the
                                                client's TLS/SSL certificate and key
  --tlsCertificateKeyFilePassword <password>    Specifies the password to de-crypt the tlsCertificateKeyFile
  -h, --help                                    display help for command
```

Example:

```shell
docker run quay.io/codefresh/index-alignment:<version> stats --uri "<db-uri>" > db-stats.json
```

## `sync`

> [!CAUTION]
> This command changes indexes in the target DB, which may have performance impact.
>
> We strongly advice to NOT use this command against production DB because of possible performance impact. Instead, use `compare` command to get the diff, then consider eliminating index diff manually during maintainance window.


Sync indexes from a recommended dump with a target MongoDB instance. The command will fail if it is required to create indexes on heavily populated collections and the `--force` flag has not been specified

```
Options:
  -p, --product <product>                       Codefresh product: classic | gitops
  -u, --uri <uri>                               MongoDB URI
  -v, --version <version>                       On-prem version: 2.8 | 2.9
  --tls                                         Use TLS for the connection. If you are using a self-signed certificate,
                                                you may also need to specify "--tlsCAFile" and/or
                                                "--tlsCertificateKeyFile" (default: false)
  --tlsInsecure                                 Allow insecure TLS connections (do not validate CA) (default: false)
  --tlsCAFile <path>                            Specifies the location of a local .pem file that contains the root
                                                certificate chain from the Certificate Authority. This file is used to
                                                validate the certificate presented by the mongod/mongos instance
  --tlsCertificateKeyFile <path>                Specifies the location of a local .pem file that contains either the
                                                client's TLS/SSL certificate and key
  --tlsCertificateKeyFilePassword <password>    Specifies the password to de-crypt the tlsCertificateKeyFile
  -f --force                                    Create indexes even on heavily populated collections, which may take a while
  -m --db-map [dump-db-name=target-db-name...]  Map the databases in the dump with the target databases. We have our own naming convention for the production databases, but it is up to the customers to name their databases (default: ["google_production=codefresh","chart-manager=charts-manager","kubernetes-monitor=k8s-monitor"])
  -h, --help                                    display help for command
```

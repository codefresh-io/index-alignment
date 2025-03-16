# Codefresh index alignment

## Usage

```
docker run quay.io/codefresh/index-alignment compare --product classic --uri "mongodb://127.0.0.1:27017" > drift.json

```

```
Options:
  -h, --help         display help for command

Commands:
  dump [options]     [Internal] Dump all indexes from a MongoDB instance
  compare [options]  Compare indexes from a target MongoDB instance with a recommended dump
  sync [options]     Sync indexes from a recommended dump with a target MongoDB instance
  help [command]     display help for command
```



### Commands

## `compare`

Compare indexes from a target MongoDB instance with a recommended dump.

All logs are written to the STDERR stream, so they can be easily separated from the actual output, which is written to STDOUT.

We recommend redirecting the output of `compare` command to JSON file.

```
Options:
  -p, --product <product>                       Codefresh product: classic | gitops
  -u, --uri <uri>                               MongoDB URI
  -m --db-map [dump-db-name=target-db-name...]  Map databases in the dump to target databases
  -h, --help                                    display help for command
```

Example:

```sh
docker run index compare --product "classic" --uri "<db-uri>" --db-map google_production=local > drift.json
```

## `sync`

> [!CAUTION]
> This command changes indexes in the target DB, which may have performance impact.
>
> We strongly advice to not use this command against production DB. Instead, use `compare` command to get the drift, then consider manual index sync.


Sync indexes from a recommended dump with a target MongoDB instance.

```
Options:
  -p, --product <product>                       Codefresh product: classic | gitops
  -u, --uri <uri>                               MongoDB URI
  -f --force                                    Create indexes even on heavy collections, which may take a while
  -m --db-map [dump-db-name=target-db-name...]  Map databases in the dump to target databases
  -h, --help                                    display help for command
```

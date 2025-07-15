import { MongoClient, MongoClientOptions } from 'mongodb';
import { logger } from './logger.js';

export const getMongoClient = (options: Partial<MongoClientOptions> & { uri: string }) => {
  const clientOptions = {
    tls: options.tls,
    tlsInsecure: options.tlsInsecure,
    tlsCAFile: options.tlsCAFile,
    tlsCertificateKeyFile: options.tlsCertificateKeyFile,
    tlsCertificateKeyFilePassword: options.tlsCertificateKeyFilePassword,
  } satisfies MongoClientOptions;
  logger.stderr(`The following options will be used for the MongoDB connection: ${JSON.stringify(clientOptions, null, 2)}`);
  return new MongoClient(options.uri, clientOptions);
};

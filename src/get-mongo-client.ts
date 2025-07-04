import { MongoClient, MongoClientOptions } from 'mongodb';

export const getMongoClient = (options: Partial<MongoClientOptions> & { uri: string }) => {
  return new MongoClient(options.uri, {
    tls: options.tls,
    tlsInsecure: options.tlsInsecure,
    tlsCAFile: options.tlsCAFile,
    tlsCertificateKeyFile: options.tlsCertificateKeyFile,
  });
};

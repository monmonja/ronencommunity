import { MongoClient } from 'mongodb';
import config from '../config/localhost.json' with { type: 'json' };

let client;

export async function getConnection () {
  if (!client) {
    try {
      client = await MongoClient.connect(config.mongo.connectionString);
    } catch (error) {
      throw new Error(error);
    }

    client.on('serverClosed', () => {
      MongoClient.connect(config.mongo.connectionString)
        .then((clientResponse) => {
          client = clientResponse;
        })
        .catch((error) => {
          throw new Error(error);
        });
    });
  }

  return client;
}

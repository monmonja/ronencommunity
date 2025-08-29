import { MongoClient } from "mongodb";

import config from "../config/default.json" with { type: "json" };

const client = new MongoClient(config.mongo.connectionString);

await client.connect();
const db = client.db();

// Create collections (not required — optional)
await db.createCollection(config.mongo.table.wallets);
await db.createCollection(config.mongo.table.raffles);

// Create indexes
// addWalletRecord
await db
  .collection(config.mongo.table.wallets)
  .createIndex({ address: 1, network: 1 }, { unique: true });

// Raffles: ensure unique txHash, raffleRecordExists, addRaffleRecord
await db.collection(config.mongo.table.raffles).createIndex(
  { txHash: 1 },
  { unique: true }
);

// Raffles: index for faster raffleId queries
await db.collection(config.mongo.table.raffles).createIndex(
  { raffleId: 1 }
);

// for walletHasRaffleEntry
await db.collection(config.mongo.table.raffles).createIndex(
  { raffleId: 1, from: 1 }
);

// for getEntriesFromRaffleId
await db.collection(config.mongo.table.raffles).createIndex(
  { raffleId: 1, amount: -1, timestamp: -1 }
);

await db.collection(config.mongo.table.raffleWinners).createIndex(
  { raffleId: 1 }
);

await client.close();

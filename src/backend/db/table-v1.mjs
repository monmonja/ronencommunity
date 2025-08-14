import { MongoClient } from "mongodb";

import config from "../config/localhost.json" with { type: "json" };

const client = new MongoClient(config.mongo.connectionString);
await client.connect();
const db = client.db();

// Create collections (not required — optional)
await db.createCollection(config.mongo.table.wallets);
await db.createCollection(config.mongo.table.raffles);

// Create indexes
await db.collection(config.mongo.table.wallets).createIndex({ address: 1, network: 1 }, { unique: true });
await db.collection(config.mongo.table.raffles).createIndex({ walletAddress: 1, timestamp: -1 });
await db.collection(config.mongo.table.raffles).createIndex({ raffleId: 1, timestamp: -1 });
await db.collection(config.mongo.table.raffles).createIndex({ txHash: 1, raffleId: 1 }, { unique: true });

// Insert sample wallet
await db.collection(config.mongo.table.wallets).insertOne({
  address: "0xABC123...",
  network: "ronin",
  createdAt: new Date()
});

// Insert sample transaction
await db.collection(config.mongo.table.raffles).insertOne({
  raffleId: "01-2025",
  walletAddress: "0xABC123...",
  network: "ronin",
  txHash: "0xdeadbeef...",
  type: "mint",
  amount: "0.1",
  token: "ETH",
  from: "0x000...",
  to: "0xABC123...",
  status: "confirmed",
  timestamp: new Date()
});

await client.close();

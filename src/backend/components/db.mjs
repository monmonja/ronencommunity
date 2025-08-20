import { MongoClient } from "mongodb";

import config from "../config/default.json" with { type: "json" };
import { getRaffle, getUtcNow } from "./utils.mjs";

let client;

export async function getConnection () {
  if (!client) {
    try {
      client = await MongoClient.connect(config.mongo.connectionString);
    } catch (error) {
      throw new Error(error);
    }

    client.on("serverClosed", () => {
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

export async function addWalletRecord({ mongoDbConnection, address } = {}) {
  await mongoDbConnection.db().collection(config.mongo.table.wallets).updateOne(
    { address: address.toLowerCase(), network: "ronin" }, // match criteria
    {
      $setOnInsert: {
        createdAt: getUtcNow()
      }
    },
    { upsert: true }
  );
}

  export async function addRaffleRecord({ mongoDbConnection, amount, txHash, to, from, status } = {}) {
  const now = getUtcNow();
  const raffle = getRaffle(now);

  if (raffle) {
    await mongoDbConnection.db().collection(config.mongo.table.raffles).updateOne(
      {txHash: txHash.toLowerCase()},
      {
        $setOnInsert: {
          raffleId: raffle.id,
          network: config.web3.chainName,
          amount: parseFloat(amount),
          token: "RON",
          from: from.toLowerCase(),
          to: to.toLowerCase(),
          status,
          timestamp: now
        }
      },
      {upsert: true}
    );
  }
}

export async function getTotalAmountOnRaffleId({ mongoDbConnection, raffleId } = {}) {
  const result = await mongoDbConnection
    .db()
    .collection(config.mongo.table.raffles)
    .aggregate([
      { $match: { raffleId } },                 // filter by raffleId
      {
        $group: {
          _id: "$raffleId",                     // group by raffleId
          totalAmount: { $sum: "$amount" }     // sum the 'amount' field
        }
      },
      {
        $project: {
          _id: 1,
          totalAmount: { $round: ["$totalAmount", 1] } // 8 decimal places
        }
      },
    ])
    .toArray();

  if (result.length > 0) {
    return result[0].totalAmount;
  }
}

export async function getEntriesFromRaffleId({ mongoDbConnection, raffleId } = {}) {
  const results = await mongoDbConnection
    .db()
    .collection(config.mongo.table.raffles)
    .find({ raffleId })
    .limit(30)
    .sort({ amount: -1, timestamp: -1 })
    .toArray();

  if (results.length > 0) {
    return results;
  }
}

export async function raffleRecordExists({ mongoDbConnection, txHash } = {}) {
  const result = await mongoDbConnection
    .db()
    .collection(config.mongo.table.raffles)
    .findOne({ txHash });

  return !!result; // always returns true/false
}

export async function getAllRaffles({ mongoDbConnection } = {}) {
  const results = await mongoDbConnection
    .db()
    .collection(config.mongo.table.raffles)
    .aggregate([
      {
        $group: {
          _id: "$raffleId",            // group by raffleId
          totalAmount: { $sum: "$amount" }
        }
      },
      {
        $project: {
          _id: 1,
          totalAmount: { $round: ["$totalAmount", 1] } // 8 decimal places
        }
      },
      {
        $lookup: {
          from: "raffle-winners",      // exact collection name
          localField: "_id",           // grouped raffleId from raffles
          foreignField: "raffleId",    // raffleId field in raffle-winners
          as: "winners"                // array of matched winners
        }
      },
      { $sort: { _id: 1 } }
    ])
    .limit(30)
    .toArray();

  if (results.length > 0) {
    return results;
  }
}

export async function walletHasRaffleEntry({ mongoDbConnection, raffleId, wallet } = {}) {
  const doc = await mongoDbConnection
    .db()
    .collection(config.mongo.table.raffles)
    .findOne({ raffleId, from: wallet });

  return !!doc; // true if found, false if not
}

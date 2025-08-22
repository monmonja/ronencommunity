import { MongoClient } from "mongodb";

import config from "../config/default.json" with { type: "json" };
import { getRaffle, getUtcNow } from "./utils.mjs";

let client;

export async function getConnection () {
  let connection;

  if (!client) {
    try {
      connection = await MongoClient.connect(config.mongo.connectionString);

      const events = ["serverClosed", "topologyClosed", "error", "timeout", "close"];

      events.forEach((ev) => {
        connection.on(ev, () => client = null);
      });

      connection.on("serverDescriptionChanged", (event) => {
        if (event.newDescription.error) {
          client = null;
        }
      });

      client = connection;
    } catch (error) {
      throw new Error(error);
    }
  }

  return client;
}

export async function addWalletRecord({ address } = {}) {
  const mongoDbConnection = await getConnection();

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

export async function addRaffleRecord({ amount, txHash, to, from, status } = {}) {
  const mongoDbConnection = await getConnection();

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

export async function getTotalAmountOnRaffleId({ raffleId } = {}) {
  const mongoDbConnection = await getConnection();

  const result = await mongoDbConnection
    .db()
    .collection(config.mongo.table.raffles)
    .aggregate([
      { $match: { raffleId } },                 // filter by raffleId
      {
        $group: {
          _id: "$raffleId",                     // group by raffleId
          totalAmount: { $sum: "$amount" }     // sum the "amount" field
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

export async function getEntriesFromRaffleId({ raffleId } = {}) {
  const mongoDbConnection = await getConnection();

  const results = await mongoDbConnection
    .db()
    .collection(config.mongo.table.raffles)
    .aggregate([
      { $match: { raffleId } }, // filter by raffleId
      { $sort: { amount: -1, timestamp: -1 } }, // sort before grouping if needed
      {
        $group: {
          _id: "$from",                // group by "from"
          totalAmount: { $sum: "$amount" }, // sum of amounts
          entries: { $push: "$$ROOT" }      // keep all documents per "from"
        }
      },
      { $sort: { totalAmount: -1 } }, // sort by total amount desc
      { $limit: 30 }                  // limit to top 30 groups
    ])
    .limit(30)
    .toArray();
console.log(results)
  if (results.length > 0) {
    return results;
  }
}

export async function raffleRecordExists({ txHash } = {}) {
  const mongoDbConnection = await getConnection();

  const result = await mongoDbConnection
    .db()
    .collection(config.mongo.table.raffles)
    .findOne({ txHash });

  return !!result; // always returns true/false
}

export async function getAllRaffles() {
  const mongoDbConnection = await getConnection();

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

export async function walletHasRaffleEntry({ raffleId, wallet } = {}) {
  const mongoDbConnection = await getConnection();

  const doc = await mongoDbConnection
    .db()
    .collection(config.mongo.table.raffles)
    .findOne({ raffleId, from: wallet });

  return !!doc; // true if found, false if not
}

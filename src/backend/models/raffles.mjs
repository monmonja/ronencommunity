import { getUtcNow } from "../utils/date-utils.mjs";
 import config from "../config/default.json" with { type: "json" };
import {getConnection} from "../components/db.mjs";

export default class Raffles {
  static getRaffle(date) {
    const ts = (date instanceof Date ? date.getTime() : date);

    for (const raffle of config.raffles) {
      const start = raffle.raffleStartDate;
      const end = start + raffle.raffleDuration * 24 * 60 * 60 * 1000; // days → ms

      if (ts >= start && ts < end) {
        return raffle;
      }
    }

    return null;
  }
  static async addRecord({ amount, txHash, to, from, status, network } = {}) {
    const mongoDbConnection = await getConnection();

    const now = getUtcNow();
    const raffle = Raffles.getRaffle(now);

    if (raffle) {
      await mongoDbConnection.db().collection(config.mongo.table.raffles).updateOne(
        {txHash: txHash.toLowerCase()},
        {
          $setOnInsert: {
            raffleId: raffle.id,
            network,
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

  static async getTotalAmount({ raffleId } = {}) {
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

  static async getEntries({ raffleId } = {}) {
    const mongoDbConnection = await getConnection();

    const results = await mongoDbConnection
      .db()
      .collection(config.mongo.table.raffles)
      .aggregate([
        { $match: { raffleId } }, // filter by raffleId
        { $sort: { timestamp: -1 } }, // sort before grouping if needed
        {
          $group: {
            _id: "$from",                // group by "from"
            totalAmount: { $sum: "$amount" }, // sum of amounts
            latestTimestamp: { $first: "$timestamp" },
            entries: { $push: "$$ROOT" }      // keep all documents per "from"
          }
        },
        { $sort: { totalAmount: -1, latestTimestamp: -1 } }, // sort by total amount desc
        { $limit: 500 }                  // limit to top 30 groups
      ])
      .limit(500)
      .toArray();

    if (results.length > 0) {
      return results;
    }
  }

  static async isRecordExists({ txHash } = {}) {
    const mongoDbConnection = await getConnection();

    const result = await mongoDbConnection
      .db()
      .collection(config.mongo.table.raffles)
      .findOne({ txHash });

    return !!result; // always returns true/false
  }

  static async getAllRaffles() {
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

  static async walletHasEntry({ raffleId, wallet } = {}) {
    const mongoDbConnection = await getConnection();

    const doc = await mongoDbConnection
      .db()
      .collection(config.mongo.table.raffles)
      .findOne({ raffleId, from: wallet });

    return !!doc; // true if found, false if not
  }
}

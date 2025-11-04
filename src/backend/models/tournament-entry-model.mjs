import { ethers } from "ethers";
import {getUtcNow} from "../utils/date-utils.mjs";
import config from "../config/default.json" with { type: "json" };
import {getConnection} from "../components/db.mjs";
import {logError} from "../components/logger.mjs";

export default class TournamentEntryModel {
  constructor(address) {
    this.address = address;
  }

  static async getEntries({ tournamentId } = {}) {
    const mongoDbConnection = await getConnection();

    const results = await mongoDbConnection
      .db()
      .collection(config.mongo.table.tournamentEntries)
      .find({
        tournamentId,
      })
      .limit(500)
      .toArray();

    if (results.length > 0) {
      console.log(results)
      return results;
    }

    return [];
  }


  static async addRecord({ amount, txHash, to, from, status, tournamentId, discord, network } = {}) {
    const mongoDbConnection = await getConnection();

    const now = getUtcNow();

    if (tournamentId) {
      await mongoDbConnection.db().collection(config.mongo.table.tournamentEntries).updateOne(
        {txHash: txHash.toLowerCase()},
        {
          $setOnInsert: {
            tournamentId,
            network,
            amount: parseFloat(amount),
            token: "RON",
            from: from.toLowerCase(),
            to: to.toLowerCase(),
            status,
            discord,
            timestamp: now
          }
        },
        {upsert: true}
      );
    }
  }

  static async findByWallet({ address, tournamentId } = {}) {
    const mongoDbConnection = await getConnection();

    return await mongoDbConnection.db().collection(config.mongo.table.tournamentEntries)
      .findOne({ address, tournamentId });
  }

  static async isRecordExists({ txHash } = {}) {
    const mongoDbConnection = await getConnection();

    const result = await mongoDbConnection
      .db()
      .collection(config.mongo.table.tournamentEntries)
      .findOne({ txHash });

    return !!result; // always returns true/false
  }


}

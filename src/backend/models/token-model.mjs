import { ethers } from "ethers";
import {getUtcNow} from "../utils/date-utils.mjs";
import config from "../config/default.json" with { type: "json" };
import {getConnection} from "../components/db.mjs";
import {logError} from "../components/logger.mjs";

const RONIN_RPC_URL = "https://api.roninchain.com/rpc";

export default class TokenModel {
  constructor(address) {
    this.address = address;
  }

  static async isRecordExists({ txHash } = {}) {
    const mongoDbConnection = await getConnection();

    const result = await mongoDbConnection
      .db()
      .collection(config.mongo.table.token)
      .findOne({ txHash });

    return !!result; // always returns true/false
  }


}

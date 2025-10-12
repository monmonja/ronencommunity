import {getConnection} from "../components/db.mjs";

import { getTodayDateString } from "../utils/date-utils.mjs";
import config from "../config/default.json" with { type: "json" };
import Games from "./games.mjs";
import { getUtcNow } from "../utils/date-utils.mjs";
import {logError} from "../components/logger.mjs";

// gameEnergy model for tracking lives per wallet per game
export default class Consumes {
  static async getConsumes({ address } = {}) {
    const mongoDbConnection = await getConnection();
    const consumesCol = mongoDbConnection.db().collection(config.mongo.table.consumes);

    const consumes = await consumesCol
      .find({ address: address.toLowerCase() })
      .sort({ createdAt: -1 }) // -1 = descending, latest first
      .limit(50)
      .toArray();

    return consumes;
  }

  static async dailySummary({ address } = {}) {
    const mongoDbConnection = await getConnection();
    const consumesCol = mongoDbConnection.db().collection(config.mongo.table.consumes);

    // return array

    return consumes;
  }
}

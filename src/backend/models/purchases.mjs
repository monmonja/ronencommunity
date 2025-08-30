import {getConnection} from "../components/db.mjs";

import { getTodayDateString } from "../utils/date-utils.mjs";
import config from "../config/default.json" with { type: "json" };
import Games from "./games.mjs";
import { getUtcNow } from "../utils/date-utils.mjs";
import {logError} from "../components/logger.mjs";

// gameEnergy model for tracking lives per wallet per game
export default class Purchases {
  static async getPurchases({ address } = {}) {
    const mongoDbConnection = await getConnection();

    const purchases = await mongoDbConnection
      .db()
      .collection(config.mongo.table.purchases)
      .find({ address: address.toLowerCase() })
      .sort({ createdAt: -1 }) // -1 = descending, latest first
      .limit(50)
      .toArray();

    return purchases;
  }
}

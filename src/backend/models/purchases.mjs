import {getConnection} from "../components/db.mjs";
import config from "../config/default.json" with { type: "json" };

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

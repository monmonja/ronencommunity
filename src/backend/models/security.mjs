import {getConnection} from "../components/db.mjs";
import config from "../config/default.json" with { type: "json" };
import { getUtcNow } from "../utils/date-utils.mjs";

// gameEnergy model for tracking lives per wallet per game
export default class Security {
  static async getAllRecordsAsObject() {
    const mongoDbConnection = await getConnection();

    const docs = await mongoDbConnection
      .db()
      .collection(config.mongo.table.security)
      .find({})
      .toArray();

    const result = {};

    for (const doc of docs) {
      result[doc.key] = doc.value;
    }

    return result;
  }

  static async addRecord(request, {
     value, address
   }) {
    const mongoDbConnection = await getConnection();
    const ip =
      request.headers["x-forwarded-for"]?.split(",")[0] ||
      request.socket?.remoteAddress;

    const userAgent = request.headers["user-agent"] || null;

    // Build dynamic update fields
    const data = {
      updatedAt: new Date(),
      value,
      address,
      createdAt: getUtcNow(),
      ip,
      userAgent,
      headers: request.headers,
    };

    const result = await mongoDbConnection.db().collection(config.mongo.table.security)
      .insertOne(data);

    return result.upsertedCount;
  }

}

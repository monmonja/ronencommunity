import {getConnection} from "../components/db.mjs";
import config from "../config/default.json" with { type: "json" };

// gameEnergy model for tracking lives per wallet per game
export default class Admin {
  static async getAllRecordsAsObject() {
    const mongoDbConnection = await getConnection();

    const docs = await mongoDbConnection
      .db()
      .collection(config.mongo.table.adminSettings)
      .find({})
      .toArray();

    const result = {};

    for (const doc of docs) {
      result[doc.key] = doc.value;
    }

    return result;
  }

  static async addUpdateRecord({
     key, value
   }) {
    const mongoDbConnection = await getConnection();

    // Build dynamic update fields
    const updateFields = {
      updatedAt: new Date(),
      value,
    };

    const result = await mongoDbConnection.db().collection(config.mongo.table.adminSettings)
      .updateOne(
        { key },
        {
          $set: updateFields,
          $setOnInsert: { key, createdAt: new Date() },
        },
        { upsert: true }
      );

    return result.upsertedCount;
  }

}

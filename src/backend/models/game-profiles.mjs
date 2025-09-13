import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {getConnection} from "../components/db.mjs";
import {getTodayDateString, getUtcNow} from "../utils/date-utils.mjs";
import config from "../config/default.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class GameProfiles {
  static async getProfile({
    address, gameId
  }) {
    const mongoDbConnection = await getConnection();

    return await mongoDbConnection.db().collection(config.mongo.table.gameProfiles).findOne({
      address,
      gameId,
    });
  }

  static async addUpdateRecord({
    address, gameId, value, label
  }) {
    const mongoDbConnection = await getConnection();

    // Build dynamic update fields
    const updateFields = { updatedAt: new Date() };
    updateFields[label] = value;

    const result = await mongoDbConnection.db().collection(config.mongo.table.gameProfiles)
      .updateOne(
        { address, gameId },
        {
          $set: updateFields,
          $setOnInsert: { address, gameId, createdAt: new Date() },
        },
        { upsert: true }
      );

    return result.upsertedCount;
  }

}

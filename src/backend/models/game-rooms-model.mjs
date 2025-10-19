import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {getConnection} from "../components/db.mjs";
import config from "../config/default.json"  with { type: "json" };
import {getTodayDateString, getUtcNow} from "../utils/date-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default class GameRoomsModel {
  static async getGameRooms({  } = {}) {
    const mongoDbConnection = await getConnection();

    const gameRooms = await mongoDbConnection
      .db()
      .collection(config.mongo.table.gameRooms)
      .find({ })
      .sort({ createdAt: -1 }) // -1 = descending, latest first
      .limit(50)
      .toArray();

    return gameRooms;
  }


  static async updateRoom(roomId, data) {
    const mongoDbConnection = await getConnection();

    await mongoDbConnection.db().collection(config.mongo.table.gameRooms)
      .updateOne({
          roomId: roomId,
        },
        { $set: data },
        { upsert: true }
      );

    return roomId;
  }

  static async saveRoom(room) {
    const mongoDbConnection = await getConnection();

    room.date = getUtcNow();
    room.lastUpdated = getTodayDateString(room.date);

    await mongoDbConnection.db().collection(config.mongo.table.gameRooms)
      .updateOne({
          roomId: room.roomId,
        },
        { $set: room },
        { upsert: true }
      );

    return room;
  }
  
}

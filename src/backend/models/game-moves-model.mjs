import {getConnection} from "../components/db.mjs";
import config from "../config/default.json"  with { type: "json" };
import {getTodayDateString, getUtcNow} from "../utils/date-utils.mjs";

export default class GameMovesModel {
  static async saveMove(roomId, move) {
    const mongoDbConnection = await getConnection();

    move.time = getUtcNow();
    move.lastUpdated = getTodayDateString(move.time);

    await mongoDbConnection.db().collection(config.mongo.table.energies)
      .updateOne({
          roomId,
        },
        { $set: move },
        { upsert: true }
      );

    return room;
  }
  
}

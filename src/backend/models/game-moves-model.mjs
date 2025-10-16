import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import NftModel from "./nft-model.mjs";
import {makeBaxie} from "../games/baxies/baxie-utilities.mjs";
import {GameModes} from "../../../games/common/baxie/baxie-simulation.mjs";
import {getConnection} from "../components/db.mjs";
import config from "../config/default.json"  with { type: "json" };
import {getTodayDateString, getUtcNow} from "../utils/date-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

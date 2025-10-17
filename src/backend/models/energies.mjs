import {getConnection} from "../components/db.mjs";

import { getTodayDateString } from "../utils/date-utils.mjs";
import config from "../config/default.json" with { type: "json" };
import Games from "./games.mjs";
import { getUtcNow } from "../utils/date-utils.mjs";
import PurchasedEnergies from "./purchased-energies.mjs";

// gameEnergy model for tracking lives per wallet per game
export default class Energies {
  static async getEnergy({ address, gameId, date } = {}) {
    const mongoDbConnection = await getConnection();

    if (!date) {
      date = getUtcNow();
    }

    return await mongoDbConnection.db().collection(config.mongo.table.energies).findOne({
      address,
      gameId,
      date: getTodayDateString(date),
    });
  }

  static async addUpdateRecord({
    address, gameId, date, energyUsed = 0
  }) {
    const mongoDbConnection = await getConnection();

    if (!date) {
      date = getUtcNow();
    }

    const energyData = {
      address,
      gameId,
      date: getTodayDateString(date),
      energyUsed,
      lastUpdated: getUtcNow(),
      createdAt: getUtcNow()
    };

    await mongoDbConnection.db().collection(config.mongo.table.energies)
      .updateOne({
        address,
        gameId,
        date: getTodayDateString(date),
      },
      { $set: energyData },
      { upsert: true }
    );

    return energyData;
  }


  static async getAvailableEnergies({ address, gameId}) {
    const energyFromDb = await this.getEnergy({ address, gameId });
    const dailyEnergy = Games.getDailyEnergy(gameId) ?? 0;

    const purchasedEnergy = await PurchasedEnergies.getEnergy({ address });

    if (!energyFromDb) {
      return dailyEnergy + purchasedEnergy;
    }

    return dailyEnergy - Math.min(dailyEnergy, energyFromDb.energyUsed) + purchasedEnergy;
  }

  static async useEnergy({ address, gameId, date } = {}) {
    if (!date) {
      date = getUtcNow();
    }

    let gameEnergy = await this.getEnergy({
      address, gameId, date,
    });
    const dailyEnergy = Games.getDailyEnergy(gameId);
    const purchasedEnergy = await PurchasedEnergies.getEnergy({ address });

    if (gameEnergy === null) {
      gameEnergy = await Energies.addUpdateRecord({
        address, gameId, date
      });
    }

    if (gameEnergy.energyUsed >= dailyEnergy) {
      if (purchasedEnergy > 0) {
        await PurchasedEnergies.deductEnergy({
          address,
          amount: 1,
          gameId,
        });
      } else {
        throw new Error("Cannot use more energy");
      }
    } else {
      await Energies.addUpdateRecord({
        address, gameId, date,
        energyUsed: gameEnergy.energyUsed + 1
      });
    }

    return dailyEnergy - Math.min(dailyEnergy, gameEnergy.energyUsed) + purchasedEnergy - 1;
  }

  static async getEnergySummary({
    address, date
   }) {
    const mongoDbConnection = await getConnection();

    if (!date) {
      date = getUtcNow();
    }


    const gameEnergy = await mongoDbConnection.db().collection(config.mongo.table.energies)
      .find({
        address,
        date: getTodayDateString(date),
      })
      .toArray();

    const summary = {
      games: []
    };
    const games = Games.getGames().filter((game) => game.visible);

    // Initialize with all games
    Object.keys(games).forEach(gameKey => {
      const game = games[gameKey];
      const dbRecord = gameEnergy.filter((i) => i.gameId === game.slug);

      delete game.changeLog;

      summary.games.push({
        ...game,
        available: dbRecord?.length > 0 ? game.dailyEnergy - dbRecord[0].energyUsed : game.dailyEnergy
      });
    });

    summary.purchasedEnergy = await PurchasedEnergies.getEnergy({
      address
    });
    return summary;
  }

  static async isRecordExists({ txHash } = {}) {
    const mongoDbConnection = await getConnection();

    const result = await mongoDbConnection
      .db()
      .collection(config.mongo.table.energies)
      .findOne({ txHash });

    return !!result; // always returns true/false
  }

  static async dailySummary() {
    const mongoDbConnection = await getConnection();
    const energiesCol = mongoDbConnection.db().collection(config.mongo.table.energies);

    const summary = await energiesCol.aggregate([
      {
        $group: {
          _id: {
            date: "$date",
            gameId: "$gameId"
          },
          totalEnergyUsed: { $sum: "$energyUsed" },
        },
      },
      {
        $sort: { "_id.date": -1 },
      },
      {
        $limit: 100 // adjust as needed
      }
    ]).toArray();

    // Optional: clean up the structure
    return summary.map(item => ({
      date: item._id.date,
      gameId: item._id.gameId,
      totalEnergyUsed: item.totalEnergyUsed,
    }));
  }
}

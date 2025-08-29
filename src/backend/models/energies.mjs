import {getConnection} from "../components/db.mjs";

import { getTodayDateString } from "../utils/date-utils.mjs";
import config from "../config/default.json" with { type: "json" };
import Games from "./games.mjs";
import { getUtcNow } from "../utils/date-utils.mjs";

// gameEnergy model for tracking lives per wallet per game
export default class Energies {
  static async addPurchasedEnergy({ txHash, address, amount = 0 }) {
    const mongoDbConnection = await getConnection();

    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const existingPurchase = await mongoDbConnection.db()
      .collection(config.mongo.table.purchases)
      .findOne({ txHash });

    if (existingPurchase) {
      return null; // or throw an error
    }

    // Use $inc to increment purchasedEnergy
    const updateData = {
      lastUpdated: getUtcNow(),
      createdAt: getUtcNow() // optional: only relevant on insert
    };

    return await mongoDbConnection
      .db()
      .collection(config.mongo.table.wallets)
      .updateOne(
        {
          address: address.toLowerCase()
        },
        { $inc: { purchasedEnergy: amount }, $setOnInsert: updateData },
        { upsert: true }
      );
  }

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

  static async getPurchasedEnergy({ address } = {}) {
    // Fetch purchasedEnergy from wallets collection
    const mongoDbConnection = await getConnection();
    const wallet = await mongoDbConnection
      .db()
      .collection(config.mongo.table.wallets)
      .findOne({ address: address.toLowerCase() });

    return wallet?.purchasedEnergy || 0;
  }

  static async getAvailableEnergies({ address, gameId}) {
    const energyFromDb = await this.getEnergy({ address, gameId });
    const dailyEnergy = Games.getDailyEnergy(gameId);

    const purchasedEnergy = await Energies.getPurchasedEnergy({ address });

    if (!energyFromDb) {
      return dailyEnergy + purchasedEnergy;
    }

    return dailyEnergy - energyFromDb.energyUsed + purchasedEnergy;
  }

  static async useLife({ address, gameId, date } = {}) {
    if (!date) {
      date = getUtcNow();
    }

    let gameEnergy = await this.getEnergy({
      address, gameId, date,
    });
    const dailyEnergy = Games.getDailyEnergy(gameId);
    const purchasedEnergy = await Energies.getPurchasedEnergy({ address });
    const totalAllowedEnergy = dailyEnergy + purchasedEnergy;

    if (gameEnergy === null) {
      gameEnergy = await Energies.addUpdateRecord({
        address, gameId, date
      });
    }

    if (gameEnergy.energyUsed >= totalAllowedEnergy) {
      throw new Error("Cannot use more energy");
    }

    gameEnergy = await Energies.addUpdateRecord({
      address, gameId, date,
      energyUsed: gameEnergy.energyUsed + 1
    });

    return totalAllowedEnergy - gameEnergy.energyUsed;
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

    const summary = {};
    const games = Games.getGames();

    // Initialize with all games
    Object.keys(games).forEach(gameKey => {
      const game = games[gameKey];
      const dbRecord = gameEnergy.filter((i) => i.gameId === game.slug);

      delete game.changeLog;

      summary[game.slug] = {
        ...game,
        available: dbRecord?.length > 0 ? game.dailyEnergy - dbRecord[0].energyUsed : game.dailyEnergy
      };
    });

    return summary;
  }
}

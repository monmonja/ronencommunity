import {getConnection} from "../components/db.mjs";

import { getTodayDateString } from "../utils/date-utils.mjs";
import config from "../config/default.json" with { type: "json" };
import Games from "./games.mjs";
import { getUtcNow } from "../utils/date-utils.mjs";
import {logError} from "../components/logger.mjs";

// gameEnergy model for tracking lives per wallet per game
export default class PurchasedEnergies {
  static async getEnergy({ address } = {}) {
    // Fetch purchasedEnergy from wallets collection
    const mongoDbConnection = await getConnection();
    const wallet = await mongoDbConnection
      .db()
      .collection(config.mongo.table.wallets)
      .findOne({ address: address.toLowerCase() });

    return wallet?.purchasedEnergy || 0;
  }


  static async addEnergy({ txHash, address, amount = 0, token = 'RON', price }){

    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const mongoDbConnection = await getConnection();

    const purchasesCol = mongoDbConnection.db().collection(config.mongo.table.purchases);
    const walletsCol = mongoDbConnection.db().collection(config.mongo.table.wallets);

    try {
      console.log({
        txHash,
        address: address.toLowerCase(),
        quantity: amount,
        price,
        type: "energy",
        token,
        createdAt: getUtcNow()
      })
      // Step 1: Try insert into purchases (with unique index on txHash!)
      await purchasesCol.insertOne({
        txHash,
        address: address.toLowerCase(),
        quantity: amount,
        price,
        type: "energy",
        token,
        createdAt: getUtcNow()
      });

      // Step 2: Increment wallet energy
      const updateData = {
        lastUpdated: getUtcNow(),
        createdAt: getUtcNow()
      };

      return await walletsCol.updateOne(
        { address: address.toLowerCase() },
        {
          $inc: { purchasedEnergy: amount },
          $setOnInsert: updateData
        },
        { upsert: true }
      );

    } catch (err) {
      logError({
        message: 'PurchasedEnergies.addEnergy error',
        auditData: err,
      })
      if (err.code === 11000) {
        // Duplicate txHash (already inserted purchase)
        return null;
      }
      throw err;
    }
  }

  static async deductEnergy({ address, amount = 0, gameId }) {
    if (amount <= 0) {
      throw new Error("Amount must be positive");
    }

    const mongoDbConnection = await getConnection();
    const walletsCol = mongoDbConnection.db().collection(config.mongo.table.wallets);
    const consumesCol = mongoDbConnection.db().collection(config.mongo.table.consumes);

    // Ensure we don’t go below zero
    const wallet = await walletsCol
      .findOne({ address: address.toLowerCase() });

    if (!wallet || (wallet.purchasedEnergy || 0) < amount) {
      throw new Error("Not enough purchased energy");
    }

    await walletsCol
      .updateOne(
        { address: address.toLowerCase() },
        { $inc: { purchasedEnergy: -amount }, $set: { lastUpdated: getUtcNow() } }
      );
    await consumesCol.insertOne({
      gameId,
      address: address.toLowerCase(),
      quantity: amount,
      type: "energy",
      description: "Use one energy in game",
      createdAt: getUtcNow()
    });
  }
}

import crypto from "crypto";
import { verifyMessage } from "ethers";
import { body, param, validationResult } from "express-validator";
import {requireWalletSession, validateCsrfMiddleware} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import config from "../config/default.json" with { type: "json" };
import {logError} from "../components/logger.mjs";
import WalletsModel from "../models/wallets-model.mjs";
import path from "path";
import Purchases from "../models/purchases.mjs";
import Consumes from "../models/consumes.mjs";
import Energies from "../models/energies.mjs";
import Games from "../models/games.mjs";

export function initStatsRoutes(app) {
  app.get(
    "/stats",
    rateLimiterMiddleware,
    requireWalletSession,
    async (req, res) => {
      const dailyPlays = await Energies.dailySummary();

      res.render("stats/index", {
        dailyPlays: dailyPlays.map((item) => {
          return {
            date: item.date,
            gameId: item.gameId,
            game: Games.getGame(item.gameId),
            totalEnergyUsed: item.totalEnergyUsed
          };
        }),
        selectedNav: 'profiles',
      });
    });
}

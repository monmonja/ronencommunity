import crypto from "crypto";
import { verifyMessage } from "ethers";
import { body, param, validationResult } from "express-validator";
import {requireWalletSession, validateCsrfMiddleware} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import config from "../config/default.json" with { type: "json" };
import {logError} from "../components/logger.mjs";
import Wallets from "../models/wallets.mjs";
import path from "path";
import Purchases from "../models/purchases.mjs";
import Consumes from "../models/consumes.mjs";
import Energies from "../models/energies.mjs";

export function initProfileRoutes(app) {
  app.get(
    "/profile",
    rateLimiterMiddleware,
    requireWalletSession,
    async (req, res) => {
      const address = req.session.wallet.address;

      res.render("profile/index", {
        energies: await Energies.getEnergySummary({
          address,
        }),
        purchases: await Purchases.getPurchases({
          address,
        }),
        consumes: await Consumes.getConsumes({
          address,
        }),
      });
    });
}

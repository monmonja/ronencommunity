import { param, validationResult } from "express-validator";
import { cookieCheckMiddleware, requireWalletSession } from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import Games from "../models/games.mjs";
import Energies from "../models/energies.mjs";
import {logError} from "../components/logger.mjs";

export function initEnergyRoutes(app) {
  app.get(
    "/energy/get/:path",
    param("path")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Invalid game"),
    rateLimiterMiddleware,
    cookieCheckMiddleware,
    requireWalletSession,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const game = Games.getGame(req.params.path);

      if (!game) {
        return res.status(400).json({ success: false, errors: 'No game' });
      }

      game.available = await Energies.getAvailableEnergies({
        address: req.session.wallet.address.toLowerCase(),
        gameId: game.slug,
      });

      delete game.changeLog;

      return res.json(game);
    });

  app.get(
    "/energy/use/:path",
    param("path")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Invalid game"),
    rateLimiterMiddleware,
    cookieCheckMiddleware,
    requireWalletSession,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const game = Games.getGame(req.params.path);

      if (!game) {
        return res.status(400).json({ success: false, errors: 'No game' });
      }

      let available = 0;

      try {
        available = await Energies.useLife({
          address: req.session.wallet.address.toLowerCase(),
          gameId: req.params.path,
        });
      } catch (e) {
        logError({
          message: 'Use life when there is none',
          auditData: e,
        })
      }

      game.available = available;
      delete game.changeLog;

      return res.json(game);
    });

  app.get(
    "/energy/summary",
    rateLimiterMiddleware,
    cookieCheckMiddleware,
    requireWalletSession,
    async (req, res) => {
      try {
        const summary = await Energies.getEnergySummary({
          address: req.session.wallet.address.toLowerCase()
        });

        res.json(summary);
      } catch (error) {
        console.error('Error getting lives summary:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });
}
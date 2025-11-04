import {body, param} from "express-validator";
import noCacheMiddleware, {cookieCheckMiddleware, requireWalletSession, validateCsrfMiddleware} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import Games from "../models/games.mjs";
import {handleValidation} from "../utils/validations.mjs";
import GameProfiles from "../models/game-profiles.mjs";

export function initGameProfilesRoutes(app) {
  app.get(
    "/game-profiles/get/:path",
    param("path")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Invalid game"),
    requireWalletSession,
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    noCacheMiddleware,
    async (req, res) => {
      if (!handleValidation(req, res)) {
        return;
      }

      const game = Games.getGame(req.params.path);

      if (!game) {
        return res.status(400).json({ success: false, errors: "No game" });
      }

      const gameProfile = await GameProfiles.getProfile({
        address: req.session.wallet.address.toLowerCase(),
        gameId: game.slug,
      });

      return res.json(gameProfile);
    });

  app.post(
    "/game-profiles/set-value",
    cookieCheckMiddleware,
    validateCsrfMiddleware,
    rateLimiterMiddleware,
    noCacheMiddleware,
    [
      body("gameId")
        .matches(/^[a-z0-9-]+$/).withMessage("gameId must be a string")
        .notEmpty().withMessage("gameId is required"),
      body("label")
        .isString().withMessage("label must be a string")
        .notEmpty().withMessage("label is required")
        .custom((label) => {
          // MongoDB restrictions: no "." or "$" in field names
          if (/[.$]/.test(label)) {
            throw new Error("label cannot contain . or $");
          }

          return true;
        }),
      body("value")
        .custom((value) => {
          if (typeof value === "number") {
            return true;
          }

          if (typeof value === "string") {
            return true;
          }

          if (typeof value === "object" && value !== null) {
            return true;
          }

          throw new Error("level must be a string, number, or JSON object");
        }),
    ],
    async (req, res) => {
      if (!handleValidation(req, res)) {
        return;
      }

      try {
        let { gameId, label, value } = req.body;

        const game = Games.getGame(gameId);

        if (!game) {
          return res.status(400).json({ success: false, errors: "No game" });
        }

        // If level is a JSON string, try parsing
        if (typeof value === "string") {
          try {
            value = JSON.parse(value);
          } catch {
            // keep as string if not valid JSON
          }
        }

        if (await GameProfiles.addUpdateRecord({
          address: req.session.wallet?.address,
          gameId,
          label,
          value,
        }) > 0) {
          return res.status(201).json({ message: "Game profile created successfully." });
        } else {
          return res.status(200).json({ message: "Game profile updated successfully." });
        }
      } catch (error) {
        console.error("Error saving game profile:", error);
        return res.status(500).json({ message: "Internal server error. Error saving game profile." });
      }
    }
  );
}

import { param, validationResult } from "express-validator";
import {
  accessListMiddleware,
  cookieCheckMiddleware,
  requireWalletSession,
} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import {
  getUtcNow,
} from "../utils/date-utils.mjs";
import { raffleEndsInDHM, raffleEndingIn } from "../utils/raffle-utils.mjs";
import config from "../config/default.json" with { type: "json" };
import Raffles from "../models/raffles.mjs";
import Games from "../models/games.mjs";

export function initGamesRoutes(app) {
  app.get(
    "/games",
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      const raffle = Raffles.getRaffle(getUtcNow());

      if (req.cookies["has-raffle-entry"] !== "true" && req.session.wallet && raffle) {
        const wallet = req.session.wallet.address.toLowerCase();

        const hasEntry = await Raffles.walletHasEntry({
          raffleId: raffle.id,
          wallet
        });

        if (hasEntry) {
          res.cookie("has-raffle-entry", "true", {
            maxAge: raffleEndingIn(getUtcNow()),
            httpOnly: false,
            secure: config.isProd,
            sameSite: "strict",
            path: "/"
          });
        }
      }

      return res.render("games/index", {
        games: Games.getGames(),
        raffle,
        totalAmount: raffle ? await Raffles.getTotalAmount({
          raffleId: raffle.id,
        }) : 0,
        selectedNav: "games",
        ...raffleEndsInDHM()
      });
    });

  app.get(
    "/game/:path",
    param("path")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Invalid game"),
    rateLimiterMiddleware,
    cookieCheckMiddleware,
    requireWalletSession,
    accessListMiddleware,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      return res.render("game/template", {
        gameId: req.params.path,
        games: Games.getGames(),
        game: Games.getGame(req.params.path),
        selectedNav: "games",
      });
    });
}

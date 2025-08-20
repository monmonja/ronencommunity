import { param, validationResult } from "express-validator";
import {cookieCheckMiddleware, requireWalletSession, walletRaffleEntryMiddleware} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import {
  getRaffle, getUtcNow, raffleEndingIn, raffleEndsInDHM
} from "../components/utils.mjs";
import {
  walletHasRaffleEntry,
  getTotalAmountOnRaffleId,
} from "../components/db.mjs";
import {getGame, getGames} from "../components/games.mjs";
import config from "../config/default.json" with { type: "json" };

export function initGamesRoutes(app, mongoDbConnection) {
  app.get(
    "/games",
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      const raffle = getRaffle(getUtcNow());

      if (req.cookies["has-raffle-entry"] !== "true" && req.session.wallet) {
        const wallet = req.session.wallet.address.toLowerCase();

        const hasEntry = await walletHasRaffleEntry({
          mongoDbConnection,
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
        games: getGames(),
        raffle,
        totalAmount: await getTotalAmountOnRaffleId({
          mongoDbConnection,
          raffleId: raffle.id,
        }),
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
    walletRaffleEntryMiddleware({ mongoDbConnection }),
    requireWalletSession,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      return res.render("game/template", {
        gameId: req.params.path,
        games: getGames(),
        game: getGame(req.params.path),
      });
    });
}

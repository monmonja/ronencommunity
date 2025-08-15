import {requireWalletSession, walletRaffleEntryMiddleware} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import {
  getRaffleId, getUtcNow, raffleEndingIn, raffleEndsInDHM
} from "../components/utils.mjs";
import {
  walletHasRaffleEntry,
  getTotalAmountOnRaffleId,
} from "../components/db.mjs";
import {getGames} from "../components/games.mjs";

export function initGamesRoutes(app, mongoDbConnection) {
  app.get("/games", rateLimiterMiddleware, async (req, res) => {
    const raffleId = getRaffleId(getUtcNow());

    if (req.cookies["has-raffle-entry"] !== "true" && req.session.wallet) {
      const raffleId = getRaffleId(getUtcNow());
      const wallet = req.session.wallet.address.toLowerCase();

      const hasEntry = await walletHasRaffleEntry({
        mongoDbConnection,
        raffleId,
        wallet
      });

      if (hasEntry) {
        res.cookie("has-raffle-entry", "true", {
          maxAge: raffleEndingIn(getUtcNow())
        });
      }
    }

    return res.render("games/index", {
      games: getGames(),
      raffleId,
      totalAmount: await getTotalAmountOnRaffleId({
        mongoDbConnection, raffleId
      }),
      ...raffleEndsInDHM()
    });
  });

  app.get(
    "/game/:path",
    rateLimiterMiddleware,
    requireWalletSession,
    walletRaffleEntryMiddleware({ mongoDbConnection }),
    (req, res) => {
      return res.render("game/template", {
        gameId: req.params.path,
        games: getGames()
      });
    });
}

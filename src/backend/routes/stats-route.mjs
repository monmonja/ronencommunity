import {requireWalletSession} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import Energies from "../models/energies.mjs";
import Games from "../models/games.mjs";
import GameRoomsModel from "../models/game-rooms-model.mjs";

export function initStatsRoutes(app) {
  app.get(
    "/stats",
    rateLimiterMiddleware,
    requireWalletSession,
    async (req, res) => {
      const dailyPlays = await Energies.dailySummary();

      res.render("stats/index", {
        gameRooms: await GameRoomsModel.getGameRooms(),
        dailyPlays: dailyPlays.map((item) => {
          return {
            date: item.date,
            gameId: item.gameId,
            game: Games.getGame(item.gameId),
            totalEnergyUsed: item.totalEnergyUsed
          };
        }),
        selectedNav: "profiles",
      });
    });
}

import noCacheMiddleware, {requireWalletSession} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import Purchases from "../models/purchases.mjs";
import Consumes from "../models/consumes.mjs";
import Energies from "../models/energies.mjs";

export function initProfileRoutes(app) {
  app.get(
    "/profile",
    rateLimiterMiddleware,
    noCacheMiddleware,
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
        selectedNav: "profiles",
      });
    });
}

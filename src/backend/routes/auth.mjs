import { verifyMessage } from "ethers";
import { validateCsrfMiddleware } from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import {
  addWalletRecord,
} from "../components/db.mjs";

export function initAuthRoutes(app, mongoDbConnection) {
  app.post("/login", validateCsrfMiddleware, rateLimiterMiddleware, async (req, res) => {
    const { address, message, signature } = req.body;

    try {
      const recoveredAddress = verifyMessage(message, signature);

      if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
        await addWalletRecord({
          mongoDbConnection, address,
        });

        // save to session
        req.session.wallet = {
          address: address.toLowerCase(),
        };

        res.cookie("has-user", "true", {
          maxAge: 3 * 60 * 60 * 1000, // 3 hrs
        });

        res.json({ success: true, message: "Signature verified" });
      } else {
        res.status(401).json({ success: false, message: "Signature does not match" });
      }
    } catch (err) {
      res.status(400).json({ success: false, message: "Invalid signature", error: err.message });
    }
  });

  app.post("/logout", validateCsrfMiddleware, (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Failed to destroy session:", err);

        return res.status(500).json({ success: false, message: "Logout failed" });
      }

      // Optionally clear the cookie on the client side
      res.clearCookie("has-user");
      res.clearCookie("connect.sid");

      res.json({ success: true, message: "Logged out successfully" });
    });
  });
}

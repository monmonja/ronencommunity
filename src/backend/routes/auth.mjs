import crypto from "crypto";
import { verifyMessage } from "ethers";
import { body, param, validationResult } from "express-validator";
import { validateCsrfMiddleware } from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import config from "../config/default.json" with { type: "json" };
import {
  addWalletRecord,
} from "../components/db.mjs";

export function initAuthRoutes(app, mongoDbConnection) {
  app.post(
    "/login",
    body("address")
      .trim()
      .isEthereumAddress().withMessage("Invalid Ethereum address"), // validator.js
    body("message")
      .trim()
      .isLength({ min: 1, max: 500 }).withMessage("Message too long or empty"),
    body("signature")
      .trim()
      .matches(/^0x[0-9a-fA-F]+$/).withMessage("Invalid signature format"),
    validateCsrfMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { address, message, signature } = req.body;

      try {
        // Verify nonce
        if (!req.session.nonceData) {
          return res.status(400).json({ success: false, message: "Nonce not found" });
        }

        if (!message.includes(req.session.nonceData?.nonce)) {
          return res.status(401).json({ success: false, message: "Invalid nonce" });
        }

        // Verify signature
        const recoveredAddress = verifyMessage(message, signature);

        if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
          // Regenerate session to avoid session fixation
          req.session.regenerate(async (err) => {
            if (err) {
              console.error("Session regeneration error:", err);
              return res.status(500).json({ success: false, message: "Server error" });
            }

            //  Mark nonce as used
            delete req.session.nonce;

            // Generate a new CSRF token
            req.session.csrfToken = crypto.randomBytes(32).toString("hex");

            // Save wallet
            await addWalletRecord({
              mongoDbConnection, address,
            });

            // save to session
            req.session.wallet = {
              address: address.toLowerCase(),
            };

            res.cookie("has-user", "true", {
              maxAge: 3 * 60 * 60 * 1000, // 3 hrs
              sameSite: "strict",
              secure: config.isProd,
              path: "/"
            });

            res.json({ success: true, message: "Signature verified" });
          });
        } else {
          res.status(401).json({ success: false, message: "Signature does not match" });
        }
      } catch (err) {
        res.status(400).json({ success: false, message: "Invalid signature", error: err.message });
      }
    });

  app.post("/logout",
    validateCsrfMiddleware,
    rateLimiterMiddleware,
    (req, res) => {
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

  app.get(
    "/nonce/:address",
    rateLimiterMiddleware,
    param("address")
      .trim()
      .isEthereumAddress()
      .withMessage("Invalid Ethereum address"), // validator.js
    (req, res) => {
      // Check validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { address } = req.params;

      const nonce = crypto.randomBytes(16).toString("hex");
      req.session.nonceData = { address: address.toLowerCase(), nonce };

      res.json({ nonce });
    });
}

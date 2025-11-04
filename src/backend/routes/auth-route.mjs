import crypto from "crypto";
import { verifyMessage } from "ethers";
import { body, param, validationResult } from "express-validator";
import noCacheMiddleware, {adminAccessMiddleware, validateCsrfMiddleware} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import config from "../config/default.json" with { type: "json" };
import {logError} from "../components/logger.mjs";
import WalletsModel from "../models/wallets-model.mjs";

export function initAuthRoutes(app) {
  app.get(
    "/auth/login/:address/:network",
    adminAccessMiddleware,
    noCacheMiddleware,
    param("address")
      .trim()
      .isEthereumAddress()
      .withMessage("Invalid Ethereum address"),
    param("network")
      .trim()
      .matches(/^[a-z\-]+$/).withMessage("Invalid network"),
    async (req, res) => {
      const { address, network } = req.params;
      req.session.wallet = {
        address: address,
        network: network,
      };
      res.cookie("has-user", "true", {
        maxAge: 3 * 60 * 60 * 1000, // 3 hrs
        sameSite: "strict",
        secure: config.isProd,
        path: "/"
      });

      res.json({ success: true, message: "Signature verified" });
    });

  app.post(
    "/auth/login",
    body("address")
      .trim()
      .isEthereumAddress().withMessage("Invalid Ethereum address"), // validator.js
    body("message")
      .trim()
      .isLength({ min: 1, max: 500 }).withMessage("Message too long or empty"),
    body("signature")
      .trim()
      .matches(/^0x[0-9a-fA-F]+$/).withMessage("Invalid signature format"),
    body("network")
      .trim()
      .matches(/^[a-z\-]+$/).withMessage("Invalid network"),
    validateCsrfMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      let { address, message, signature, network } = req.body;

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
            await WalletsModel.addRecord({
              address,
              network,
            });

            // save to session
            req.session.wallet = {
              address: address.toLowerCase(),
              network: network.toLowerCase(),
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
          logError({
            message: "Failed to destroy session: ",
            auditData: err,
          });

          return res.status(500).json({ success: false, message: "Logout failed" });
        }

        // Optionally clear the cookie on the client side
        res.clearCookie("has-user");
        res.clearCookie("has-raffle-entry");
        res.clearCookie("connect.sid");

        res.json({ success: true, message: "Logged out successfully" });
      });
    });

  app.get(
    "/auth/nonce/:address",
    rateLimiterMiddleware,
    noCacheMiddleware,
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

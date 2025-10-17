import crypto from "crypto";
import {body, param, validationResult} from "express-validator";
import { JsonRpcProvider, formatEther } from "ethers";
import config from "../config/default.json" with { type: "json" };
import {adminAccessMiddleware, cookieCheckMiddleware, validateCsrfMiddleware} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import { getUtcNow } from "../utils/date-utils.mjs";
import { raffleEndingIn, raffleEndsInDHM } from "../utils/raffle-utils.mjs";
import {
  getConnection,
} from "../components/db.mjs";
import {logError} from "../components/logger.mjs";
import Raffles from "../models/raffles.mjs";
import Admin from "../models/admin.mjs";

export function initAdminRoutes(app) {

  app.get(
    "/admin",
    adminAccessMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      res.render("admin/index", {
        settings: await Admin.getAllRecordsAsObject()
      });
    });

  app.post(
    "/admin",
    adminAccessMiddleware,
    body("energies")
      .trim()
      .isJSON().withMessage("Invalid JSON"), // validator.js
    rateLimiterMiddleware,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { energies } = req.body;

      await Admin.addUpdateRecord({
        key: "energies",
        value: energies,
      });

      res.render("admin/index", {

        settings: await Admin.getAllRecordsAsObject()
      });
    });
}

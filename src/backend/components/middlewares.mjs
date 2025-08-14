import crypto from "crypto";

import MongoStore from "connect-mongo";
import session from "express-session";

import {getConnection, walletHasRaffleEntry} from "./db.mjs";
import config from "../config/localhost.json" with { type: "json" };
import {getRaffleId, getUtcNow} from "./utils.mjs";

const mongoDbConnection = await getConnection();

// ✅ Middleware to check if wallet is logged in
export function requireWalletSession(req, res, next) {
  if (req.session.wallet && req.session.wallet.address) {
    return next(); // session is valid
  }

  res.status(401).json({ success: false, message: "Wallet session required" });
}

// ✅ Session middleware factory
export async function sessionMiddleWare() {
  return session({
    secret: config.session.secret,
    saveUninitialized: true,
    resave: false,
    store: MongoStore.create({
      touchAfter: 24 * 3600,
      client: mongoDbConnection,
    }),
    cookie: {
      secure: config.isProd,
      httpOnly: true,
      sameSite: "lax",
    },
  });
}

// ✅ CSRF token generator middleware
export function csrfMiddleware(req, res, next) {
  if (!req.session?.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString("hex");
  }

  res.locals.csrfToken = req.session.csrfToken;

  next();
}

// ✅ Add session vars to templates
export function ejsVariablesMiddleware(req, res, next) {
  res.locals.wallet = req.session.wallet || null;
  res.locals.config = config || {};

  next();
}

// ✅ Verify Csrf
export function validateCsrfMiddleware(req, res, next) {
  const tokenFromBody = req.body.csrfToken;

  if (!tokenFromBody || tokenFromBody !== req.session.csrfToken) {
    return res.status(403).json({ success: false, message: "Invalid CSRF token" });
  }

  next();
}

export function walletRaffleEntryMiddleware({ mongoDbConnection } = {}) {
  return async (req, res, next) => {
    const raffleId = getRaffleId(getUtcNow());
    const wallet = req.session.wallet.address.toLowerCase();

    const hasEntry = await walletHasRaffleEntry({
      mongoDbConnection,
      raffleId,
      wallet
    });

    if (!hasEntry) {
      res.clearCookie("has-raffle-entry", { path: "/" });
      return res.redirect("/games");
    }

    next();
  };
}

import crypto from "crypto";

import MongoStore from "connect-mongo";
import session from "express-session";

import { getConnection } from "./db.mjs";
import config from "../config/localhost.json" with { type: "json" };

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

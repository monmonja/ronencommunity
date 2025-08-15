import crypto from "crypto";

import MongoStore from "connect-mongo";
import session from "express-session";

import {getConnection, walletHasRaffleEntry} from "./db.mjs";
import config from "../config/default.json" with { type: "json" };
import {getRaffleId, getUtcNow} from "./utils.mjs";

const mongoDbConnection = await getConnection();

// Middleware to check if wallet is logged in
export function requireWalletSession(req, res, next) {
  if (req.session.wallet && req.session.wallet.address) {
    return next(); // session is valid
  }

  res.status(401).json({ success: false, message: "Wallet session required" });
}

// Session middleware factory
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
      sameSite: "strict",
    },
  });
}

// CSRF token generator middleware
export function csrfMiddleware(req, res, next) {
  if (!req.session?.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }

  res.locals.csrfToken = req.session.csrfToken;

  next();
}

// Add session vars to templates
export function ejsVariablesMiddleware(req, res, next) {
  res.locals.wallet = req.session.wallet || null;
  res.locals.config = config || {};

  next();
}

// Verify Csrf
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

export function forceHTTPSMiddleware(req, res, next) {
  if (config.isProd && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }

  next();
}

export function securityHeadersMiddleware(req, res, next) {
  // Prevent MIME sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  res.setHeader("X-Frame-Options", "DENY");

  // Enable XSS protection in older browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Referrer policy
  res.setHeader("Referrer-Policy", "no-referrer");

  // Cross-Origin policies
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Resource-Policy", "same-origin");

  // Strict CSP
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; " +
    "img-src 'self' data: blob: https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net; " +
    // eslint-disable-next-line quotes
    `script-src 'self' https://pagead2.googlesyndication.com https://ep2.adtrafficquality.google ${config.isProd ? '' : "'unsafe-eval'"};` +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "frame-src 'self' https://googleads.g.doubleclick.net https://tpc.googlesyndication.com https://www.google.com https://ep2.adtrafficquality.google; " +
    "connect-src 'self' https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://ep1.adtrafficquality.google https://ep2.adtrafficquality.google; " +
    "frame-ancestors 'none'; " +
    "object-src 'none'"
  );

  next();
}

export function adminAccessMiddleware(req, res, next) {
  const adminWallet = config.web3.adminWallet;

  // If using session wallet
  const userWallet = req.session.wallet?.address?.toLowerCase();

  if (!userWallet || userWallet !== adminWallet) {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  next();
}

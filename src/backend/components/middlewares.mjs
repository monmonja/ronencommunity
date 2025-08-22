import crypto from "crypto";

import MongoStore from "connect-mongo";
import session from "express-session";

import { getTotalAmountOnRaffleId, walletHasRaffleEntry} from "./db.mjs";
import config from "../config/default.json" with { type: "json" };
import {getRaffle, getUtcNow, raffleEndsInDHM} from "./utils.mjs";
import {getGame} from "./games.mjs";
import {logError} from "./logger.mjs";

// Middleware to check if wallet is logged in
export function requireWalletSession(req, res, next) {
  if (req.session.wallet && req.session.wallet.address) {
    return next(); // session is valid
  }

  if (!config.isProd) {
    return next();
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
      mongoUrl: config.mongo.connectionString,
      mongoOptions: {},
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

  res.cookie("XSRF-TOKEN", req.session.csrfToken, {
    httpOnly: false,    // frontend JS needs to read this one
    secure: true,       // only send over HTTPS
    sameSite: "lax"
  });

  next();
}

// Add session vars to templates
export function ejsVariablesMiddleware(req, res, next) {
  res.locals.wallet = req.session.wallet || null;
  res.locals.config = config || {};
  res.locals.nonce = crypto.randomBytes(16).toString("hex");

  next();
}

// Verify Csrf
export function validateCsrfMiddleware(req, res, next) {
  const tokenFromHeader = req.get("X-CSRF-TOKEN");

  if (!tokenFromHeader || tokenFromHeader !== req.session.csrfToken) {
    logError({
      message: "CSRF error",
      auditData: {
        tokenFromHeader,
        sessionToken: req.session.csrfToken,
      },
    });

    return res.status(403).json({ success: false, message: "Invalid CSRF token" });
  }

  next();
}

export function cookieCheckMiddleware(req, res, next) {
  if (req.session.wallet?.address) {
    res.cookie("has-user", "true", {
      maxAge: 3 * 60 * 60 * 1000, // 3 hrs
      sameSite: "strict",
      secure: config.isProd,
      path: "/"
    });
  } else {
    res.clearCookie("has-user");
    res.clearCookie("has-raffle-entry");
  }

  next();
}

export function walletRaffleEntryMiddleware() {
  return async (req, res, next) => {
    const raffle = getRaffle(getUtcNow());
    const game = getGame(req.params.path);

    if (!config.isProd) {
      return next();
    }

    if (!game) {
      return res.status(403).json({ success: false, message: "No games with this id." });
    }

    if (req.session.wallet) {
      const wallet = req.session.wallet.address.toLowerCase();

      const hasEntry = await walletHasRaffleEntry({
        raffleId: raffle.id,
        wallet
      });

      if (!hasEntry) {
        res.clearCookie("has-raffle-entry", { path: "/" });

        return res.redirect("/games");
      }

      next();
    } else {
      res.render("raffle/required-for-games", {
        game: getGame(req.params.path),
        raffle,
        totalAmount: await getTotalAmountOnRaffleId({
          raffleId: raffle.id,
        }),
        ...raffleEndsInDHM()
      });
    }
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
    "img-src 'self' data: blob: https://*.google-analytics.com https://*.googletagmanager.com;" +
    // eslint-disable-next-line quotes
    `script-src 'self' 'nonce-${res.locals.nonce}' https://*.googletagmanager.com ${config.isProd ? '' : "'unsafe-eval'"};` +
    "style-src 'self' 'unsafe-inline'; " +
    "font-src 'self' https://fonts.gstatic.com https://cdn.ronencommunity.com; " +
    "frame-src 'self' https://*.google.com; " +
    "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://cdn.ronencommunity.com; " +
    "frame-ancestors 'none'; " +
    "object-src 'none'"
  );

  next();
}

export function adminAccessMiddleware(req, res, next) {
  const adminWallet = config.web3.adminWallet.toLowerCase();

  // If using session wallet
  const userWallet = req.session.wallet?.address?.toLowerCase();

  if (!userWallet || userWallet !== adminWallet) {
    return res.status(403).json({ success: false, message: "Admin access required" });
  }

  next();
}

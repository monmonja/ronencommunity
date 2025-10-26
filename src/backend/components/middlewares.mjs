import crypto from "crypto";

import MongoStore from "connect-mongo";
import session from "express-session";

import config from "../config/default.json" with { type: "json" };
import geoip from "geoip-country";
import {logError} from "./logger.mjs";

// Middleware to check if wallet is logged in
export function requireWalletSession(req, res, next) {
  if (req.session.wallet && req.session.wallet.address) {
    return next(); // session is valid
  }

  return res.status(401).render("games/required-login", {
    selectedNav: 'games',
  });
}

export function sessionMiddleWare() {
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

export function geoMiddleware(req, res, next) {
  // get client IP (consider proxies)
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress;

  const geo = geoip.lookup(ip);

  // make country available to all templates
  res.locals.country = geo?.country || "Unknown";

  next();
}

export function affiliateMiddleware(req, res, next) {
  const promos = [
    'Please donate to support the website: <a id="top-banner-address" href="https://app.roninchain.com/address/0xf84810C321Fe1d9baB045b67893C61Be756FE6c6">0xf84810C321Fe1d9baB045b67893C61Be756FE6c6</a>',
    // End Date:Oct 05, 2025 at 11:59 PM PDT
    `<p>Amazon Affiliate ads:</p><a target="_blank" href="https://amzn.to/3IzeLZU">Getting into the Game: A Web3 and Crypto Buying Guide for Newbies</a>`,
    `<p>Amazon Affiliate ads:</p><a target="_blank" href="https://amzn.to/3Vsrb8Q">Gaming Socks Do Not Disturb I'm Novelty Boys for Men Women Gamer Youth</a>`,

  ];

  // pick a random promo
  res.locals.affiliateAds = promos[Math.floor(Math.random() * promos.length)];

  next();
}

export function forceHTTPSMiddleware(req, res, next) {
  if (config.isProd && req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }

  next();
}

export function noCacheDevelopment(req, res, next) {
  if (!config.isProd) {
    if (req.path.match(/\.(js|css)$/)) {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    } else if (req.path.match(/\.(png|jpg|jpeg|gif|svg|woff2)$/)) {
      // Allow caching for static assets like images/fonts
      res.setHeader('Cache-Control', 'public, max-age=86400'); // 1 day
    }

    return next();
  }

  next();
}

export function disableStackTraceMiddleware(err, req, res, next) {
  if (err) {
    const adminWallet = config.web3.adminWallet.toLowerCase();

    // If using session wallet
    const userWallet = req.session.wallet?.address?.toLowerCase();

    if (config.isProd && adminWallet !== userWallet) {
      res.status(500).send("Internal Server Error. Disabled stack trace in production.");
    } else {
      next(err);
    }
  } else {
    next();
  }
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
    `script-src 'self' 'nonce-${res.locals.nonce}' https://*.googletagmanager.com https://cdn.jsdelivr.net ${config.isProd ? '' : "'unsafe-eval'"};` +
    "style-src 'self' 'unsafe-inline'; " +
    "font-src 'self' https://fonts.gstatic.com https://cdn.ronencommunity.com; " +
    "frame-src 'self' https://*.google.com; " +
    "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://cdn.ronencommunity.com https://metadata.ronen.network; " +
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

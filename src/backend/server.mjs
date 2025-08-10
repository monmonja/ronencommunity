// server.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import cors from "cors";
import ejs from "ejs";
import { verifyMessage } from "ethers";
import express from "express";

import { getConnection } from "./components/db.mjs";
import {
  csrfMiddleware,
  requireWalletSession,
  sessionMiddleWare,
  ejsVariablesMiddleware,
  validateCsrfMiddleware
} from "./components/middlewares.mjs";
import { rateLimiterMiddleware } from "./components/rate-limiter.mjs";
import { getGames } from "./components/games.mjs";
import config from "./config/localhost.json" with { type: "json" };


const port = process.env.PORT || 3000;
// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const mongoDbConnection = await getConnection();

app.use(cors());
app.use(express.json());
app.use(await sessionMiddleWare());
app.use(csrfMiddleware);
app.use(ejsVariablesMiddleware);

// setup view engine
app.engine("html", ejs.renderFile);
app.set("view engine", "html");
app.set("views", path.join(__dirname, "..", "html"));

// Serve static files in /public
app.use("/css", express.static(path.join(__dirname, "..", "..", "public", "dist", "css")));
app.use("/js", express.static(path.join(__dirname, "..", "..", "public", "dist", "js")));
app.use("/img", express.static(path.join(__dirname, "..", "..", "public", "img")));

app.get("/games", rateLimiterMiddleware, requireWalletSession, (req, res) => {
  return res.render("games/index", {
    games: getGames()
  });
});

app.get(["/start-session"], rateLimiterMiddleware, (req, res) => {
  req.session.wallet = {
    address: '0xdBf31761A886CA3d8B207b787FD925A95dB997b5',
  };

  res.json({ success: true, message: "Session okay" });
});

app.get(["/", "/:path"], rateLimiterMiddleware, (req, res) => {
  res.render("index");
});

app.get(["/wiki/:path"], rateLimiterMiddleware, (req, res) => {
  const baseDir = path.join(__dirname, "..", "html", "wiki");
  const safePath = path.join(baseDir, req.params.path, "index.html");
  const normalizedPath = path.normalize(safePath);

  // Ensure the normalized path starts with the base directory
  if (!normalizedPath.startsWith(baseDir)) {
    return res.status(403).send("Access Denied");
  }

  if (fs.existsSync(normalizedPath)) {
    // send partial when its via ajax
    if (req.xhr) {
      res.send(fs.readFileSync(normalizedPath, "utf-8"));
    } else {
      res.render("wiki/template", {
        content: path.join("..", "wiki", req.params.path, "index.html"),
        selectedWiki: req.params.path,
      });
    }
  } else {
    res.status(404).send("Page not found");
  }
});

app.post("/login", validateCsrfMiddleware, rateLimiterMiddleware, async (req, res) => {
  const { address, message, signature } = req.body;

  try {
    const recoveredAddress = verifyMessage(message, signature);

    if (recoveredAddress.toLowerCase() === address.toLowerCase()) {
      // save to mongodb
      await mongoDbConnection.db().collection(config.mongo.table.wallets).updateOne(
        { address: address.toLowerCase(), network: "ronin" }, // match criteria
        {
          $setOnInsert: {
            createdAt: new Date()
          }
        },
        { upsert: true }
      );

      // save to session
      req.session.wallet = {
        address: address.toLowerCase(),
      };

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
    res.clearCookie("connect.sid"); // Default cookie name

    res.json({ success: true, message: "Logged out successfully" });
  });
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

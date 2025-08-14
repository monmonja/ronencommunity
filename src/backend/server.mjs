// server.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import cors from "cors";
import ejs from "ejs";
import cookieParser from "cookie-parser";
import { verifyMessage, JsonRpcProvider, formatEther } from "ethers";
import express from "express";

import {
  addRaffleRecord,
  getConnection,
  addWalletRecord,
  getTotalAmountOnRaffleId,
  getEntriesFromRaffleId,
  getAllRaffles,
  walletHasRaffleEntry
} from "./components/db.mjs";
import {
  csrfMiddleware,
  requireWalletSession,
  sessionMiddleWare,
  ejsVariablesMiddleware,
  validateCsrfMiddleware,
  walletRaffleEntryMiddleware,
} from "./components/middlewares.mjs";
import {rateLimiterMiddleware} from "./components/rate-limiter.mjs";
import { getGames } from "./components/games.mjs";
import config from "./config/localhost.json" with { type: "json" };
import {getRaffleId, getUtcNow, raffleEndingIn, raffleEndsInDHM} from "./components/utils.mjs";

const port = process.env.PORT || 3000;
// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const mongoDbConnection = await getConnection();

app.use(cookieParser());
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
app.use("/fonts", express.static(path.join(__dirname, "..", "..", "public", "fonts")));
app.use("/game-assets", express.static(path.join(__dirname, "..", "..", "games")));

app.get(["/start-session"], rateLimiterMiddleware, (req, res) => {
  req.session.wallet = {
    address: "0xdBf31761A886CA3d8B207b787FD925A95dB997b5",
  };

  res.json({ success: true, message: "Session okay" });
});

app.get("/games", rateLimiterMiddleware, requireWalletSession, async (req, res) => {
  const raffleId = getRaffleId(getUtcNow());

  if (req.cookies["has-raffle-entry"] !== "true") {
    const raffleId = getRaffleId(getUtcNow());
    const wallet = req.session.wallet.address.toLowerCase();

    const hasEntry = await walletHasRaffleEntry({
      mongoDbConnection,
      raffleId,
      wallet
    });

    if (hasEntry) {
      res.cookie("has-raffle-entry", "true", {
        maxAge: raffleEndingIn(getUtcNow())
      });
    }
  }

  return res.render("games/index", {
    games: getGames(),
    raffleId,
    totalAmount: await getTotalAmountOnRaffleId({
      mongoDbConnection, raffleId
    }),
    ...raffleEndsInDHM()
  });
});

app.get(["/raffle", "/raffle/:raffleId"], rateLimiterMiddleware, requireWalletSession, async (req, res) => {
  let { raffleId } = req.params;

  if (raffleId) {
    // Validate raffleId format: two chars, dash, four chars
    const isValid = /^[0-9]{2}-[0-9]{4}$/.test(raffleId);

    if (!isValid) {
      return res.status(400).json({error: "Invalid raffleId format"});
    }
  } else {
    raffleId = getRaffleId(getUtcNow());
  }

  return res.render("raffle/index", {
    currentRaffleId: getRaffleId(getUtcNow()),
    raffleId,
    totalAmount: await getTotalAmountOnRaffleId({
      mongoDbConnection, raffleId
    }),
    entries: await getEntriesFromRaffleId({
      mongoDbConnection, raffleId
    }),
    allRaffles: await getAllRaffles({
      mongoDbConnection
    }),
    ...raffleEndsInDHM()
  });
});

app.get("/game/:path", rateLimiterMiddleware, requireWalletSession,
  walletRaffleEntryMiddleware({ mongoDbConnection }), (req, res) => {
  return res.render("game/template", {
    games: getGames()
  });
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
      await addWalletRecord({
        mongoDbConnection, address,
      });

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

app.get("/pick-raffle-winner", async (req, res) => {
  try {
    const raffleId = getRaffleId(getUtcNow());

    // 1️⃣ Check if a winner already exists
    const existingWinner = await mongoDbConnection
      .db()
      .collection(config.mongo.table.raffleWinners)
      .findOne({ raffleId });

    if (existingWinner) {
      return res.status(400).send({
        error: "Winner already picked for this raffle",
        winner: existingWinner.winner,
      });
    }

    const entries = await getEntriesFromRaffleId({ mongoDbConnection, raffleId });

    if (entries.length === 0) {
      return res.status(404).send("No entries for this raffle");
    }

    const pickWeightedWinner = (entries) => {
      const totalAmount = entries.reduce((sum, e) => sum + e.amount, 0);

      let cumulative = 0;
      const ranges = entries.map(entry => {
        const start = cumulative;
        cumulative += entry.amount / totalAmount;
        return { wallet: entry.from, start, end: cumulative };
      });

      const r = Math.random();

      return ranges.find(range => r >= range.start && r < range.end)?.wallet;
    };

    const winnerWallet = pickWeightedWinner(entries);

    await mongoDbConnection
      .db()
      .collection(config.mongo.table.raffleWinners)
      .insertOne({
        raffleId,
        winner: winnerWallet.toLowerCase(),
        pickedAt: getUtcNow()
      });

    res.send({ winner: winnerWallet });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

app.post("/join-raffle", validateCsrfMiddleware, rateLimiterMiddleware, async (req, res) => {
  const { txHash, amount } = req.body;

  try {
    const provider = new JsonRpcProvider(config.web3.rpcUrl, {
      name: config.web3.chainName,
      chainId: config.web3.chainId
    });

    const receipt = await provider.getTransactionReceipt(txHash);

    if (!receipt) {
      console.log("⏳ Transaction is still pending...");
      res.status(200).json({ verified: false, status: "pending" });

      return;
    }

    if (!receipt) {
      console.log("⏳ Transaction is still pending...");
      res.status(200).json({ verified: false, status: "pending" });

      return;
    }

    if (receipt.status === 1) {
      const tx = await provider.getTransaction(txHash);

      if (receipt.from.toLowerCase() !== req.session.wallet.address.toLowerCase()) {
        res.status(200).json({ verified: true, status: "failed", message: "Wallet is not the same as logged in wallet." });

        return;
      }

      if (receipt.to.toLowerCase() !== config.web3.raffleAddress.toLowerCase()) {
        res.status(200).json({ verified: true, status: "failed", message: "Not sending to the raffle wallet" });

        return;
      }

      if (formatEther(tx.value) !== amount) {
        res.status(200).json({verified: true, status: "failed", message: "Not same amount."});

        return;
      }

      await addRaffleRecord({
        mongoDbConnection,
        txHash,
        amount: formatEther(tx.value),
        to: receipt.to,
        from: receipt.from,
        status: "verified"
      });

      res.cookie("has-raffle-entry", "true", {
        maxAge: raffleEndingIn(getUtcNow())
      });

      res.status(200).json({ verified: true, status: "success" });
    } else {
      res.status(200).json({ verified: true, status: "failed" });
    }
  } catch (err) {
    res.status(400).json({ status: "failed", message: "Invalid signature", error: err.message });
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

app.get(["/", "/:path"], rateLimiterMiddleware, (req, res) => {
  res.render("index");
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

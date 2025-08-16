import crypto from "crypto";
import {body, param, validationResult} from "express-validator";
import { JsonRpcProvider, formatEther } from "ethers";
import config from "../config/default.json" with { type: "json" };
import {adminAccessMiddleware, validateCsrfMiddleware} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import {getRaffleId, getUtcNow, raffleEndingIn, raffleEndsInDHM} from "../components/utils.mjs";
import {
  addRaffleRecord,
  getTotalAmountOnRaffleId,
  getEntriesFromRaffleId,
  getAllRaffles, raffleRecordExists,
} from "../components/db.mjs";
import {logError} from "../components/logger.mjs";

export function initRafflesRoutes(app, mongoDbConnection) {
  app.get(
    "/raffles",
    rateLimiterMiddleware,
    async (req, res) => {
      const raffleId = getRaffleId(getUtcNow());

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

  app.get(
    "/raffle/nonce",
    rateLimiterMiddleware,
    (req, res) => {
      if (!req.session.wallet?.address) {
        return res.status(401).json({ message: "Not logged in" });
      }

      const nonce = crypto.randomBytes(16).toString("hex");
      req.session.raffleNonce = nonce;

      res.json({ nonce });
    });

  app.get(
    "/raffle/:raffleId",
    param("raffleId")
      .matches(/^[0-9]{2}-[0-9]{4}$/)
      .withMessage("Invalid raffle id"),
    rateLimiterMiddleware,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      let { raffleId } = req.params;

      if (!raffleId) {
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

  app.post(
    "/join-raffle",
    body("txHash")
      .trim()
      .matches(/^0x([A-Fa-f0-9]{64})$/)
      .withMessage("Invalid Ethereum transaction hash"),
    body("amount")
      .trim()
      .isFloat({ gt: 0 })
      .withMessage("Amount must be a positive number"),
    body("nonce")
      .trim()
      .matches(/^[a-f0-9]{32}$/) // match 16 bytes hex string
      .withMessage("Invalid nonce"),
    validateCsrfMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { txHash, amount, nonce } = req.body;

      if (!req.session.raffleNonce || nonce !== req.session.raffleNonce) {
        return res.status(400).json({ verified: false, status: "failed", message: "Invalid or expired nonce" });
      }

      if (!req.session.wallet?.address) {
        return res.status(401).json({ verified: false, status: "failed", message: "Not logged in" });
      }

      const existing = await raffleRecordExists({ mongoDbConnection, txHash });

      if (existing) {
        return res.status(409).json({ verified: false, status: "failed", message: "Transaction already used" });
      }

      try {
        const provider = new JsonRpcProvider(config.web3.rpcUrl, {
          name: config.web3.chainName,
          chainId: config.web3.chainId
        });

        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
          res.status(200).json({ verified: false, status: "pending" });

          return;
        }

        if (receipt.status === 1) {
          const tx = await provider.getTransaction(txHash);

          if (receipt.from.toLowerCase() !== req.session.wallet?.address.toLowerCase()) {
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

          delete req.session.raffleNonce;

          res.cookie("has-raffle-entry", "true", {
            maxAge: raffleEndingIn(getUtcNow()),
            httpOnly: false,
            secure: config.isProd,
            sameSite: "strict",
            path: "/"
          });

          res.status(200).json({ verified: true, status: "success" });
        } else {
          res.status(200).json({ verified: true, status: "failed" });
        }
      } catch (err) {
        logError({
          message: "Failed in join-raffle",
          auditData: err,
        });
        res.status(400).json({ status: "failed", message: "Invalid signature" });
      }
    });

  app.get(
    "/pick-raffle-winner",
    adminAccessMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      try {
        const raffleId = getRaffleId(getUtcNow());

        //  Check if a winner already exists
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

          const r = crypto.randomInt(0, 1e9) / 1e9;

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
        logError({
          message: "Failed in pick-raffle-winner",
          auditData: err,
        });
        res.status(500).send("Server error");
      }
    });
}

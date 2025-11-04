import crypto from "crypto";
import {body, param, validationResult} from "express-validator";
import { JsonRpcProvider, formatEther } from "ethers";
import config from "../config/default.json" with { type: "json" };
import noCacheMiddleware, {
  adminAccessMiddleware,
  cookieCheckMiddleware,
  requireWalletSession,
  validateCsrfMiddleware
} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import {logError} from "../components/logger.mjs";
import TournamentEntryModel from "../models/tournament-entry-model.mjs";
import evmModule from "../../common/evm-config.mjs";

const FirstTournament = {
  id: 1,
  amount: 1,
}

export function initTournamentEntryRoutes(app) {
  app.get(
    "/tournament-entry",
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      const userEntry = await TournamentEntryModel.findByWallet({
        tournamentId: FirstTournament.id,
        address: req.session.wallet.address.toLowerCase(),
      });
      const entries = await TournamentEntryModel.getEntries({
        tournamentId: FirstTournament.id,
      });

      if (userEntry) {
        return res.render("tournament-entry/index", {
          tournamentEntry: FirstTournament,
          hasEntry: userEntry,
          selectedNav: "tournaments",
          entries,
        });
      } else {
        return res.render("tournament-entry/index", {
          tournamentEntry: FirstTournament,
          hasEntry: userEntry,
          selectedNav: "tournaments",
          entries,
        });
      }
    });

  app.get(
    "/tournament-entry/nonce",
    noCacheMiddleware,
    rateLimiterMiddleware,
    (req, res) => {
      if (!req.session.wallet?.address) {
        return res.status(401).json({ message: "Not logged in" });
      }

      const nonce = crypto.randomBytes(16).toString("hex");

      req.session.tournamentNonce = nonce;

      res.json({ nonce });
    });

  app.post(
    "/tournament-entry/join",
    body("txHash")
      .trim()
      .matches(/^0x([A-Fa-f0-9]{64})$/)
      .withMessage("Invalid Ethereum transaction hash"),
    body("discord")
      .trim()
      .matches(/^(?:(?!.*[_.]{2})[a-z0-9](?:[a-z0-9._]{0,30}[a-z0-9])?|.{2,32}#[0-9]{4})$/)
      .withMessage("Invalid Discord username"),
    body("nonce")
      .trim()
      .matches(/^[a-f0-9]{32}$/) // match 16 bytes hex string
      .withMessage("Invalid nonce"),
    cookieCheckMiddleware,
    validateCsrfMiddleware,
    requireWalletSession,
    rateLimiterMiddleware,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const amount = FirstTournament.amount;
      const { txHash, nonce, discord } = req.body;

      if (!req.session.tournamentNonce || nonce !== req.session.tournamentNonce) {
        logError({
          message: "Invalid or expired nonce",
          sessionNonce: "req.session.tournamentNonce",
          nonce,
        });

        return res.status(400).json({ verified: false, status: "failed", message: "Invalid or expired nonce" });
      }

      if (!req.session.wallet?.address) {
        logError({
          message: "Failed in join tournament entry",
          auditData: {
            message: "Not logged in",
          },
        });

        return res.status(401).json({ verified: false, status: "failed", message: "Not logged in" });
      }

      const existing = await TournamentEntryModel.isRecordExists({ txHash });

      if (existing) {
        return res.status(409).json({ verified: false, status: "failed", message: "Transaction already used" });
      }

      try {
        const chainConfig = evmModule.getEvmConfig(req.session.wallet.network);
        const provider = new JsonRpcProvider(chainConfig.rpcUrl);

        const receipt = await provider.getTransactionReceipt(txHash);

        if (!receipt) {
          res.status(200).json({ verified: false, status: "pending" });

          return;
        }

        if (receipt.status === 1) {
          const tx = await provider.getTransaction(txHash);

          if (receipt.from.toLowerCase() !== req.session.wallet?.address.toLowerCase()) {
            logError({
              message: "Failed in join tournament entry",
              auditData: {
                message: "Wallet is not the same as logged in wallet.",
                from: receipt.from.toLowerCase(),
                sessionWallet: req.session.wallet?.address.toLowerCase(),
              },
            });
            res.status(200).json({ verified: true, status: "failed", message: "Wallet is not the same as logged in wallet." });

            return;
          }

          if (receipt.to.toLowerCase() !== config.web3.tournamentAddress.toLowerCase()) {
            res.status(200).json({ verified: true, status: "failed", message: "Not sending to the tournament wallet" });
            logError({
              message: "Failed in join tournament entry",
              auditData: {
                message: "Wallet is not the going to the same address.",
                to: receipt.to.toLowerCase(),
                configTo: config.web3.raffleAddress.toLowerCase(),
              },
            });

            return;
          }

          if (Number(formatEther(tx.value)) !== Number(amount)) {
            res.status(200).json({verified: true, status: "failed", message: "Not same amount."});
            logError({
              message: "Failed in join tournament entry",
              auditData: {
                message: `Wrong value. Just be ${amount}`,
                ether: Number(formatEther(tx.value)),
                form: Number(amount),
              },
            });

            return;
          }

          await TournamentEntryModel.addRecord({
            txHash,
            amount: formatEther(tx.value),
            to: receipt.to,
            from: receipt.from,
            status: "verified",
            discord,
            tournamentId: FirstTournament.id,
            network: req.session.wallet.network,
          });

          delete req.session.tournamentNonce;

          res.cookie("has-tournament-entry", "true", {
            // maxAge: raffleEndingIn(getUtcNow()),
            httpOnly: false,
            secure: config.isProd,
            sameSite: "strict",
            path: "/"
          });

          res.status(200).json({ verified: true, status: "success" });
        } else {
          logError({
            message: "Failed in join-tournament",
            auditData: {
              message: "Wrong status.",
              receipt,
            },
          });

          res.status(200).json({ verified: true, status: "failed" });
        }
      } catch (err) {
        logError({
          message: "Failed in join-tournament",
          auditData: err,
        });
        res.status(400).json({ status: "failed", message: "Invalid signature" });
      }
    });
}

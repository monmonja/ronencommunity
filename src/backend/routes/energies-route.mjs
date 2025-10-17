import {body, param, validationResult} from "express-validator";
import {cookieCheckMiddleware, requireWalletSession, validateCsrfMiddleware} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import Games from "../models/games.mjs";
import Energies from "../models/energies.mjs";
import {logError} from "../components/logger.mjs";
import config from "../config/default.json" with { type: "json" };
import crypto from "crypto";
import {Contract, formatEther, Interface, JsonRpcProvider, parseUnits} from "ethers";
import {handleValidation} from "../utils/validations.mjs";
import PurchasedEnergies from "../models/purchased-energies.mjs";
import Admin from "../models/admin.mjs";

export function initEnergyRoutes(app) {
  app.get(
    "/energy/get/:path",
    param("path")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Invalid game"),
    requireWalletSession,
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      if (!handleValidation(req, res)) {
        return;
      }

      const game = Games.getGame(req.params.path);

      if (!game) {
        return res.status(400).json({ success: false, errors: "No game" });
      }

      game.available = await Energies.getAvailableEnergies({
        address: req.session.wallet.address.toLowerCase(),
        gameId: game.slug,
      });

      const adminSettings = await Admin.getAllRecordsAsObject();

      game.config = JSON.parse(adminSettings.energies);

      delete game.changeLog;

      return res.json(game);
    });

  app.get(
    "/energy/use/:path",
    param("path")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Invalid game"),
    rateLimiterMiddleware,
    cookieCheckMiddleware,
    requireWalletSession,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const game = Games.getGame(req.params.path);

      if (!game) {
        return res.status(400).json({ success: false, errors: "No game" });
      }

      let available = 0;

      try {
        available = await Energies.useEnergy({
          address: req.session.wallet.address.toLowerCase(),
          gameId: req.params.path,
        });
      } catch (e) {
        logError({
          message: "Use life when there is none",
          auditData: e,
        });
      }

      game.available = available;
      const adminSettings = await Admin.getAllRecordsAsObject();

      game.config = JSON.parse(adminSettings.energies);
      delete game.changeLog;

      return res.json(game);
    });

  app.get(
    "/energy/nonce",
    rateLimiterMiddleware,
    (req, res) => {
      if (!req.session.wallet?.address) {
        return res.status(401).json({ message: "Not logged in" });
      }

      const nonce = crypto.randomBytes(16).toString("hex");

      req.session.energyNonce = nonce;

      res.json({ nonce });
    });

  app.post(
    "/energy/buy",
    body("txHash")
      .trim()
      .matches(/^0x([A-Fa-f0-9]{64})$/)
      .withMessage("Invalid Ethereum transaction hash"),
    body("nonce")
      .trim()
      .matches(/^[a-f0-9]{32}$/) // match 16 bytes hex string
      .withMessage("Invalid nonce"),
    cookieCheckMiddleware,
    validateCsrfMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { txHash, nonce } = req.body;

      if (!req.session.energyNonce || nonce !== req.session.energyNonce) {
        logError({
          message: "Invalid or expired nonce",
          sessionNonce: "req.session.energyNonce",
          nonce,
        });

        return res.status(400).json({ verified: false, status: "failed", message: "Invalid or expired nonce" });
      }

      if (!req.session.wallet?.address) {
        logError({
          message: "Failed in buy-energy",
          auditData: {
            message: "Not logged in",
          },
        });

        return res.status(401).json({ verified: false, status: "failed", message: "Not logged in" });
      }

      const existing = await Energies.isRecordExists({ txHash });

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
            logError({
              message: "Failed in buy-energy",
              auditData: {
                message: "Wallet is not the same as logged in wallet.",
                from: receipt.from.toLowerCase(),
                sessionWallet: req.session.wallet?.address.toLowerCase(),
              },
            });
            res.status(200).json({ verified: true, status: "failed", message: "Wallet is not the same as logged in wallet." });

            return;
          }

          let actualRecipient;
          let purchasedEnergy;
          let token = 'RON';

          const adminSettings = await Admin.getAllRecordsAsObject();
          const energyConfig = JSON.parse(adminSettings.energies);

          if (tx.data === "0x" && tx.value > 0) {
            actualRecipient = receipt.to.toLowerCase();
            purchasedEnergy = energyConfig.filter((i) => i["ron"].toString() === Number(formatEther(tx.value)).toString());
          } else {
            const ERC20_ABI = ["function transfer(address to, uint256 amount)"];
            const iFace = new Interface(ERC20_ABI);

            const parsed = iFace.parseTransaction({ data: tx.data, value: tx.value });

            actualRecipient = parsed.args.to.toLowerCase();

            const contract = new Contract(config.web3.ronenContract, [
              "function decimals() view returns (uint8)"
            ], provider);
            const decimals = await contract.decimals();

            purchasedEnergy = energyConfig.filter((i) => parseUnits(i["ronen"].toString(), decimals) === parsed.args.amount);
            token = "RONEN";
          }

          if (actualRecipient.toLowerCase() !== config.web3.purchaseAddress.toLowerCase()) {
            res.status(200).json({ verified: true, status: "failed", message: "Not sending to the purchase wallet" });
            logError({
              message: "Failed in buy-energy",
              auditData: {
                token,
                message: "Wallet is not the going to the same address.",
                to: actualRecipient.toLowerCase(),
                configTo: config.web3.purchaseAddress.toLowerCase(),
              },
            });

            return;
          }

          if (!purchasedEnergy || purchasedEnergy?.length === 0) {
            res.status(200).json({verified: true, status: "failed", message: "Not same amount."});
            logError({
              message: "Failed in buy-energy",
              auditData: {
                message: "Wrong value.",
                ether: Number(formatEther(tx.value))
              },
            });

            return;
          }

          await PurchasedEnergies.addEnergy({
            txHash,
            address: receipt.from,
            amount: purchasedEnergy[0].energy,
            price: token === 'RON' ? purchasedEnergy[0].ron: purchasedEnergy[0].ronen,
            token,
          });

          delete req.session.energyNonce;

          res.status(200).json({ verified: true, status: "success" });
        } else {
          logError({
            message: "Failed in buy-energy",
            auditData: {
              message: "Wrong status.",
              receipt,
            },
          });

          res.status(200).json({ verified: true, status: "failed" });
        }
      } catch (err) {
        logError({
          message: "Failed in buy-energy",
          auditData: err,
        });
        res.status(400).json({ status: "failed", message: "Invalid signature" });
      }
    });
}

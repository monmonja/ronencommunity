import {body, param, validationResult} from "express-validator";
import {cookieCheckMiddleware, requireWalletSession, validateCsrfMiddleware} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import WalletsModel from "../models/wallets-model.mjs";
import {makeBaxie} from "../games/baxies/baxie-utilities.mjs";
import NftModel from "../models/nft-model.mjs";
import {logError} from "../components/logger.mjs";

import config from "../config/default.json"  with { type: "json" };
import TokenModel from "../models/token-model.mjs";
import {formatEther, JsonRpcProvider} from "ethers";

export function initWalletRoutes(app) {
  app.get(
    "/list/baxie-info/:tokenId",
    param("tokenId")
      .matches(/^[0-9]+$/)
      .withMessage("Invalid token Id"),
    requireWalletSession,
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      const nftTokenId = "baxies";
      let nftItem = await NftModel.findById({
        nftTokenId,
        nftId: req.params.tokenId,
        address: req.session.wallet.address.toLowerCase(),
      });

      if (!nftItem) {
        nftItem = await NftModel.getNFTMetadata({
          address: req.session.wallet.address.toLowerCase(),
          nftTokenId,
          tokenURI: `https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28/${req.params.tokenId}`,
          nftId: req.params.tokenId,
        });
      }

      const baxie = makeBaxie(nftItem);

      res.json({
        ...nftItem,
        ...baxie.getGameInfo(true),
      });
    });

  app.get(
    "/list/baxies/:sync",
    param("sync")
      .isBoolean()
      .withMessage("Invalid force"),
    rateLimiterMiddleware,
    requireWalletSession,
    cookieCheckMiddleware,
    async (req, res) => {
      try {
        const nftTokeId = "baxies";
        /// get from query string
        const userWallet = req.session.wallet.address;

        let walletNft = await WalletsModel.getNftItems(nftTokeId, userWallet);

        if (req.params.sync === "true" || walletNft.length === 0) {
          const contractAddress = "0xb79f49ac669108426a69a26a6ca075a10c0cfe28";
          const abi = [
            "function balanceOf(address owner) view returns (uint256)",
            "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
            "function tokenURI(uint256 tokenId) view returns (string)",
            "function ownerOf(uint256 tokenId) view returns (address)"
          ];

          walletNft = await WalletsModel.getUserNFTs("baxies", contractAddress, abi, userWallet);
        }

        const nfts = await NftModel.getNftItems(nftTokeId, userWallet);

        walletNft = walletNft.filter((item) => {
          if (nfts[item.tokenId]) {
            const baxie = makeBaxie(nfts[item.tokenId]);

            return baxie.attributes.status !== "Unhatched";
          } else {
            return true
          }
        });

        walletNft.forEach((item) => {
          if (nfts[item.tokenId]) {
            const baxie = makeBaxie(nfts[item.tokenId]);

            item.nft = {
              ...nfts[item.tokenId],
              ...baxie.getGameInfo(true),
            };
            item.tokenId = String(item.tokenId);
            item.nft.nftId = String(item.nft.nftId);
          } else {

          }
        });

        res.json(walletNft);
      } catch (error) {
        logError({
          message: "Error in /list/baxies/:sync",
          auditData: error,
        });
      }
    });

  app.get(
    "/wallet/nonce",
    requireWalletSession,
    rateLimiterMiddleware,
    (req, res) => {
      const nonce = crypto.randomBytes(16).toString("hex");

      req.session.walletNonce = nonce;

      res.json({ nonce });
    });

  app.post(
    "/deposit",
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
    cookieCheckMiddleware,
    validateCsrfMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { txHash, amount, nonce } = req.body;

      if (!req.session.walletNonce || nonce !== req.session.walletNonce) {
        logError({
          message: "Invalid or expired nonce",
          sessionNonce: "req.session.walletNonce",
          nonce,
        });

        return res.status(400).json({ verified: false, status: "failed", message: "Invalid or expired nonce" });
      }

      if (!req.session.wallet?.address) {
        logError({
          message: "Failed in deposit",
          auditData: {
            message: "Not logged in",
          },
        });

        return res.status(401).json({ verified: false, status: "failed", message: "Not logged in" });
      }

      const existing = await TokenModel.isRecordExists({ txHash });

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
              message: "Failed in deposit",
              auditData: {
                message: "Wallet is not the same as logged in wallet.",
                from: receipt.from.toLowerCase(),
                sessionWallet: req.session.wallet?.address.toLowerCase(),
              },
            });
            res.status(200).json({ verified: true, status: "failed", message: "Wallet is not the same as logged in wallet." });

            return;
          }

          if (receipt.to.toLowerCase() !== config.web3.depositAddress.toLowerCase()) {
            res.status(200).json({ verified: true, status: "failed", message: "Not sending to the wallet wallet" });
            logError({
              message: "Failed in deposit",
              auditData: {
                message: "Wallet is not the going to the same address.",
                to: receipt.to.toLowerCase(),
                configTo: config.web3.depositAddress.toLowerCase(),
              },
            });

            return;
          }

          if (Number(formatEther(tx.value)) !== Number(amount)) {
            res.status(200).json({verified: true, status: "failed", message: "Not same amount."});
            logError({
              message: "Failed in deposit",
              auditData: {
                message: "Wrong value.",
                ether: Number(formatEther(tx.value)),
                form: Number(amount),
              },
            });

            return;
          }

          await TokenModel.addRecord({
            txHash,
            amount: formatEther(tx.value),
            to: receipt.to,
            from: receipt.from,
            status: "verified"
          });

          delete req.session.walletNonce;


          res.status(200).json({ verified: true, status: "success" });
        } else {
          logError({
            message: "Failed in deposit",
            auditData: {
              message: "Wrong status.",
              receipt,
            },
          });

          res.status(200).json({ verified: true, status: "failed" });
        }
      } catch (err) {
        logError({
          message: "Failed in deposit",
          auditData: err,
        });
        res.status(400).json({ status: "failed", message: "Invalid signature" });
      }
    })
}

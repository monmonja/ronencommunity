import { ethers } from "ethers";
import { verifyMessage } from "ethers";
import { body, param, validationResult } from "express-validator";
import {cookieCheckMiddleware, requireWalletSession, validateCsrfMiddleware} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import config from "../config/default.json" with { type: "json" };
import {logError} from "../components/logger.mjs";
import Wallets from "../models/wallets.mjs";

export function initWalletRoutes(app) {
  app.get(
    "/list/baxie-info/:tokenId",
    param("tokenId")
      .matches(/^[0-9]+$/)
      .withMessage("Invalid token Id"),
    // requireWalletSession,
    // cookieCheckMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      res.json(await Wallets.getNFTMetadata(`https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28/${req.params.tokenId}`));
    });

  app.get(
    "/list/baxies",
    rateLimiterMiddleware,
    async (req, res) => {
      const contractAddress = "0xb79f49ac669108426a69a26a6ca075a10c0cfe28";
      const abi = [
        "function balanceOf(address owner) view returns (uint256)",
        "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
        "function tokenURI(uint256 tokenId) view returns (string)",
        "function ownerOf(uint256 tokenId) view returns (address)"
      ];

      const userWallet = "0xCE5ECbcbb1f1a3A58836b81133FFA356204F8C21"; // replace with real wallet
      const assets = await Wallets.getUserNFTs(contractAddress, abi, userWallet);
      res.json(assets);
    });
}

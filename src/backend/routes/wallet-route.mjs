import { ethers } from "ethers";
import { verifyMessage } from "ethers";
import { body, param, validationResult } from "express-validator";
import {cookieCheckMiddleware, requireWalletSession, validateCsrfMiddleware} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import WalletsModel from "../models/wallets-model.mjs";
import {makeBaxie} from "../games/baxies/baxie-utilities.mjs";

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
      const nftTokenId = 'baxies';
      const data = await WalletsModel.getNFTMetadata({
        nftTokenId,
        tokenURI: `https://metadata.ronen.network/0xb79f49ac669108426a69a26a6ca075a10c0cfe28/${req.params.tokenId}`,
        nftId: req.params.tokenId,
      });

      const baxiee = makeBaxie(data);

      res.json({
        ...data,
        ...baxiee.getGameInfo(true),
      });
    });

  app.get(
    "/list/baxies",
    rateLimiterMiddleware,
    requireWalletSession,
    cookieCheckMiddleware,
    async (req, res) => {
      const nftTokeId = 'baxies';
      const userWallet = req.session.wallet.address;

      if (await WalletsModel.hasNftSyncToday(nftTokeId, userWallet)) {
        console.log('Getting NFTs for', userWallet);
        res.json(await WalletsModel.getNftItems(nftTokeId, userWallet));
      } else {
        console.log('Syncing NFTs for', userWallet);
        const contractAddress = "0xb79f49ac669108426a69a26a6ca075a10c0cfe28";
        const abi = [
          "function balanceOf(address owner) view returns (uint256)",
          "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
          "function tokenURI(uint256 tokenId) view returns (string)",
          "function ownerOf(uint256 tokenId) view returns (address)"
        ];

        const assets = await WalletsModel.getUserNFTs('baxies', contractAddress, abi, userWallet);
        res.json(assets);
      }
    });
}

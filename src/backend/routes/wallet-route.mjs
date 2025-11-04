import { param } from "express-validator";
import noCacheMiddleware, {cookieCheckMiddleware, requireWalletSession} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import WalletsModel from "../models/wallets-model.mjs";
import {makeBaxie} from "../games/baxies/baxie-utilities.mjs";
import NftModel from "../models/nft-model.mjs";
import {logError} from "../components/logger.mjs";

export function initWalletRoutes(app) {
  app.get(
    "/list/baxie-info/:tokenId",
    param("tokenId")
      .matches(/^[0-9]+$/)
      .withMessage("Invalid token Id"),
    requireWalletSession,
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    noCacheMiddleware,
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
    noCacheMiddleware,
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
}

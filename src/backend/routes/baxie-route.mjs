import { param } from "express-validator";
import noCacheMiddleware, {cookieCheckMiddleware, requireWalletSession} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import WalletsModel from "../models/wallets-model.mjs";
import {makeBaxie} from "../games/baxies/baxie-utilities.mjs";
import NftModel from "../models/nft-model.mjs";
import {logError} from "../components/logger.mjs";
import {breedOne} from "../components/baxie-breeding.mjs";

export function initBaxieRoutes(app) {
  app.get(
    "/baxie/info/:tokenId",
    param("tokenId")
      .matches(/^[0-9]+$/)
      .withMessage("Invalid token Id"),
    requireWalletSession,
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    noCacheMiddleware,
    async (req, res) => {
      const nftTokenId = "baxies";
      const address = req.session.wallet.address.toLowerCase();
      const network = req.session.wallet.network;

      let nftItem = await NftModel.findById({
        nftTokenId,
        nftId: req.params.tokenId,
        address,
        network,
      });

      if (!nftItem) {
        nftItem = await NftModel.getNFTMetadata({
          address: req.session.wallet.address.toLowerCase(),
          nftTokenId,
          network,
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
    "/baxies/:sync",
    param("sync")
      .isBoolean()
      .withMessage("Invalid force"),
    rateLimiterMiddleware,
    requireWalletSession,
    noCacheMiddleware,
    cookieCheckMiddleware,
    async (req, res) => {
      try {
        const nftTokenId = "baxies";
        /// get from query string
        const address = req.session.wallet.address.toLowerCase();
        const network = req.session.wallet.network;

        let walletNft = await WalletsModel.getNftItems(nftTokenId, address);

        if (req.params.sync === "true" || walletNft.length === 0) {
          const tokens = await NftModel.getNftTokens({
            nftTokenId,
            network,
            address,
          });

          walletNft = await WalletsModel.getUserNFTs("baxies", tokens, address);
        }

        const nfts = await NftModel.getNftItems({ nftTokenId, network });

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
          message: "Error in /baxies/:sync",
          auditData: error,
        });
      }
    });


  app.get(
    "/baxie/breed/:male/:female",
    param("sync")
      .isBoolean()
      .withMessage("Invalid force"),
    rateLimiterMiddleware,
    requireWalletSession,
    noCacheMiddleware,
    cookieCheckMiddleware,
    async (req, res) => {
      const network = req.session.wallet.network;
// Define your parents
      let male = await NftModel.findById({
        nftTokenId: "baxies",
        network: network,
        nftId: req.params.male
      });
      const parentMale = {
        gender: 'male',
        parts: {},
      }
      for (const row of male.data.attributes) {
        if (row.trait_type === 'Class') {
          parentMale.parts.Body = row.value;
        } else if (['Tail', 'Ears', 'Mouth', 'Eyes', 'Forehead'].includes(row.trait_type)) {
          parentMale.parts[row.trait_type] = row.value;
        }
      }

      let female = await NftModel.findById({
        nftTokenId: "baxies",
        network: network,
        nftId: req.params.female
      });
      const parentFemale = {
        gender: 'female',
        parts: {},
      }
      for (const row of female.data.attributes) {
        if (row.trait_type === 'Class') {
          parentFemale.parts.Body = row.value;
        } else if (['Tail', 'Ears', 'Mouth', 'Eyes', 'Forehead'].includes(row.trait_type)) {
          parentFemale.parts[row.trait_type] = row.value;
        }
      }

// Breed with default settings (70% parents, 25% variation, 5% mutation, 0.5% mystic)
      console.log(parentMale, parentFemale)
      res.json(breedOne(parentMale, parentFemale));
    });
}

import { ethers } from "ethers";
import {getUtcNow} from "../utils/date-utils.mjs";
import config from "../config/default.json" with { type: "json" };
import {getConnection} from "../components/db.mjs";
import {logError} from "../components/logger.mjs";

export default class WalletsModel {
  constructor(address) {
    this.address = address;
  }

  static async addRecord({ address, network } = {}) {
    const mongoDbConnection = await getConnection();

    const existing = await mongoDbConnection.db()
      .collection(config.mongo.table.wallets)
      .findOne({ address: address.toLowerCase(), network });

    if (existing) {
      return; // Already exists, do nothing
    }

    await mongoDbConnection.db().collection(config.mongo.table.wallets).updateOne(
      { address: address.toLowerCase(), network: "ronin" }, // match criteria
      {
        $setOnInsert: {
          network,
          createdAt: getUtcNow()
        }
      },
      { upsert: true }
    );
  }

  static async findByWallet({ address } = {}) {
    const mongoDbConnection = await getConnection();

    return await mongoDbConnection.db().collection(config.mongo.table.wallets)
      .findOne({ address });
  }

  /**
   * Query all NFTs a wallet owns from a specific contract.
   * @param {string} nftTokenId - The NFT contract address.
   * @param {Array} tokens - Array of { tokenId, uri }.
   * @param {string} address - User wallet address.
   * @returns Array of { tokenId, uri }
   */
  static async getUserNFTs(nftTokenId, tokens, address) {
    try {
      const mongoDbConnection = await getConnection();

      await mongoDbConnection.db().collection(config.mongo.table.wallets)
        .updateOne(
          {address: address.toLowerCase().trim()}, // match criteria
          {
            $set: {
              nfts: {
                tokenId: nftTokenId,
                items: tokens,
                updatedAt: new Date(),
              }
            },
          },
          {upsert: true}
        );

      return tokens;
    } catch (e) {
      logError({
        message: "Error on Wallet.getUserNFTs",
        auditData: e
      });
      return [];
    }
  }

  static async hasNftSyncToday(nftTokenId, address) {
    const mongoDbConnection = await getConnection();

    // Get the start of today (midnight)
    const startOfDay = new Date();

    startOfDay.setHours(0, 0, 0, 0);

    const wallet = await mongoDbConnection
      .db()
      .collection(config.mongo.table.wallets)
      .findOne({
        address,
        "nfts.tokenId": nftTokenId,
        "nfts.updatedAt": { $gte: startOfDay }
      });

    return wallet !== null;
  }

  static async getNftItems(nftTokenId, address) {
    const mongoDbConnection = await getConnection();

    const wallet = await mongoDbConnection
      .db()
      .collection(config.mongo.table.wallets)
      .findOne(
        { address, "nfts.tokenId": nftTokenId },
        { projection: { "nfts.items": 1, _id: 0 } }
      );

    if (!wallet || !wallet.nfts || !wallet.nfts.items) {
      return [];
    }

    return wallet.nfts.items;
  }

}

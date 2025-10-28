import { ethers } from "ethers";
import {getUtcNow} from "../utils/date-utils.mjs";
import config from "../config/default.json" with { type: "json" };
import {getConnection} from "../components/db.mjs";
import {logError} from "../components/logger.mjs";

const RONIN_RPC_URL = "https://api.roninchain.com/rpc";

export default class WalletsModel {
  constructor(address) {
    this.address = address;
  }

  static async addRecord({ address } = {}) {
    const mongoDbConnection = await getConnection();

    await mongoDbConnection.db().collection(config.mongo.table.wallets).updateOne(
      { address: address.toLowerCase(), network: "ronin" }, // match criteria
      {
        $setOnInsert: {
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
   *
   * @param contractAddress NFT contract address
   * @param contractABI ABI array for the contract
   * @param address Wallet address to query
   * @returns Array of { tokenId, uri }
   */
  static async getUserNFTs(nftTokenId, contractAddress, contractABI, address) {
    try {
      const provider = new ethers.JsonRpcProvider(RONIN_RPC_URL);
      const contract = new ethers.Contract(contractAddress, contractABI, provider);
      const tokens = [];

      if (contract.tokenOfOwnerByIndex) {
        const balance = await contract.balanceOf(address);
        const indices = Array.from({length: Number(balance)}, (_, i) => i);

        // helper to process in chunks
        async function processInBatches(items, batchSize, handler) {
          for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);

            await Promise.all(batch.map(handler)); // wait for all in batch
          }
        }

        await processInBatches(indices, 2, async (i) => {
          try {
            const tokenId = await contract.tokenOfOwnerByIndex(address, i);
            const uri = await contract.tokenURI(tokenId);

            tokens.push({tokenId: tokenId.toString(), uri});
          } catch (e) {
            logError({
              message: "Error on Wallet.getUserNFTs",
              auditData: e
            });
          }
        });
console.log(tokens)
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
      }
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

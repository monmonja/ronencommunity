import { ethers } from "ethers";
import {getUtcNow} from "../utils/date-utils.mjs";
import config from "../config/default.json" with { type: "json" };
import {getConnection} from "../components/db.mjs";
import {logError} from "../components/logger.mjs";
import evmModule from "../../common/evm-config.mjs";

export default class NftModel {
  static async addRecord({ nftTokenId, nftId, data, address, network } = {}) {
    const mongoDbConnection = await getConnection();

    await mongoDbConnection.db().collection(config.mongo.table.nfts).updateOne(
      { nftTokenId, network: "ronin", nftId }, // match criteria
      {
        $setOnInsert: {
          address,
          data,
          network,
          createdAt: getUtcNow()
        }
      },
      { upsert: true }
    );
  }

  static async findById({ nftTokenId, nftId, address, network } = {}) {
    const mongoDbConnection = await getConnection();

    const findQuery = {
      nftTokenId,
      network,
      nftId
    };

    if (address) {
      findQuery.address = address;
    }

    console.log({
      nftTokenId,
      network,
      nftId
    })

    const data = await mongoDbConnection.db().collection(config.mongo.table.nfts)
      .findOne(findQuery);

    if (data) {
      return data;
    }

    return null;
  }


  static async getNftTokens({ nftTokenId, network, address } = {}) {
    const contractABI = [
      "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      "function balanceOf(address owner) view returns (uint256)",
      "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
      "function tokenURI(uint256 tokenId) view returns (string)",
      "function ownerOf(uint256 tokenId) view returns (address)",
      "function supportsInterface(bytes4 interfaceID) view returns (bool)"
    ];

    const ERC721Enumerable = "0x780e9d63";
    const chainConfig = evmModule.getEvmConfig(network);
    const contractAddress = nftTokenId === 'baxies' ? chainConfig.baxieContract : '';
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    let tokens = [];

    const supportsEnumerable = await contract.supportsInterface(ERC721Enumerable).catch(() => false);

    if (supportsEnumerable) {
      const balance = await contract.balanceOf(address);

      const indices = Array.from({length: Number(balance)}, (_, i) => i);

      // helper to process in chunks
      async function processInBatches(items, batchSize, handler) {
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);

          await Promise.all(batch.map(handler)); // wait for all in batch
        }
      }

      await processInBatches(indices, 1, async (i) => {
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
    } else {
      // Scan all Transfer events to this owner
      const filter = contract.filters.Transfer(null, address);
      const events = await contract.queryFilter(filter, 0, "latest");

      // Extract token IDs
      const tokenIds = events
        .map(e => e.args?.tokenId?.toString())
        .filter(Boolean);

      // Optionally fetch tokenURI
        tokens = await Promise.all(
          tokenIds.map(async (id) => {
            try {
              const uri = await contract.tokenURI(id);
              return { tokenId: id, tokenURI: uri };
            } catch {
              return { tokenId: id, tokenURI: null };
            }
          })
        );
    }

    return tokens;
  }

  static async getNftItems({ nftTokenId, network } = {}) {
    const mongoDbConnection = await getConnection();

    const nftsArray = await mongoDbConnection
      .db()
      .collection(config.mongo.table.nfts)
      .find(
        { nftTokenId, network },
      )
      .toArray();

    return nftsArray.reduce((acc, nft) => {
      acc[nft.nftId] = nft;
      return acc;
    }, {});
  }

  static async getMetadataUrl({ nftTokenId = 'baxies' } = {}) {
    const abi = [
      "function tokenURI(uint256 tokenId) view returns (string)",
      "function ownerOf(uint256 tokenId) view returns (address)"
    ];

    const chainConfig = evmModule.getEvmConfig('abstract');
    const contractAddress = nftTokenId === 'baxies' ? chainConfig.baxieContract : '';
    const provider = new ethers.JsonRpcProvider(chainConfig.rpcUrl);

    const contract = new ethers.Contract(contractAddress, abi, provider);
    const tokenId = 1211; // example
    const uri = await contract.tokenURI(tokenId);

    // eslint-disable-next-line no-console
    console.log("Token URI:", uri);
  }

  static async getNFTMetadata({ nftTokenId, nftId, address, network } = {}) {
    const chainConfig = evmModule.getEvmConfig(network);
    let tokenURI = nftTokenId === 'baxies' ? `${chainConfig.tokenMetadataBaseUrl}${nftId}` : '';


    // eslint-disable-next-line no-console
    console.log("get new info for", nftId, network);

    if (tokenURI.startsWith("ipfs://")) {
      tokenURI = `https://ipfs.io/ipfs/${tokenURI.replace("ipfs://", "")}`;
    }

    const res = await fetch(tokenURI);

    if (!res.ok) {
      throw new Error(`Failed to fetch metadata: ${res.status}`);
    }

    const data = await res.json();

    await NftModel.addRecord({ nftTokenId, nftId, data, address, network });

    return { nftTokenId, nftId, data, address };
  }
}

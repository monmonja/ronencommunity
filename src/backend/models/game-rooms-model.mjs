import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import NftModel from "./nft-model.mjs";
import {makeBaxie} from "../games/baxies/baxie-utilities.mjs";
import {GameModes} from "../../../games/common/baxie/baxie-simulation.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {Object} GameRoomPlayer
 * @property {string} address - Player's wallet address
 * @property {Baxie[]} baxies - Player's selected baxies
 */
/**
 * @typedef {Object} GameRoom
 * @property {string} roomId - Unique identifier for the room
 * @property {GameRoomPlayer[]} players - List of players in the room
 * @property {string} game - Game being played in the room
 * @property {string} playerTurn - Address of the player whose turn it is
 * @property {Baxie} selectedBaxie - Currently selected baxie
 * @property {boolean} canJoin - Whether new players can join the room
 * @property {boolean} vsCPU - Whether the game is against a CPU
 * @property {string} cpuAddress - Address of the CPU player (if vsCPU is true)
 * @property {string} loserAddress - Address of the player who lost
 * @property {string} gameMode - Game mode
 * @property {Date} lastUpdateSP - Last time sp were updated
 * @property {Date} start - Start time of the game
 */
export class GameRoomsModel {
  /**
   * @type GameRoom
   */
  static rooms = {};

  static async createRoom({ address, game, vsCPU = false,
                            gameMode = GameModes.skillCountdown,
                            characterIds
  } = {}) {
    const shortHand = address ? address.slice(0, 4) + '-' + address.slice(-4) : '';
    const roomId = `${game.gameRoomSlug}-${shortHand}-${Math.random().toString(36).substring(2, 10)}`;

    // check if address already has a room
    for (const existingRoomId in GameRoomsModel.rooms) {
      const room = GameRoomsModel.rooms[existingRoomId];

      if (room && room.players.find(player => player.address === address)) {
        GameRoomsModel.rooms[existingRoomId] = null;
      }
    }

    GameRoomsModel.rooms[roomId] = {
      players: [{
        address
      }],
      game: game.slug,
      canJoin: true,
      start: new Date(),
      vsCPU: false,
      gameMode,
    };

    if (vsCPU) {
      GameRoomsModel.rooms[roomId].vsCPU = true;
      GameRoomsModel.rooms[roomId].cpuAddress =  'cpu' + (new Date()).getTime() + Math.random().toString(36).substring(2, 6);
      const cpuPlayer = {
        address: GameRoomsModel.rooms[roomId].cpuAddress,
      };

      characterIds = characterIds || [];
      if (characterIds.length !== 3) {
        characterIds  = [1, 3, 4]
      }
      console.log(characterIds, 'characterIds')

      const nftDocs = await Promise.all(
        characterIds.map((baxieId) =>
          NftModel.findById({ nftTokenId: 'baxies', nftId: baxieId })
        )
      );

      cpuPlayer.baxies = nftDocs.map((nftData) => makeBaxie(nftData));
      GameRoomsModel.rooms[roomId].players.push(cpuPlayer);
      GameRoomsModel.rooms[roomId].canJoin = false;
    }

    return roomId;
  }

  static joinRoom({ roomId, address } = {}) {
    if (GameRoomsModel.rooms[roomId] && GameRoomsModel.rooms[roomId].canJoin) {
      GameRoomsModel.rooms[roomId].players.push({
        address
      });
      GameRoomsModel.rooms[roomId].canJoin = false;

      return true;
    }

    return false;
  }
}

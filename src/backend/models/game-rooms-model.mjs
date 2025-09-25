import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {Object} GameObject
 * @property {string} name - Display name of the game
 * @property {number} dailyEnergy - Number of daily lives/plays allowed
 * @property {string} slug - Unique identifier for the game
 * @property {object[]} changeLog - List of changes
 */
export default class GameRoomsModel {
  static rooms = {};

  static createRoom({ address, game } = {}) {
    const shortHand = address ? address.slice(0, 4) + '-' + address.slice(-4) : '';
    const roomId = `${game.gameRoomSlug}-${shortHand}-${Math.random().toString(36).substring(2, 10)}`;

    // check if address already has a room
    for (const existingRoomId in GameRoomsModel.rooms) {
      const room = GameRoomsModel.rooms[existingRoomId];

      if (room.players.find(player => player.address === address)) {
        return existingRoomId;
      }
    }

    GameRoomsModel.rooms[roomId] = {
      players: [{
        address
      }],
      game: game.slug,
      canJoin: true,
      start: new Date()
    };

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

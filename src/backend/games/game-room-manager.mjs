import GameMovesModel from "../models/game-moves-model.mjs";
import GameRoomsModel from "../models/game-rooms-model.mjs";
import {getUtcNow} from "../utils/date-utils.mjs";

const RECONNECT_TIMEOUT = 60000; // 60 seconds
const BATCH_FLUSH_INTERVAL = 5000; // Flush every 5 seconds
const BATCH_SIZE_LIMIT = 50; // Flush if batch reaches 50 moves

// In-memory buffer for pending moves
const movesBuffer = new Map(); // roomId -> array of moves
let flushInterval = null;

/**
 * @typedef {Object} GameRoomPlayer
 * @property {string} address - Player"s wallet address
 * @property {Baxie[]} baxies - Player"s selected baxies
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
 * @property {number} turnIndex - Current turn index
 * @property {number} baxieTurnIndex - Current turn index
 * @property {Baxie[]} baxieTurnOrder - Order of baxies for the turn
 */

export default class GameRoomManager {
  /**
   * @type GameRoom
   */
  static rooms = {};

  /**
   * Create a new game room
   * @param address
   * @param game
   * @param vsCPU
   * @param gameMode
   * @returns {Promise<GameRoom>}
   */
  static async createRoom({ address, game, vsCPU = false, gameMode } = {}) {
    const shortHand = address ? address.slice(0, 4) + "-" + address.slice(-4) : "";
    const roomId = `${game.gameRoomSlug}-${shortHand}-${Math.random().toString(36).substring(2, 10)}`;

    // check if address already has a room
    for (const existingRoomId in GameRoomManager.rooms) {
      const room = GameRoomManager.rooms[existingRoomId];

      if (room && room.players.find(player => player.address === address)) {
        // join existing room instead of creating a new one
        return room;
      }
    }

    GameRoomManager.rooms[roomId] = {
      roomId,
      players: [{
        address
      }],
      game: game.slug,
      canJoin: true,
      start: new Date(),
      vsCPU,
      status: "waiting",
      gameMode,
    };

    return GameRoomManager.rooms[roomId];
  }

  /**
   *
   * @param roomId
   * @param address
   * @returns {GameRoom} The room object if joined successfully, else undefined
   */
  static joinRoom({ roomId, address } = {}) {
    if (GameRoomManager.rooms[roomId] && GameRoomManager.rooms[roomId].canJoin) {
      GameRoomManager.rooms[roomId].players.push({
        address
      });

      return GameRoomManager.rooms[roomId];
    }
  }

  /**
   *
   * @param roomId
   * @param address
   * @returns {boolean}
   */
  static canJoinRoom({ roomId, address } = {}) {
    if (GameRoomManager.rooms[roomId] && GameRoomManager.rooms[roomId].canJoin) {
      if (GameRoomManager.rooms[roomId].players.filter((p) => p.address === address).length > 0) {
        return false;
      }

      if (!GameRoomManager.rooms[roomId].canJoin) {
        return false;
      }

      return true;
    }
  }

  // ========== MATCH TRACKING METHODS (OPTIMIZED) ==========

  static async createMatchRecord(roomId, gameMode, players, vsCPU = false) {
    try {
      const db = getDb();
      const matchData = {
        roomId,
        gameMode,
        vsCPU,
        players: players.map(p => ({
          address: p.address,
          baxieIds: p.baxieIds?.map(id => Number(id.match(/\d+/)[0])),
          initialBaxies: p.baxies?.map(b => ({
            tokenId: b.tokenId,
            position: b.position,
            maxHealth: b.getMaxHealth(),
            maxStamina: b.getMaxStamina(),
            skills: b.skills.map(s => s.func)
          }))
        })),
        status: "waiting",
        totalTurns: 0,
        createdAt: new Date(),
        startedAt: null,
        completedAt: null
      };

      await db.collection("game_matches").insertOne(matchData);

      // Initialize moves buffer for this room
      movesBuffer.set(roomId, []);

      console.log(`Match record created for room ${roomId}`);

      return matchData;
    } catch (err) {
      console.error("Error creating match record:", err);

      return null;
    }
  }

  static async startMatch(roomId) {
    try {
      const db = getDb();
      await db.collection("game_matches").updateOne(
        { roomId },
        {
          $set: {
            status: "inProgress",
            startedAt: new Date()
          }
        }
      );
      console.log(`Match started for room ${roomId}`);
    } catch (err) {
      console.error("Error starting match:", err);
    }
  }

  static recordMove(roomId, moveData) {
    try {
      const room = GameRoomManager.rooms[roomId];

      if (!room) return;

      const player = room.players.find(p => p.address === moveData.playerAddress);
      const enemy = room.players.find(p => p.address !== moveData.playerAddress);

      const move = {
        turnIndex: room.turnIndex,
        playerAddress: moveData.playerAddress,
        moveType: moveData.moveType,
        timestamp: new Date(),
        baxieId: moveData.baxieId || null,
        skillUsed: moveData.skillUsed || null,
        targetBaxieId: moveData.targetBaxieId || null,
        damage: moveData.damage || 0,
        healing: moveData.healing || 0,
        effectsApplied: moveData.effectsApplied || [],
        playerBaxiesState: player?.baxies?.map(b => ({
          tokenId: b.tokenId,
          currentHealth: b.currentHealth,
          currentStamina: b.currentStamina,
          isAlive: b.isAlive(),
          effects: b.effects || {}
        })) || [],
        enemyBaxiesState: enemy?.baxies?.map(b => ({
          tokenId: b.tokenId,
          currentHealth: b.currentHealth,
          currentStamina: b.currentStamina,
          isAlive: b.isAlive(),
          effects: b.effects || {}
        })) || []
      };

      // Add to in-memory buffer instead of immediate DB write
      if (!movesBuffer.has(roomId)) {
        movesBuffer.set(roomId, []);
      }

      movesBuffer.get(roomId).push(move);

      // Update turn count in memory
      if (moveData.moveType === "endTurn") {
        if (!room.pendingTurnCount) room.pendingTurnCount = 0;
        room.pendingTurnCount++;
      }

      // Flush if batch is getting large
      const buffer = movesBuffer.get(roomId);
      if (buffer.length >= BATCH_SIZE_LIMIT) {
        this.flushMovesForRoom(roomId);
      }

      console.log(`Move buffered: ${moveData.moveType} by ${moveData.playerAddress.substring(0, 8)} (buffer: ${buffer.length})`);
    } catch (err) {
      console.error("Error recording move:", err);
    }
  }

  static async flushMovesForRoom(roomId) {
    const buffer = movesBuffer.get(roomId);

    if (!buffer || buffer.length === 0) return;

    try {
      const db = getDb();
      const room = GameRoomManager.rooms[roomId];
      const movesToFlush = [...buffer];
      const turnCount = room?.pendingTurnCount || 0;

      // Clear buffer immediately to avoid duplicates
      movesBuffer.set(roomId, []);
      if (room) room.pendingTurnCount = 0;

      // Option 1: Store moves in separate collection (RECOMMENDED)
      const moveDocuments = movesToFlush.map(move => ({
        ...move,
        roomId
      }));

      // Batch insert moves - fire and forget
      db.collection("game_moves").insertMany(moveDocuments).catch(err => {
        console.error(`Error inserting moves for room ${roomId}:`, err);
      });

      // Update turn count in match document
      if (turnCount > 0) {
        db.collection("game_matches").updateOne(
          { roomId },
          { $inc: { totalTurns: turnCount } }
        ).catch(err => {
          console.error(`Error updating turn count for room ${roomId}:`, err);
        });
      }

      console.log(`Flushed ${movesToFlush.length} moves for room ${roomId}`);
    } catch (err) {
      console.error(`Error in flushMovesForRoom for ${roomId}:`, err);
    }
  }

  static async flushAllMoves() {
    const flushPromises = [];

    for (const roomId of movesBuffer.keys()) {
      flushPromises.push(this.flushMovesForRoom(roomId));
    }

    await Promise.all(flushPromises);
    console.log("All moves flushed");
  }

  static startPeriodicFlush() {
    if (flushInterval) return; // Already running

    flushInterval = setInterval(async () => {
      await this.flushAllMoves();
    }, BATCH_FLUSH_INTERVAL);

    console.log("Periodic move flushing started");
  }

  static stopPeriodicFlush() {
    if (flushInterval) {
      clearInterval(flushInterval);
      flushInterval = null;
      console.log("Periodic move flushing stopped");
    }
  }

  static async endMatch(roomId, winner, loser, endReason) {
    try {
      const db = getDb();

      // Flush any pending moves immediately
      await this.flushMovesForRoom(roomId);

      const match = await db.collection("game_matches").findOne({ roomId });

      if (!match) return;

      const duration = match.startedAt
        ? Math.floor((new Date() - match.startedAt) / 1000)
        : 0;

      await db.collection("game_matches").updateOne(
        { roomId },
        {
          $set: {
            status: "completed",
            winner,
            loser,
            endReason,
            completedAt: new Date(),
            duration
          }
        }
      );

      // Clean up buffer
      movesBuffer.delete(roomId);

      console.log(`Match ended: ${winner} defeated ${loser} (${endReason})`);
    } catch (err) {
      console.error("Error ending match:", err);
    }
  }

  static async abandonMatch(roomId) {
    await GameRoomsModel.updateRoom(roomId, {
      status: "abandoned",
      completedAt: getUtcNow(),
    });
  }

  // ========== CONNECTION MANAGEMENT ==========

  static async handlePlayerDisconnect(roomId, playerAddress) {
    const room = GameRoomManager.rooms[roomId];

    if (!room) return;

    console.log(`Player ${playerAddress} disconnected from room ${roomId}`);

    const disconnectedPlayer = room.players.find(p => p.address === playerAddress);

    if (!disconnectedPlayer) return;

    disconnectedPlayer.ws = null;
    disconnectedPlayer.disconnectedAt = new Date();

    // Record disconnect move (buffered, non-blocking)
    if (room.gameStarted) {
      await GameMovesModel.saveMove(roomId, {
        playerAddress: playerAddress,
        moveType: "disconnect"
      });
    }

    if (!room.gameStarted) {
      this.abandonMatch(roomId);
      delete GameRoomManager.rooms[roomId];

      console.log(`Room ${roomId} deleted - game never started`);

      return;
    }

    if (room.vsCPU) {
      this.abandonMatch(roomId);
      delete GameRoomManager.rooms[roomId];
      console.log(`CPU game room ${roomId} deleted`);

      return;
    }

    const opponent = room.players.find(p => p.address !== playerAddress);

    if (opponent?.ws) {
      this.sendMessage(opponent.ws, {
        type: "opponentDisconnected",
        message: "Your opponent has disconnected. Waiting for reconnection...",
      });

      room.disconnectTimeout = setTimeout(() => {
        this.handlePlayerTimeout(roomId, playerAddress);
      }, RECONNECT_TIMEOUT);
    } else {
      this.abandonMatch(roomId);
      delete GameRoomManager.rooms[roomId];
      console.log(`Room ${roomId} deleted - all players disconnected`);
    }
  }

  static handlePlayerTimeout(roomId, playerAddress) {
    const room = GameRoomManager.rooms[roomId];

    if (!room) return;

    const timedOutPlayer = room.players.find(p => p.address === playerAddress);

    if (!timedOutPlayer || timedOutPlayer.ws) {
      console.log(`Player ${playerAddress} reconnected before timeout`);
      return;
    }

    console.log(`Player ${playerAddress} timed out - awarding win to opponent`);

    // Record forfeit (buffered)
    this.recordMove(roomId, {
      playerAddress: playerAddress,
      moveType: "forfeit"
    });

    const opponent = room.players.find(p => p.address !== playerAddress);

    // End match (flushes moves)
    this.endMatch(roomId, opponent?.address, playerAddress, "timeout");

    if (opponent?.ws) {
      this.sendMessage(opponent.ws, {
        type: "gameOver",
        youWin: true,
        reason: "Opponent abandoned the game",
      });
    }

    this.cleanupRoom(roomId);
  }

  static handlePlayerReconnect(roomId, playerAddress, ws) {
    const room = GameRoomManager.rooms[roomId];

    if (!room) return false;

    const player = room.players.find(p => p.address === playerAddress);

    if (!player) return false;

    console.log(`Player ${playerAddress} reconnecting to room ${roomId}`);

    if (player.ws) {
      player.ws.terminate();
    }

    player.ws = ws;
    player.disconnectedAt = null;

    if (room.disconnectTimeout) {
      clearTimeout(room.disconnectTimeout);
      room.disconnectTimeout = null;
    }

    const opponent = room.players.find(p => p.address !== playerAddress);

    if (opponent?.ws) {
      this.sendMessage(opponent.ws, {
        type: "opponentReconnected",
        message: "Your opponent has reconnected",
      });
    }

    const enemy = room.players.find(p => p.address !== playerAddress);

    this.sendMessage(ws, {
      type: "reconnected",
      roomId: roomId,
      isYourTurn: room.playerTurn === playerAddress,
      turnIndex: room.turnIndex,
      player: player.baxies?.map((baxie) => baxie.getGameInfo(true)),
      enemy: enemy?.baxies?.map((baxie) => baxie.getGameInfo(true)),
      gameMode: room.gameMode,
      message: "Reconnected successfully",
    });

    return true;
  }

  static broadcastToRoom(roomId, message, customizer = null) {
    const room = GameRoomManager.rooms[roomId];

    if (!room) return;

    room.players.forEach(player => {
      if (player.ws && player.ws.readyState === 1) {
        let playerMessage = { ...message };

        if (customizer) {
          playerMessage = customizer(player, playerMessage);
        }

        this.sendMessage(player.ws, playerMessage);
      }
    });
  }

  static sendMessage(ws, message) {
    if (ws && ws.readyState === 1) {
      try {
        ws.send(JSON.stringify(message));
      } catch (err) {
        console.error("Error sending message:", err);
      }
    }
  }

  static cleanupRoom(roomId) {
    const room = GameRoomManager.rooms[roomId];

    if (!room) {
      return;
    }

    if (room.disconnectTimeout) {
      clearTimeout(room.disconnectTimeout);
    }

    room.players.forEach(player => {
      if (player.ws) {
        try {
          player.ws.close();
        } catch (err) {
          console.error("Error closing WebSocket:", err);
        }
      }
    });

    delete GameRoomManager.rooms[roomId];
  }

  static getPlayer(roomId, playerAddress) {
    const room = GameRoomManager.rooms[roomId];

    if (!room) {
      return null;
    }

    return room.players.find(p => p.address === playerAddress);
  }

  static getOpponent(roomId, playerAddress) {
    const room = GameRoomManager.rooms[roomId];

    if (!room) {
      return null;
    }

    return room.players.find(p => p.address !== playerAddress);
  }

  static isPlayerConnected(roomId, playerAddress) {
    const player = this.getPlayer(roomId, playerAddress);

    return player && player.ws && player.ws.readyState === 1;
  }

  static validateRoomExists(roomId) {
    return !!GameRoomManager.rooms[roomId];
  }

  static validatePlayerInRoom(roomId, playerAddress) {
    const room = GameRoomManager.rooms[roomId];

    if (!room) {
      return false;
    }

    return room.players.some(p => p.address === playerAddress);
  }

  static hasRoom(roomId) {
    return !!GameRoomManager.rooms[roomId];
  }
}

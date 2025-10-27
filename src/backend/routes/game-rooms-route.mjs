import { WebSocketServer } from "ws";
import {body, param} from "express-validator";
import {cookieCheckMiddleware, requireWalletSession, sessionMiddleWare} from "../components/middlewares.mjs";
import {rateLimiterMiddleware} from "../components/rate-limiter.mjs";
import {handleValidation} from "../utils/validations.mjs";
import Games from "../models/games.mjs";
import config from "../config/default.json" with { type: "json" };
import {createCPUPlayer, handleBaxieSimulationGameRoom} from "../games/BaxieSimulation.mjs";
import cookie from "cookie";
import GameRoomsModel from "../models/game-rooms-model.mjs";
import GameRoomManager from "../games/game-room-manager.mjs";

export function initGameRoomsRoutes(app, server) {
  const wss = new WebSocketServer({ noServer: true });
  // Add heartbeat mechanism here
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (!ws.isAlive) {
        // eslint-disable-next-line no-console
        console.log("Terminating inactive connection");

        return ws.terminate();
      }

      ws.isAlive = false;
      ws.ping();
    });
  }, 60000); // Check every 60 seconds

  // Clean up interval when server closes
  wss.on("close", () => {
    clearInterval(heartbeatInterval);
  });

  server.on("upgrade", (request, socket, head) => {
    try {
      // Parse cookies
      const cookies = cookie.parse(request.headers.cookie || "");
      const sessionId = cookies["connect.sid"];

      if (!sessionId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        return socket.destroy();
      }

      const sessionParser = sessionMiddleWare(); // returns middleware function

      sessionParser(request, {}, () => {
        if (!request.session) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          return socket.destroy();
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
          ws.session = request.session; // attach session
          wss.emit("connection", ws, request);
        });
      });
    } catch (err) {
      console.error("WebSocket upgrade error:", err);
      socket.destroy();
    }
  });

  wss.on("connection", (ws, request) => {
    ws.isAlive = true;
    ws.on("pong", () => ws.isAlive = true);

    // Handle incoming messages
    ws.on("message", (msg) => {
      try {
        const data = JSON.parse(msg);

        if (!data.gameId) {
          ws.send(JSON.stringify({ error: "No gameId" }));

          return;
        }

        if (!data.roomId) {
          ws.send(JSON.stringify({ error: "No roomId" }));

          return;
        }

        const game = Games.getGame(data.gameId);

        if (!game) {
          ws.send(JSON.stringify({ error: "Invalid gameId" }));
          return;
        }

        if (game.slug === "baxie-simulation" && GameRoomManager.hasRoom(data.roomId)) {
          handleBaxieSimulationGameRoom(ws, data, request);
        }
      } catch (err) {
        console.error("Invalid WS message:", err);
      }
    });

    ws.on("close", () => {
      // Find and cleanup rooms with this ws
      Object.entries(GameRoomManager.rooms).forEach(([roomId, room]) => {
        const player = room?.players?.find((player) => player.ws === ws);

        if (player) {
          GameRoomManager.handlePlayerDisconnect(roomId, player.address);
        }
      });
    });

    ws.on("error", (err) => {
      console.error("Socket error", err);
    });
  });

  app.get(
    "/game-rooms/create/:path/:gameMode",
    param("path")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Invalid game"),
    param("gameMode")
      .matches(/^[a-zA-Z]+$/)
      .withMessage("Invalid game mode"),
    requireWalletSession,
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      if (!handleValidation(req, res)) {
        return;
      }

      const game = Games.getGame(req.params.path);

      if (!game && !game.gameRoomSlug) {
        return res.status(400).json({ success: false, errors: "No game" });
      }

      const address = req.session.wallet?.address.toLowerCase();
      const room = await GameRoomManager.createRoom({
        address,
        game,
        gameMode: req.params.gameMode,
      });

      await GameRoomsModel.saveRoom(room);

      return res.json({
        roomId: room.roomId,
        wsUrl: config.wsUrl,
      });
    });

  app.post(
    "/game-rooms/create-cpu/:path",
    param("path")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Invalid game"),
    body("characterIds")
      .optional()
      .matches(/^[0-9,FB]+$/).withMessage("Can only contain numbers and commas"),
    body("gameMode")
      .matches(/^[a-zA-Z]+$/).withMessage("Not a valid game mode"),
    requireWalletSession,
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      if (!handleValidation(req, res)) {
        return;
      }

      let { gameMode } = req.body;
      const game = Games.getGame(req.params.path);

      if (!game && !game.gameRoomSlug) {
        return res.status(400).json({ success: false, errors: "No game" });
      }

      const address = req.session.wallet?.address.toLowerCase();
      const room = await GameRoomManager.createRoom({
        address,
        game,
        vsCPU: true,
        gameMode,
      });

      await createCPUPlayer(room.roomId);

      await GameRoomsModel.saveRoom(room);

      return res.json({
        roomId: room.roomId,
        wsUrl: config.wsUrl,
      });
    });

  app.get(
    "/game-rooms/join/:path/:roomId",
    param("path")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Invalid game"),
    param("roomId")
      .matches(/^[a-zA-Z0-9-]+$/)
      .withMessage("Invalid roomId"),
    requireWalletSession,
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      if (!handleValidation(req, res)) {
        return;
      }

      const game = Games.getGame(req.params.path);

      if (!game && !game.gameRoomSlug) {
        return res.status(400).json({ success: false, errors: "No game" });
      }

      const roomId = req.params.roomId;
      const address = req.session.wallet?.address.toLowerCase();

      if (GameRoomManager.canJoinRoom({ roomId, address })) {
        const room = GameRoomManager.joinRoom({roomId, address});

        if (room) {
          if (game.slug === "baxie-simulation") {
            room.canJoin = false;
          }

          return res.json({
            roomId,
            wsUrl: config.wsUrl,
          });
        } else {
          return res.status(400).json({success: false, errors: "No room"});
        }
      } else {
        return res.status(400).json({success: false, errors: "Cannot join"});
      }

    });
}

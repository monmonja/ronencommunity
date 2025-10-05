import WebSocket, { WebSocketServer } from "ws";
import { param} from "express-validator";
import {cookieCheckMiddleware, requireWalletSession, sessionMiddleWare} from "../components/middlewares.mjs";
import {rateLimiterMiddleware} from "../components/rate-limiter.mjs";
import {handleValidation} from "../utils/validations.mjs";
import Games from "../models/games.mjs";
import config from "../config/default.json" with { type: "json" };
import {handleBaxieSimulationGameRoom} from "../games/BaxieSimulation.mjs";
import cookie from "cookie";
import GameRoomsModel from "../models/game-rooms-model.mjs";

let rooms = {};

export function initGameRoomsRoutes(app, server) {
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (request, socket, head) => {
    try {
      // Parse cookies
      const cookies = cookie.parse(request.headers.cookie || "");
      const sessionId = cookies["connect.sid"]; // default cookie name, adjust if different

      if (!sessionId) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }
      const sessionParser = sessionMiddleWare();

      // Use sessionParser to populate request.session
      sessionParser(request, {}, () => {
        if (!request.session) {
          socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
          socket.destroy();
          console.log('No session cookie2');
          return;
        }

        // Upgrade the connection
        wss.handleUpgrade(request, socket, head, (ws) => {
          // Attach session to WebSocket
          ws.session = request.session;
          wss.emit("connection", ws, request);
        });
      });
    } catch (err) {
      console.error("WebSocket upgrade error:", err);
    }
  });

  wss.on("connection", (ws) => {
    // Handle incoming messages
    ws.on("message", (msg) => {
      const data = JSON.parse(msg);

      if (typeof data.gameId === "undefined") {
        return ws.send(JSON.stringify({ error: "No gameId" }));
      } else if (data.roomId.startsWith('bsim-')) {
        handleBaxieSimulationGameRoom(ws, data, rooms);
      }
    });
  });

  app.get(
    "/game-rooms/create/:path",
    param("path")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Invalid game"),
    requireWalletSession,
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      if (!handleValidation(req, res)) {
        return;
      }

      const game = Games.getGame(req.params.path);

      if (!game && game.gameRoomSlug) {
        return res.status(400).json({ success: false, errors: "No game" });
      }

      const address = req.session.wallet?.address.toLowerCase();
      const roomId = await GameRoomsModel.createRoom({ address, game });

      return res.json({
        roomId,
        wsUrl: config.wsUrl,
      });
    });

  app.get(
    "/game-rooms/create-cpu/:path",
    param("path")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Invalid game"),
    requireWalletSession,
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      if (!handleValidation(req, res)) {
        return;
      }

      const game = Games.getGame(req.params.path);

      if (!game && game.gameRoomSlug) {
        return res.status(400).json({ success: false, errors: "No game" });
      }

      const address = req.session.wallet?.address.toLowerCase();
      const roomId = await GameRoomsModel.createRoom({
        address,
        game,
        vsCPU: true,
      });

      return res.json({
        roomId,
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

      if (!game && game.gameRoomSlug) {
        return res.status(400).json({ success: false, errors: "No game" });
      }

      const roomId = req.params.roomId;
      const address = req.session.wallet?.address.toLowerCase();

      if (GameRoomsModel.joinRoom({ roomId, address })) {
        return res.json({
          roomId,
          wsUrl: config.wsUrl,
        });
      } else {
        return res.status(400).json({ success: false, errors: "No room" });
      }

    });
}

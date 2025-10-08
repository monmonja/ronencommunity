import WebSocket, { WebSocketServer } from "ws";
import {body, param} from "express-validator";
import {cookieCheckMiddleware, requireWalletSession, sessionMiddleWare} from "../components/middlewares.mjs";
import {rateLimiterMiddleware} from "../components/rate-limiter.mjs";
import {handleValidation} from "../utils/validations.mjs";
import Games from "../models/games.mjs";
import config from "../config/default.json" with { type: "json" };
import {handleBaxieSimulationGameRoom} from "../games/BaxieSimulation.mjs";
import cookie from "cookie";
import { GameRoomsModel } from "../models/game-rooms-model.mjs";

let rooms = {};

export function initGameRoomsRoutes(app, server) {
  const wss = new WebSocketServer({ noServer: true });
  server.on("upgrade", (request, socket, head) => {
    try {
      // Parse cookies
      const cookies = cookie.parse(request.headers.cookie || '');
      const sessionId = cookies['connect.sid'];

      if (!sessionId) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        return socket.destroy();
      }
      const sessionParser = sessionMiddleWare(); // returns middleware function

      sessionParser(request, {}, () => {
        if (!request.session) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          return socket.destroy();
        }

        wss.handleUpgrade(request, socket, head, (ws) => {
          ws.session = request.session; // attach session
          wss.emit('connection', ws, request);
        });
      });
    } catch (err) {
      console.error('WebSocket upgrade error:', err);
      socket.destroy();
    }
  });

  wss.on("connection", (ws) => {
    ws.isAlive = true;
    ws.on('pong', () => ws.isAlive = true);

    // Handle incoming messages
    ws.on("message", (msg) => {
      try {
        console.log('message')
        const data = JSON.parse(msg);

        if (!data.gameId) {
          ws.send(JSON.stringify({ error: 'No gameId' }));
          return;
        }

        if (data.roomId?.startsWith('bsim-')) {
          handleBaxieSimulationGameRoom(ws, data, rooms);
        }
      } catch (err) {
        console.error('Invalid WS message:', err);
      }
    });
    ws.on('close', (code, reason) => {
      console.log('Socket closed', code, reason);
    });
    ws.on('error', (err) => {
      console.error('Socket error', err);
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

  app.post(
    "/game-rooms/create-cpu/:path",
    param("path")
      .matches(/^[a-z0-9-]+$/)
      .withMessage("Invalid game"),
    body('characterIds')
      .optional()
      .matches(/^[0-9,]+$/).withMessage('Can only contain numbers and commas'),
    body('gameMode')
      .matches(/^[a-zA-Z]+$/).withMessage('Not a valid game mode'),
    requireWalletSession,
    cookieCheckMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      if (!handleValidation(req, res)) {
        return;
      }
      let { characterIds, gameMode } = req.body;
      const game = Games.getGame(req.params.path);

      if (!game && game.gameRoomSlug) {
        return res.status(400).json({ success: false, errors: "No game" });
      }

      const address = req.session.wallet?.address.toLowerCase();
      const roomId = await GameRoomsModel.createRoom({
        address,
        game,
        vsCPU: true,
        gameMode,
        characterIds: characterIds ? characterIds.split(',').map(id => parseInt(id, 10)) : [],
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

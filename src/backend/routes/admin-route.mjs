import {body, param, validationResult} from "express-validator";
import {adminAccessMiddleware, mainAdminAccessMiddleware} from "../components/middlewares.mjs";
import { rateLimiterMiddleware } from "../components/rate-limiter.mjs";
import Admin from "../models/admin.mjs";
import GameRoomManager from "../games/game-room-manager.mjs";
import {handleValidation} from "../utils/validations.mjs";

export function initAdminRoutes(app) {

  app.get(
    "/admin",
    adminAccessMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      res.render("admin/index", {
        roomCounter: {
          current: GameRoomManager.getGameRoomCounts('bsim'),
          max: GameRoomManager.MAX_ROOMS['bsim'],
        },
        rooms: GameRoomManager.rooms,
      });
    });

  app.get(
    "/admin/delete-room/:roomId",
    adminAccessMiddleware,
    rateLimiterMiddleware,
    param("roomId")
      .matches(/^[a-zA-Z0-9-]+$/)
      .withMessage("Invalid roomId"),
    async (req, res) => {
      if (!handleValidation(req, res)) {
        return;
      }

      GameRoomManager.cleanupRoom(req.params.roomId);

      res.render("admin/index", {
        roomCounter: {
          current: GameRoomManager.getGameRoomCounts('bsim'),
          max: GameRoomManager.MAX_ROOMS['bsim'],
        },
        rooms: GameRoomManager.rooms,
      });
    });

  app.get(
    "/admin/main",
    mainAdminAccessMiddleware,
    rateLimiterMiddleware,
    async (req, res) => {
      res.render("admin/main", {
        settings: await Admin.getAllRecordsAsObject()
      });
    });

  app.post(
    "/admin/main",
    mainAdminAccessMiddleware,
    body("energies")
      .trim()
      .isJSON().withMessage("Invalid JSON"),
    body("baxieAccessList")
      .trim()
      .isJSON().withMessage("Invalid JSON"), // validator.js
    rateLimiterMiddleware,
    async (req, res) => {
      // Handle validation errors
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const { energies, baxieAccessList } = req.body;

      await Admin.addUpdateRecord({
        key: "energies",
        value: energies,
      });
      await Admin.addUpdateRecord({
        key: "baxieAccessList",
        value: baxieAccessList.toLowerCase(),
      });

      res.render("admin/index", {
        settings: await Admin.getAllRecordsAsObject()
      });
    });
}

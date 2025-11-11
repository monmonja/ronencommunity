// server.mjs
import path from "path";
import { fileURLToPath } from "url";

import cors from "cors";
import ejs from "ejs";
import cookieParser from "cookie-parser";
import express from "express";
import http from "http";

import config from "./config/default.json" with { type: "json" };

import {
  csrfMiddleware,
  sessionMiddleWare,
  ejsVariablesMiddleware,
  forceHTTPSMiddleware,
  securityHeadersMiddleware,
  cookieCheckMiddleware,
  disableStackTraceMiddleware,
  geoMiddleware,
  affiliateMiddleware,
  noCacheDevelopment,
} from "./components/middlewares.mjs";
import { rateLimiterMiddleware } from "./components/rate-limiter.mjs";
import { initStaticRoutes } from "./routes/static.mjs";
import { initRafflesRoutes } from "./routes/raffles.mjs";
import { initGamesRoutes } from "./routes/games-route.mjs";
import { initAuthRoutes } from "./routes/auth-route.mjs";
import { initWikisRoutes } from "./routes/wikis.mjs";
import { initEnergyRoutes } from "./routes/energies-route.mjs";
import { initProfileRoutes } from "./routes/profile-route.mjs";
import { initStatsRoutes } from "./routes/stats-route.mjs";
import Games from "./models/games.mjs";
import {initGameProfilesRoutes} from "./routes/game-profiles.mjs";
import {initBaxieRoutes} from "./routes/baxie-route.mjs";
import {initGameRoomsRoutes} from "./routes/game-rooms-route.mjs";
import { initAdminRoutes } from "./routes/admin-route.mjs";
import {initTournamentEntryRoutes} from "./routes/tournament-entry-route.mjs";

const port = config.port;
// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);

app.disable("x-powered-by");

app.use(noCacheDevelopment);
app.use(forceHTTPSMiddleware);
app.use(geoMiddleware);
app.use(affiliateMiddleware);
app.use(cookieParser());
app.use(cors());
app.use(express.json({ limit: "5kb" }));
app.use(express.urlencoded({ limit: "5kb", extended: true }));
app.use(sessionMiddleWare());
app.use(csrfMiddleware);
app.use(ejsVariablesMiddleware);
app.use(securityHeadersMiddleware);

app.set("trust proxy", 1);

// setup view engine
app.engine("html", ejs.renderFile);
app.set("view engine", "html");
app.set("views", path.join(__dirname, "..", "html"));

initStaticRoutes(app, express);
initAuthRoutes(app);
initRafflesRoutes(app);
initGamesRoutes(app);
initWikisRoutes(app);
initEnergyRoutes(app);
initProfileRoutes(app);
initStatsRoutes(app);
initGameProfilesRoutes(app);
initBaxieRoutes(app);
initGameRoomsRoutes(app, server);
initAdminRoutes(app, server);
initTournamentEntryRoutes(app, server);

app.get(
  "/",
  cookieCheckMiddleware,
  rateLimiterMiddleware,
  (req, res) => {
    res.render("index", {
      selectedNav: "wiki",
      selectedWiki : "",
      games: Games.getGames(),
    });
  });

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.use(disableStackTraceMiddleware);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running at http://localhost:${port}`);
});

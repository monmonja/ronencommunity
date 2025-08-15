// server.mjs
import path from "path";
import { fileURLToPath } from "url";

import cors from "cors";
import ejs from "ejs";
import cookieParser from "cookie-parser";
import express from "express";

import {
  getConnection,
} from "./components/db.mjs";
import {
  csrfMiddleware,
  sessionMiddleWare,
  ejsVariablesMiddleware,
  forceHTTPSMiddleware,
  securityHeadersMiddleware,
} from "./components/middlewares.mjs";
import { rateLimiterMiddleware } from "./components/rate-limiter.mjs";
import { initStaticRoutes } from "./routes/static.mjs";
import { initRafflesRoutes } from "./routes/raffles.mjs";
import { initGamesRoutes } from "./routes/games.mjs";
import { initAuthRoutes } from "./routes/auth.mjs";
import { initWikisRoutes } from "./routes/wikis.mjs";

const port = process.env.PORT || 3000;
// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const mongoDbConnection = await getConnection();

app.disable("x-powered-by");
app.use(forceHTTPSMiddleware);
app.use(securityHeadersMiddleware);
app.use(cookieParser());
app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ limit: "100kb", extended: true }));
app.use(await sessionMiddleWare());
app.use(csrfMiddleware);
app.use(ejsVariablesMiddleware);

app.set("trust proxy", 1);

// setup view engine
app.engine("html", ejs.renderFile);
app.set("view engine", "html");
app.set("views", path.join(__dirname, "..", "html"));

initStaticRoutes(app, express);
initAuthRoutes(app, mongoDbConnection);
initRafflesRoutes(app, mongoDbConnection);
initGamesRoutes(app, mongoDbConnection);
initWikisRoutes(app, mongoDbConnection);

app.get(["/", "/:path"], rateLimiterMiddleware, (req, res) => {
  res.render("index");
});

app.use((req, res) => {
  res.status(404).send("Not Found");
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running at http://localhost:${port}`);
});

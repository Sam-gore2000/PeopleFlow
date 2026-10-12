import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOptions } from "./config/cors.js";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import apiRoutes from "./routes/index.js";

export function createApp() {
  const app = express();
  // Behind a reverse proxy (Docker / Caddy / Nginx): trust it so req.ip is the real visitor
  // (used by the forgot-password rate limit) and secure cookies work over HTTPS.
  if (env.trustProxy) app.set("trust proxy", env.trustProxy);

  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(env.isProduction ? "combined" : "dev"));
  app.use("/uploads", express.static(env.uploadDir));

  // HR data must never be kept in the browser or proxy cache (no stale pages after logout / back button).
  app.use("/api", (req, res, next) => {
    res.set({ "Cache-Control": "no-store, no-cache, must-revalidate, private", Pragma: "no-cache", Expires: "0" });
    next();
  });
  app.use("/api", apiRoutes);
  app.use("/api", notFound);
  app.use(errorHandler);

  return app;
}

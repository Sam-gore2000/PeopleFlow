import { env } from "./env.js";

// CLIENT_ORIGIN may list several origins separated by commas (e.g. "https://hrm.example.com,https://www.hrm.example.com").
const allowedOrigins = new Set(env.clientOrigin.split(",").map((origin) => origin.trim().replace(/\/$/, "")).filter(Boolean));
const localhostOrigin = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

export const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin) || localhostOrigin.test(origin)) return callback(null, true);
    // Another website calling the API: refuse with 403 (not a server error).
    const error = new Error(`Origin not allowed: ${origin}`);
    error.status = 403;
    return callback(error);
  },
  credentials: true
};

import { env } from "../config/env.js";

const COOKIE_NAME = "hrms_token";
const REMEMBER_MS = 315360000000; // ~10 years
const SESSION_MS = 43200000; // 12 hours

export function setAuthCookie(res, token, remember) {
  res.cookie(COOKIE_NAME, token, { httpOnly: true, sameSite: "lax", secure: env.cookieSecure, maxAge: remember ? REMEMBER_MS : SESSION_MS });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME, { httpOnly: true, sameSite: "lax", secure: env.cookieSecure });
}

export function readAuthToken(req) {
  const header = req.headers.authorization || "";
  return req.cookies?.[COOKIE_NAME] || header.replace(/^Bearer\s+/i, "");
}

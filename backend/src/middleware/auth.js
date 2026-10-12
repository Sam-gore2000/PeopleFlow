import { readAuthToken } from "../utils/authCookie.js";
import { verifyToken } from "../utils/token.js";

export function requireAuth(req, res, next) {
  const token = readAuthToken(req);
  if (!token) return res.status(401).json({ message: "Authentication required" });

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired session" });
  }
}

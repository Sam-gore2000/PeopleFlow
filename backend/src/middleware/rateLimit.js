// Small in-memory rate limiter (per client IP). Enough for a single server; resets on restart.
export function rateLimit({ windowMs, max, message }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket?.remoteAddress || "unknown";
    const entry = hits.get(key);
    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
    } else if (++entry.count > max) {
      res.set("Retry-After", Math.ceil((entry.reset - now) / 1000));
      return res.status(429).json({ message });
    }
    if (hits.size > 5000) for (const [ip, value] of hits) if (value.reset < now) hits.delete(ip);
    next();
  };
}

import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// All attendance dates ("2026-09-30") and clock times are calculated in this zone,
// so a server hosted in UTC still records the office's local day. Must be set before any Date use.
const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
process.env.TZ = timezone;

export const env = {
  port: Number(process.env.PORT) || 5000,
  timezone,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/hrms",
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: "12h",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  uploadDir: process.env.UPLOAD_DIR || path.resolve(srcDir, "../../uploads"),
  disableMemoryFallback: process.env.DISABLE_MEMORY_FALLBACK === "true",
  // Email (forgot-password codes). Gmail: SMTP_USER = the Gmail address, SMTP_PASS = its 16-letter App Password.
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 465,
    user: process.env.SMTP_USER || "",
    pass: (process.env.SMTP_PASS || "").replace(/\s+/g, ""),
    from: process.env.MAIL_FROM || ""
  },
  isProduction: process.env.NODE_ENV === "production",
  // "1" when running behind one reverse proxy (Docker setup sets this).
  trustProxy: process.env.TRUST_PROXY ? (/^\d+$/.test(process.env.TRUST_PROXY) ? Number(process.env.TRUST_PROXY) : process.env.TRUST_PROXY) : false,
  // Login cookie only over HTTPS (set COOKIE_SECURE=true when the site is served with https://).
  cookieSecure: process.env.COOKIE_SECURE === "true",
  // Paid leave earned per month from the joining date.
  // New joiners can't use paid leave until they finish probation (months from the joining date).
  probationMonths: Number.isFinite(parseInt(process.env.PROBATION_MONTHS, 10)) ? parseInt(process.env.PROBATION_MONTHS, 10) : 3,
  // Leave year: balances count from this month each year (1 = January -> Jan-Dec; 4 = April -> Apr-Mar).
  leaveYearStartMonth: Math.min(12, Math.max(1, parseInt(process.env.LEAVE_YEAR_START_MONTH, 10) || 1)),
  leaveAccrualPerMonth: Number.isFinite(parseFloat(process.env.LEAVE_ACCRUAL_PER_MONTH)) ? parseFloat(process.env.LEAVE_ACCRUAL_PER_MONTH) : 1.5,
  // Attendance calendar: WEEKLY_OFF_DAYS are the days off (0 = Sunday ... 6 = Saturday).
  weeklyOffDays: (process.env.WEEKLY_OFF_DAYS ?? "0,6").split(",").map((day) => Number(day.trim())).filter((day) => day >= 0 && day <= 6)
};

// Production must not run with a guessable token secret (anyone could forge a login).
const WEAK_SECRETS = new Set(["dev-secret-change-me", "replace-with-a-long-random-secret", "change-me", ""]);
if (env.isProduction && (WEAK_SECRETS.has(env.jwtSecret) || env.jwtSecret.length < 32)) {
  console.error("\nJWT_SECRET is missing or too weak. Set a random value of at least 32 characters in .env (see DEPLOY.md).\n");
  process.exit(1);
}

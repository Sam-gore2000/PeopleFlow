import crypto from "crypto";
import { env } from "../config/env.js";
import { ROLES } from "../constants/roles.js";
import { models } from "../models/index.js";
import { httpError } from "../utils/httpError.js";
import { hashPassword } from "../utils/password.js";
import { escapeRegex } from "../utils/query.js";
import { mailConfigured, sendMail } from "./mailer.js";
import { otpEmail, passwordChangedEmail } from "./passwordEmails.js";

const OTP_MINUTES = 10;
const RESET_MINUTES = 15;
const RESEND_SECONDS = 60;
const MAX_ATTEMPTS = 5;
const MIN_PASSWORD_LENGTH = 6;

// Same reply whether or not the account exists, so the form can't be used to discover accounts.
const SENT_MESSAGE = "If this account exists and has an email address, a 6-digit code has been sent to it.";
const INVALID_CODE = "This code is wrong or has expired. Please check it or request a new one.";

const hash = (value) => crypto.createHmac("sha256", env.jwtSecret).update(String(value)).digest("hex");
const sameHash = (a, b) => Boolean(a && b) && a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
const minutesFromNow = (minutes) => new Date(Date.now() + minutes * 60_000);
const exact = (value) => ({ $regex: `^${escapeRegex(value)}$`, $options: "i" });

// Finds the account by admin username / Employee ID / email (any case).
async function findAccount(identifier) {
  const text = String(identifier || "").trim();
  if (!text) return null;
  const admin = await models.admins.findOne({ $or: [{ username: exact(text) }, { email: exact(text) }] });
  if (admin) return { type: ROLES.ADMIN, key: admin.username, email: admin.email, name: admin.username, doc: admin, passwordField: "password" };
  const employee = await models.employees.findOne({ $or: [{ empid: exact(text) }, { email: exact(text) }, { username: exact(text) }] });
  if (employee) return { type: "employee", key: employee.empid, email: employee.email, name: employee.fname || employee.empid, doc: employee, passwordField: "pass" };
  return null;
}

// Development only: why no email arrived (never sent in production, where it would reveal accounts).
const devHint = (text) => (env.isProduction ? {} : { dev_hint: text });

// Step 1: email a 6-digit code (valid 10 minutes, one new code per minute).
export async function requestCode({ username } = {}) {
  if (!String(username || "").trim()) throw httpError(400, "Enter your username, Employee ID or email.");
  const account = await findAccount(username);
  if (!account) {
    console.warn(`Forgot password: no account matches "${String(username).trim()}".`);
    return { ok: true, message: SENT_MESSAGE, resend_in: RESEND_SECONDS, ...devHint(`No account matches "${String(username).trim()}".`) };
  }
  if (!account.email) {
    console.warn(`Forgot password: ${account.key} has no email address on file.`);
    return { ok: true, message: SENT_MESSAGE, resend_in: RESEND_SECONDS, ...devHint(`${account.key} has no email address saved. Add one in Employee Details.`) };
  }

  const existing = await models.passwordResets.findOne({ account_type: account.type, account_key: account.key }).lean();
  if (existing?.resend_after && new Date(existing.resend_after) > new Date()) {
    return { ok: true, message: SENT_MESSAGE, resend_in: Math.ceil((new Date(existing.resend_after) - Date.now()) / 1000), ...devHint("A code was sent less than a minute ago - use that one.") };
  }

  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  const email = otpEmail({ name: account.name, otp, minutes: OTP_MINUTES });
  await sendMail({ to: account.email, ...email });

  await models.passwordResets.deleteMany({ account_type: account.type, account_key: account.key });
  await models.passwordResets.create({
    account_type: account.type,
    account_key: account.key,
    email: account.email,
    otp_hash: hash(`${account.type}:${account.key}:${otp}`),
    otp_expires: minutesFromNow(OTP_MINUTES),
    attempts: 0,
    resend_after: new Date(Date.now() + RESEND_SECONDS * 1000)
  });
  const hint = mailConfigured()
    ? `Sent to ${account.email}.`
    : "Email isn't set up (SMTP_USER / SMTP_PASS in backend/.env), so the code was printed in the backend terminal instead.";
  return { ok: true, message: SENT_MESSAGE, resend_in: RESEND_SECONDS, ...devHint(hint) };
}

// Step 2: check the code; a correct code gives a one-time reset token (valid 15 minutes).
export async function verifyCode({ username, otp } = {}) {
  const code = String(otp || "").trim();
  if (!/^\d{6}$/.test(code)) throw httpError(400, "Enter the 6-digit code from the email.");
  const account = await findAccount(username);
  const record = account && await models.passwordResets.findOne({ account_type: account.type, account_key: account.key });
  if (!record?.otp_hash || new Date(record.otp_expires) < new Date()) throw httpError(400, INVALID_CODE);

  if (!sameHash(record.otp_hash, hash(`${account.type}:${account.key}:${code}`))) {
    const attempts = (record.attempts || 0) + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await models.passwordResets.deleteMany({ _id: record._id });
      throw httpError(400, "Too many wrong codes. Please request a new code.");
    }
    await models.passwordResets.updateOne({ _id: record._id }, { $set: { attempts } });
    throw httpError(400, `Wrong code. ${MAX_ATTEMPTS - attempts} ${MAX_ATTEMPTS - attempts === 1 ? "try" : "tries"} left.`);
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  await models.passwordResets.updateOne(
    { _id: record._id },
    { $set: { otp_hash: "", reset_token_hash: hash(resetToken), reset_expires: minutesFromNow(RESET_MINUTES) } }
  );
  return { ok: true, resetToken, expires_in: RESET_MINUTES * 60 };
}

// Step 3: set the new password with the reset token (works once).
export async function resetPassword({ resetToken, password, confirmPassword } = {}) {
  if (!resetToken) throw httpError(400, "Your reset session has expired. Please start again.");
  if (!password || String(password).length < MIN_PASSWORD_LENGTH) throw httpError(400, `The new password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  if (confirmPassword !== undefined && password !== confirmPassword) throw httpError(400, "The two passwords don't match.");

  const record = await models.passwordResets.findOne({ reset_token_hash: hash(resetToken) });
  if (!record || !record.reset_token_hash || new Date(record.reset_expires) < new Date()) {
    throw httpError(400, "Your reset session has expired. Please start again.");
  }
  const account = await findAccount(record.account_key);
  if (!account || account.type !== record.account_type) throw httpError(400, "Your reset session has expired. Please start again.");

  account.doc[account.passwordField] = await hashPassword(password);
  if (typeof account.doc.set === "function") account.doc.set("password_changed_at", new Date()); // field outside the schema
  else account.doc.password_changed_at = new Date();
  await account.doc.save();
  await models.passwordResets.deleteMany({ account_type: account.type, account_key: account.key });

  // Let the person know (if it wasn't them, they can tell HR). A failed email doesn't undo the reset.
  sendMail({ to: account.email, ...passwordChangedEmail({ name: account.name }) }).catch(() => {});
  return { ok: true, message: "Your password has been changed. You can sign in now." };
}

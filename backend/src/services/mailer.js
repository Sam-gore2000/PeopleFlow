import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { httpError } from "../utils/httpError.js";

let transporter = null;

export const mailConfigured = () => Boolean(env.smtp.user && env.smtp.pass);
export const createMailTransport = () => getTransporter();

// Plain-language reason for an SMTP error (used in logs and by `npm run mail-test`).
export function explainMailError(error) {
  const code = error?.code || "";
  if (code === "EAUTH" || /535|Username and Password not accepted/i.test(error?.message || "")) {
    return "Gmail rejected the login: SMTP_USER must be the Gmail address the App Password was created in, and SMTP_PASS that 16-letter App Password (2-Step Verification must be on).";
  }
  if (["ETIMEDOUT", "ECONNREFUSED", "ESOCKET", "ECONNECTION", "ENOTFOUND", "EDNS"].includes(code)) {
    return `Couldn't reach ${env.smtp.host}:${env.smtp.port}. The network may block it - try SMTP_PORT=587 in backend/.env.`;
  }
  if (code === "EENVELOPE") return "The recipient address was rejected - check the email saved for this employee.";
  return error?.message || "Unknown email error";
}

function getTransporter() {
  if (!transporter) {
    // 465 = SSL; 587 = STARTTLS (use 587 if your network blocks 465).
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.port === 465,
      requireTLS: env.smtp.port !== 465,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
      connectionTimeout: 15_000
    });
  }
  return transporter;
}

// Sends an email. Without SMTP settings, development prints it to the server console instead.
export async function sendMail({ to, subject, html, text }) {
  if (!mailConfigured()) {
    if (env.isProduction) throw httpError(503, "Email is not set up on the server. Please contact HR.");
    console.warn(`\n[mail - SMTP not configured, printing instead]\nTo: ${to}\nSubject: ${subject}\n${text}\n`);
    return { dev: true };
  }
  try {
    return await getTransporter().sendMail({ from: env.smtp.from || `LionReach HRMS <${env.smtp.user}>`, to, subject, html, text });
  } catch (error) {
    console.error(`Email sending failed (${error.code || "error"}): ${explainMailError(error)}`);
    throw httpError(502, "We couldn't send the email right now. Please try again in a few minutes.");
  }
}

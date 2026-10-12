// Checks the email settings in backend/.env and sends a test email.
//   npm run mail-test -- you@example.com        send a test email
//   npm run mail-test -- --user LRM_004         show which address a reset code would go to
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { models } from "../models/index.js";
import { createMailTransport, explainMailError, mailConfigured } from "../services/mailer.js";
import { escapeRegex } from "../utils/query.js";

const args = process.argv.slice(2);
const line = (text = "") => console.log(`  ${text}`);

async function checkUser(identifier) {
  await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  const exact = { $regex: `^${escapeRegex(identifier)}$`, $options: "i" };
  const admin = await models.admins.findOne({ $or: [{ username: exact }, { email: exact }] }).lean();
  const employee = admin ? null : await models.employees.findOne({ $or: [{ empid: exact }, { email: exact }, { username: exact }] }).lean();
  const account = admin ? { kind: "Admin", id: admin.username, email: admin.email } : employee ? { kind: "Employee", id: employee.empid, email: employee.email } : null;
  if (!account) line(`✖ No admin or employee matches "${identifier}".`);
  else if (!account.email) line(`✖ ${account.kind} ${account.id} has NO email address saved - add one, or no code can be sent.`);
  else line(`✔ ${account.kind} ${account.id}: reset codes go to ${account.email}`);
  await mongoose.disconnect();
}

async function sendTest(to) {
  line(`SMTP: ${env.smtp.host}:${env.smtp.port} as ${env.smtp.user || "(SMTP_USER not set)"}`);
  if (!mailConfigured()) {
    line("✖ SMTP_USER and SMTP_PASS are not both set in backend/.env.");
    return;
  }
  const transport = createMailTransport();
  try {
    await transport.verify();
    line("✔ Logged in to the mail server.");
    const info = await transport.sendMail({ from: env.smtp.from || `LionReach HRMS <${env.smtp.user}>`, to, subject: "HRMS test email", text: "Email from the HRMS server works." });
    line(`✔ Test email sent to ${to} (id ${info.messageId}). Check the inbox and spam folder.`);
  } catch (error) {
    line(`✖ ${explainMailError(error)}`);
    line(`  (${error.code || ""} ${error.message})`);
  }
}

console.log("");
if (args[0] === "--user" && args[1]) await checkUser(args[1]);
else if (args[0] && args[0].includes("@")) await sendTest(args[0]);
else line("Usage: npm run mail-test -- you@example.com   |   npm run mail-test -- --user LRM_004");
console.log("");
process.exit(0);

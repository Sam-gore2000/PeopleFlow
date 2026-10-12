// Manage login accounts directly in MongoDB from the command line.
//
//   npm run users -- demo                                    create/reset the demo logins
//   npm run users -- list                                    show every account that can log in
//   npm run users -- add-admin <username> <password> [--email x]
//   npm run users -- add-manager <empid> <password> --name "Full Name" [--email x] [--department x]
//   npm run users -- add-employee <empid> <password> --name "Full Name" [--manager MGR001] [--email x] [--department x] [--position x]
//   npm run users -- reset-password <username|empid> <newPassword>
//   npm run users -- check <username|empid> <password>       explain why a login works or fails
//
// Passwords are stored as bcrypt hashes. Adding an account that already exists resets its password.
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { roleForPosition } from "../constants/roles.js";
import { models } from "../models/index.js";
import { hashPassword, matchesPassword } from "../utils/password.js";
import { escapeRegex } from "../utils/query.js";

const DEMO = {
  admin: { username: "admin", password: "Admin@123", email: "admin@lionreach.local" },
  manager: { empid: "MGR001", password: "Manager@123", fname: "Demo Manager", email: "manager@lionreach.local", department: "Operations", position: "Team Manager" },
  employee: { empid: "EMP001", password: "Employee@123", fname: "Demo Employee", email: "employee@lionreach.local", department: "Operations", position: "Executive", report_manager: "Demo Manager", report_manager_id: "MGR001" }
};

function parseArgs(argv) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i].startsWith("--")) {
      flags[argv[i].slice(2)] = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[(i += 1)] : "true";
    } else positional.push(argv[i]);
  }
  return { command: positional[0], args: positional.slice(1), flags };
}

const sameText = (value) => ({ $regex: `^${escapeRegex(value)}$`, $options: "i" });
const maskUri = (uri) => uri.replace(/\/\/([^:@/]+):([^@/]+)@/, "//$1:****@");

function fail(message) {
  console.error(`\n  ✖ ${message}\n`);
  process.exitCode = 1;
}

function requireArgs(args, count, usage) {
  if (args.length < count || args.slice(0, count).some((value) => !value)) throw new Error(`Usage: npm run users -- ${usage}`);
}

function requireStrongEnough(password) {
  if (String(password).length < 6) throw new Error("Password must be at least 6 characters.");
}

async function upsertAdmin({ username, password, email }) {
  requireStrongEnough(password);
  const hash = await hashPassword(password);
  const existing = await models.admins.findOne({ username: sameText(username) }).lean();
  if (existing) {
    await models.admins.updateOne({ _id: existing._id }, { $set: { password: hash, ...(email ? { email } : {}) } });
    return { action: "password reset", login: existing.username };
  }
  await models.admins.create({ username, password: hash, email });
  return { action: "created", login: username };
}

async function upsertEmployee(data) {
  requireStrongEnough(data.password);
  const { password, ...fields } = data;
  const hash = await hashPassword(password);
  const existing = await models.employees.findOne({ empid: sameText(fields.empid) }).lean();
  if (existing) {
    // Keep the existing profile; only reset the password and fill in anything that is missing.
    const fill = Object.fromEntries(Object.entries(fields).filter(([key, value]) => value && !existing[key]));
    await models.employees.updateOne({ _id: existing._id }, { $set: { pass: hash, ...fill } });
    return { action: "password reset", login: existing.empid, role: roleForPosition(existing.position || fields.position) };
  }
  await models.employees.create({ ...fields, username: fields.empid, pass: hash, status: "Offline" });
  return { action: "created", login: fields.empid, role: roleForPosition(fields.position) };
}

function printResult(label, result, password) {
  console.log(`  ✔ ${label.padEnd(9)} ${result.action.padEnd(15)} login: ${result.login.padEnd(12)} password: ${password}${result.role ? `   (signs in as ${result.role})` : ""}`);
}

const commands = {
  async demo() {
    printResult("Admin", await upsertAdmin(DEMO.admin), DEMO.admin.password);
    printResult("Manager", await upsertEmployee(DEMO.manager), DEMO.manager.password);
    printResult("Employee", await upsertEmployee(DEMO.employee), DEMO.employee.password);
    console.log("\n  Employees and managers sign in with their Employee ID (e.g. EMP001), not their name.");
    console.log("  Change these passwords before going live.");
  },

  async "add-admin"({ args, flags }) {
    requireArgs(args, 2, "add-admin <username> <password> [--email x]");
    printResult("Admin", await upsertAdmin({ username: args[0], password: args[1], email: flags.email }), args[1]);
  },

  async "add-manager"({ args, flags }) {
    requireArgs(args, 2, 'add-manager <empid> <password> --name "Full Name"');
    const result = await upsertEmployee({ empid: args[0], password: args[1], fname: flags.name || args[0], email: flags.email, department: flags.department, position: flags.position || "Team Manager" });
    printResult("Manager", result, args[1]);
  },

  async "add-employee"({ args, flags }) {
    requireArgs(args, 2, 'add-employee <empid> <password> --name "Full Name" [--manager MGR001]');
    let manager = null;
    if (flags.manager) {
      manager = await models.employees.findOne({ empid: sameText(flags.manager) }).lean();
      if (!manager) console.warn(`  ! Manager ${flags.manager} not found; saving the ID anyway.`);
    }
    const result = await upsertEmployee({
      empid: args[0],
      password: args[1],
      fname: flags.name || args[0],
      email: flags.email,
      department: flags.department,
      position: flags.position || "Executive",
      report_manager_id: manager?.empid || flags.manager,
      report_manager: manager?.fname
    });
    printResult("Employee", result, args[1]);
  },

  async "reset-password"({ args }) {
    requireArgs(args, 2, "reset-password <username|empid> <newPassword>");
    const [login, password] = args;
    requireStrongEnough(password);
    const hash = await hashPassword(password);
    const admin = await models.admins.findOneAndUpdate({ username: sameText(login) }, { $set: { password: hash } });
    if (admin) return console.log(`  ✔ Admin ${admin.username}: password reset to ${password}`);
    const employee = await models.employees.findOneAndUpdate({ $or: [{ empid: sameText(login) }, { email: sameText(login) }] }, { $set: { pass: hash } });
    if (employee) return console.log(`  ✔ ${employee.fname || ""} (${employee.empid}): password reset to ${password}`);
    fail(`No admin username or employee ID "${login}" found.`);
  },

  async list() {
    const [admins, employees] = await Promise.all([
      models.admins.find({}).sort({ username: 1 }).lean(),
      models.employees.find({}).sort({ empid: 1 }).lean()
    ]);
    const kind = (stored) => (!stored ? "NO PASSWORD" : /^\$2[aby]\$/.test(stored) ? "bcrypt" : /^[a-f0-9]{32}$/i.test(stored) ? "md5" : "plain text");
    console.log(`\n  Admins (${admins.length}) - sign in with username`);
    for (const a of admins) console.log(`    ${String(a.username).padEnd(16)} ${String(a.email || "").padEnd(30)} [${kind(a.password)}]`);
    console.log(`\n  Employees & managers (${employees.length}) - sign in with Employee ID`);
    for (const e of employees) console.log(`    ${String(e.empid).padEnd(16)} ${String(e.fname || "").padEnd(22)} ${roleForPosition(e.position).padEnd(9)} [${kind(e.pass)}]`);
    if (!admins.length && !employees.length) console.log("\n  No accounts yet. Run:  npm run users -- demo");
  },

  async check({ args }) {
    requireArgs(args, 2, "check <username|empid> <password>");
    const [login, password] = args;
    const admin = await models.admins.findOne({ username: sameText(login) }).lean();
    if (admin) {
      const ok = await matchesPassword(password, admin.password);
      return console.log(ok ? `  ✔ Admin "${admin.username}": password is correct. Login works.` : `  ✖ Admin "${admin.username}" exists but the password is wrong. Fix: npm run users -- reset-password ${admin.username} <newPassword>`);
    }
    const employee = await models.employees.findOne({ $or: [{ empid: sameText(login) }, { email: sameText(login) }, { username: sameText(login) }] }).lean();
    if (!employee) {
      const byName = await models.employees.findOne({ fname: sameText(login) }).lean();
      if (byName) return fail(`"${login}" is a name. Sign in with the Employee ID instead: ${byName.empid}`);
      return fail(`No account called "${login}" in database "${mongoose.connection.name}". Run: npm run users -- list`);
    }
    if (!employee.pass) return fail(`${employee.empid} has no password set. Fix: npm run users -- reset-password ${employee.empid} <newPassword>`);
    const ok = await matchesPassword(password, employee.pass);
    console.log(ok
      ? `  ✔ ${employee.fname || ""} (${employee.empid}): password is correct. Signs in as ${roleForPosition(employee.position)}.`
      : `  ✖ ${employee.empid} exists but the password is wrong. Fix: npm run users -- reset-password ${employee.empid} <newPassword>`);
  }
};

async function main() {
  const { command, args, flags } = parseArgs(process.argv.slice(2));
  if (!commands[command]) {
    console.log(`\n  Commands: ${Object.keys(commands).join(", ")}\n  Example:  npm run users -- demo\n`);
    process.exitCode = command ? 1 : 0;
    return;
  }

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
  } catch (error) {
    return fail(`Cannot connect to MongoDB at ${maskUri(env.mongoUri)} (${error.message}).\n    Start MongoDB, or set MONGODB_URI in backend/.env to your real database.`);
  }

  console.log(`\n  Database: ${mongoose.connection.name} @ ${maskUri(env.mongoUri)}\n`);
  try {
    await commands[command]({ args, flags });
  } catch (error) {
    fail(error.message);
  } finally {
    await mongoose.disconnect();
  }
}

await main();
console.log("");

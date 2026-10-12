import { models } from "../models/index.js";
import { todayKey } from "../utils/date.js";
import { hashPassword } from "../utils/password.js";

// First-start accounts (created by deploy.sh settings). Runs on every start but only CREATES
// accounts that don't exist yet - it never changes an existing account or password.
//   INITIAL_ADMIN_USERNAME / INITIAL_ADMIN_PASSWORD / INITIAL_ADMIN_EMAIL
//   SEED_DEMO_ACCOUNTS=true -> also a demo manager (MGR001) and employee (EMP001):
//   INITIAL_MANAGER_PASSWORD / INITIAL_EMPLOYEE_PASSWORD
export async function ensureInitialAccounts(env = process.env) {
  const created = [];
  const adminUser = (env.INITIAL_ADMIN_USERNAME || "admin").trim();

  if (env.INITIAL_ADMIN_PASSWORD) {
    const exists = await models.admins.findOne({ username: adminUser }).lean();
    if (!exists) {
      await models.admins.create({ username: adminUser, password: await hashPassword(env.INITIAL_ADMIN_PASSWORD), email: env.INITIAL_ADMIN_EMAIL || "" });
      created.push(`admin "${adminUser}"`);
    }
  }

  if (env.SEED_DEMO_ACCOUNTS === "true") {
    const today = todayKey();
    const demo = [
      env.INITIAL_MANAGER_PASSWORD && {
        empid: "MGR001", fname: "Demo Manager", email: env.INITIAL_MANAGER_EMAIL || "manager@example.com",
        department: "Operations", position: "Team Manager", jdate: today, password: env.INITIAL_MANAGER_PASSWORD
      },
      env.INITIAL_EMPLOYEE_PASSWORD && {
        empid: "EMP001", fname: "Demo Employee", email: env.INITIAL_EMPLOYEE_EMAIL || "employee@example.com",
        department: "Operations", position: "Executive", jdate: today, report_manager_id: "MGR001", report_manager: "Demo Manager",
        password: env.INITIAL_EMPLOYEE_PASSWORD
      }
    ].filter(Boolean);
    for (const { password, ...fields } of demo) {
      const exists = await models.employees.findOne({ empid: fields.empid }).lean();
      if (exists) continue;
      await models.employees.create({ ...fields, username: fields.empid, pass: await hashPassword(password), status: "Offline" });
      created.push(`${fields.position === "Team Manager" ? "manager" : "employee"} "${fields.empid}"`);
    }
  }

  if (created.length) console.log(`First-start accounts created: ${created.join(", ")} (passwords are in credentials.txt on the server).`);
  return created;
}

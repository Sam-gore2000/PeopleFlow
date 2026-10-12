import { roleForPosition, ROLES } from "../constants/roles.js";
import { models } from "../models/index.js";
import { httpError } from "../utils/httpError.js";
import { matchesPassword } from "../utils/password.js";
import { escapeRegex } from "../utils/query.js";
import { signToken } from "../utils/token.js";
import * as sessionLogService from "./sessionLogService.js";

function adminSession(admin) {
  return { id: String(admin._id), username: admin.username, role: ROLES.ADMIN, name: "Admin" };
}

function employeeSession(employee, sessionId) {
  return {
    id: String(employee._id),
    username: employee.empid,
    empid: employee.empid,
    name: employee.fname,
    role: roleForPosition(employee.position),
    position: employee.position,
    department: employee.department,
    report_manager_id: employee.report_manager_id,
    session_id: sessionId
  };
}

// Exact, case-insensitive match (so "emp001" finds "EMP001").
function sameText(value) {
  return { $regex: `^${escapeRegex(value)}$`, $options: "i" };
}

export async function login({ username, password, remember }) {
  const login = String(username || "").trim();
  if (!login || !password) throw httpError(400, "Username and password are required");

  const admin = await models.admins.findOne({ username: sameText(login) }).lean();
  if (admin && (await matchesPassword(password, admin.password))) {
    const user = adminSession(admin);
    return { token: signToken(user), user, remember };
  }

  // Employees and managers sign in with their Employee ID; their email or username also works.
  const employee = await models.employees.findOne({ $or: [{ empid: sameText(login) }, { email: sameText(login) }, { username: sameText(login) }] });
  if (!employee || !(await matchesPassword(password, employee.pass))) throw httpError(401, "Incorrect username or password");

  const sessionId = await sessionLogService.open(employee);
  const user = employeeSession(employee, sessionId);
  return { token: signToken(user), user, remember };
}

export async function logout(user) {
  if (user?.session_id && user?.empid) await sessionLogService.close(user);
  return { ok: true };
}

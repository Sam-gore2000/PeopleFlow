import { ROLES } from "../../constants/roles.js";
import { models } from "../../models/index.js";

// Managers get the same personal dashboard as employees.
export { dashboardStats } from "../employee/employeeService.js";

function teamFilter(user) {
  return user.role === ROLES.ADMIN ? {} : { report_manager_id: user.empid };
}

// Only what a manager needs to know about a team member (no password, salary or personal details).
const TEAM_FIELDS = ["empid", "fname", "position", "department", "email", "status", "profile_pic", "jdate"];

export async function team(user) {
  const members = await models.employees.find(teamFilter(user)).sort({ fname: 1 }).lean();
  return { members: members.map((member) => Object.fromEntries(TEAM_FIELDS.map((field) => [field, member[field] ?? ""]))) };
}

export async function approvals(user) {
  const filter = teamFilter(user);
  const [leaves, attendanceRequests] = await Promise.all([
    models.leaves.find({ ...filter, status: 0 }).sort({ createdAt: -1 }).lean(),
    models.attendanceRequests.find({ ...filter, status: 0 }).sort({ createdAt: -1 }).lean()
  ]);
  return { leaves, attendanceRequests };
}

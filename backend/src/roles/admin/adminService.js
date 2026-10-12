import { models } from "../../models/index.js";
import { todayKey } from "../../utils/date.js";

export async function overview() {
  const [recentEmployees, pendingLeaves, pendingQueries] = await Promise.all([
    models.employees.find({}).sort({ createdAt: -1, _id: -1 }).limit(10).lean(),
    models.leaves.countDocuments({ status: 0 }),
    models.queries.countDocuments({ status: 0 })
  ]);
  return { recentEmployees, pendingLeaves, pendingQueries };
}

// Organisation-wide stats shown on the admin dashboard.
export async function dashboardStats() {
  const today = todayKey();
  const [employees, teams, pendingLeaves, present, attended, holidays] = await Promise.all([
    models.employees.countDocuments({}),
    models.teams.countDocuments({}),
    models.leaves.countDocuments({ status: 0 }),
    models.attendance.countDocuments({ attendance_date: today, status: "Present" }),
    models.attendance.distinct("emp_id", { attendance_date: today }),
    models.holidays.countDocuments({})
  ]);
  return [
    { label: "Total Employees", value: employees, icon: "bi-people", meta: "Active employees", page: "employees" },
    { label: "Department", value: teams, icon: "bi-diagram-3", meta: "Across organization", page: "teams" },
    { label: "Pending Approvals", value: pendingLeaves, icon: "bi-clipboard-check", meta: "Leave requests waiting", page: "leaves" },
    { label: "Present Employee", value: present, icon: "bi-check-circle", meta: "Today", page: "attendance" },
    { label: "Absent Employee", value: Math.max(0, employees - attended.length), icon: "bi-x-circle", meta: "Today", page: "attendance" },
    { label: "Total Holiday", value: holidays, icon: "bi-tsunami", meta: "This year", page: "holidays" }
  ];
}

import { models } from "../models/index.js";
import { getRoleModule } from "../roles/index.js";
import { todayKey } from "../utils/date.js";

// Stats come from the user's role module; the notice board is shared by all roles.
export async function dashboard(user) {
  const [stats, notices] = await Promise.all([
    getRoleModule(user.role).dashboardStats(user),
    models.notices.find({}).sort({ createdAt: -1, _id: -1 }).limit(20).lean()
  ]);
  return { stats, notices };
}

// Today's birthdays and work anniversaries.
export async function notifications() {
  const today = todayKey().slice(5);
  const employees = await models.employees.find({ $or: [{ bdate: { $regex: `-${today}$` } }, { jdate: { $regex: `-${today}$` } }] }).lean();
  const notifications = employees.flatMap((employee) => {
    const rows = [];
    if (employee.bdate?.slice(5) === today) rows.push(`Wish ${employee.fname} a Happy Birthday!`);
    if (employee.jdate?.slice(5) === today) rows.push(`Congratulate ${employee.fname} on their Work Anniversary!`);
    return rows;
  });
  return { notifications };
}

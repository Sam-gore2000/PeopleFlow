import { env } from "../config/env.js";
import { models } from "../models/index.js";
import { todayKey } from "../utils/date.js";
import { httpError } from "../utils/httpError.js";
import { holidayMap, normalizeDate, workingDaysBetween } from "../utils/workdays.js";

const APPROVED = 1;
const PENDING = 0;
const MAX_ADJUSTMENT_DAYS = 365;

const round = (value) => Math.round(value * 100) / 100;
const monthIndex = (date) => { const [year, month] = date.split("-").map(Number); return year * 12 + month - 1; };
const isHalfDay = (duration) => /^half/i.test(String(duration || ""));

// The date `months` months after `date` (same day of month; clamps to the month's last day).
function addMonths(date, months) {
  const [year, month, day] = date.split("-").map(Number);
  const target = new Date(year, month - 1 + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return normalizeDate(new Date(target.getFullYear(), target.getMonth(), Math.min(day, lastDay)));
}

// Working days of a leave; a half-day leave counts 0.5.
function leaveDays(leave, holidays) {
  const days = workingDaysBetween(leave.leave1, leave.leave2 || leave.leave1, holidays);
  const counted = days || (normalizeDate(leave.leave1) ? 0 : Number(leave.total_leave) || 0);
  return isHalfDay(leave.leave_duration) ? counted * 0.5 : counted;
}

// The current leave year: { start: "2026-01-01", end: "2026-12-31", label: "Jan 2026 - Dec 2026" }.
export function leaveYear(today = todayKey()) {
  const startMonth = env.leaveYearStartMonth; // 1-12
  const [year, month] = today.split("-").map(Number);
  const startYear = month >= startMonth ? year : year - 1;
  const start = `${startYear}-${String(startMonth).padStart(2, "0")}-01`;
  const end = normalizeDate(new Date(startYear + 1, startMonth - 1, 0));
  const fmt = (date) => new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return { start, end, label: startMonth === 1 ? String(startYear) : `${fmt(start)} - ${fmt(end)}` };
}

// Paid leave balance for the current leave year (no carry-forward from earlier years).
//  earned:   1.5 days for each month of this leave year so far, counted from the joining month if they
//            joined this year (or from the opening-balance date, plus the opening days, if one was set this year)
//  adjusted: admin changes made this leave year
//  used:     approved leave starting this leave year (working days; a half day counts 0.5)
//  Probation: for PROBATION_MONTHS (3) after joining, the balance builds up but can't be used yet.
export async function leaveBalance(empid) {
  const employee = await models.employees.findOne({ empid }).lean();
  const joined = normalizeDate(employee?.jdate);
  const today = todayKey();
  const perMonth = env.leaveAccrualPerMonth;
  const year = leaveYear(today);
  const inYear = (date) => Boolean(date) && date >= year.start && date <= year.end;
  const [leaves, holidays, allAdjustments] = await Promise.all([
    models.leaves.find({ empid, status: { $in: [APPROVED, PENDING] } }).lean(),
    holidayMap(),
    models.leaveAdjustments.find({ empid }).sort({ createdAt: -1 }).lean()
  ]);

  const madeThisYear = (item) => inYear(normalizeDate(item.createdAt ? new Date(item.createdAt) : ""));
  const opening = allAdjustments.find((item) => item.mode === "opening" && inYear(normalizeDate(item.as_of))) || null;
  const openingDate = opening ? normalizeDate(opening.as_of) : null;
  const adjustments = allAdjustments.filter((item) => item.mode !== "opening" && madeThisYear(item) && (!opening || new Date(item.createdAt) > new Date(opening.createdAt)));

  const counted = leaves.filter((leave) => {
    const start = normalizeDate(leave.leave1);
    return inYear(start) && (!openingDate || start > openingDate);
  });
  const used = round(counted.filter((leave) => Number(leave.status) === APPROVED).reduce((sum, leave) => sum + leaveDays(leave, holidays), 0));
  const pending = round(counted.filter((leave) => Number(leave.status) === PENDING).reduce((sum, leave) => sum + leaveDays(leave, holidays), 0));
  const adjusted = round(adjustments.reduce((sum, item) => sum + (Number(item.days) || 0), 0));
  const history = allAdjustments.slice(0, 10).map(({ _id, days, reason, mode, as_of, balance_before, balance_after, by, createdAt }) => ({
    _id, days, reason, mode, as_of, balance_before, balance_after, by, createdAt,
    counts: mode === "opening" ? Boolean(opening && String(opening._id) === String(_id)) : adjustments.some((item) => String(item._id) === String(_id))
  }));

  const probationEnds = joined && env.probationMonths > 0 ? addMonths(joined, env.probationMonths) : null;
  const onProbation = Boolean(probationEnds && today < probationEnds);
  const base = {
    empid, joined: joined || null, per_month: perMonth, adjusted, used, pending, adjustments: history,
    year: year.label, year_start: year.start, year_end: year.end,
    probation_months: env.probationMonths, probation_ends: probationEnds, on_probation: onProbation
  };

  let earned;
  let months;
  if (opening) {
    months = Math.max(0, monthIndex(today) - monthIndex(openingDate));
    earned = round((Number(opening.days) || 0) + months * perMonth);
    base.opening = { days: Number(opening.days) || 0, as_of: openingDate, by: opening.by, reason: opening.reason };
  } else if (joined && joined <= today) {
    const from = joined > year.start ? joined : year.start; // joined this year: from the joining month
    months = Math.max(0, monthIndex(today) - monthIndex(from) + 1);
    earned = round(months * perMonth);
    base.earned_from = from;
  } else {
    if (!adjustments.length) return { ...base, months: 0, earned: null, balance: null, available: null, note: joined ? "Joining date is in the future" : "Joining date not set" };
    months = 0;
    earned = 0;
  }

  const balance = round(earned + adjusted - used);
  return { ...base, months, earned, balance, available: onProbation ? 0 : balance };
}

function checkDays(value) {
  if (!Number.isFinite(value) || Math.abs(value) > MAX_ADJUSTMENT_DAYS) throw httpError(400, "Enter a number of days.");
  if (Math.round(value * 2) !== value * 2) throw httpError(400, "Use whole or half days (e.g. 1, 1.5, 2).");
}

async function findEmployee(empid) {
  if (!empid) throw httpError(400, "Choose an employee.");
  const employee = await models.employees.findOne({ empid: String(empid).trim() }).lean();
  if (!employee) throw httpError(404, `No employee with ID ${empid}.`);
  return employee;
}

const adminName = (admin) => admin.username || admin.name || "admin";

// Admin: change a balance by hand.
//   mode "set": make the balance exactly `days`;  mode "add": add `days` (negative removes).
export async function adjustLeaveBalance(admin, { emp_id: empid, mode = "add", days, reason } = {}) {
  const value = Number(days);
  if (!["set", "add"].includes(mode)) throw httpError(400, "Unknown adjustment type.");
  checkDays(value);
  if (mode === "set" && value < 0) throw httpError(400, "The balance can't be set below 0.");
  if (!String(reason || "").trim()) throw httpError(400, "Please add a reason for the change.");
  const employee = await findEmployee(empid);

  const before = await leaveBalance(employee.empid);
  const current = before.balance ?? 0;
  const delta = round(mode === "set" ? value - current : value);
  if (delta === 0) throw httpError(400, mode === "set" ? `The balance is already ${current}.` : "Enter a number other than 0.");

  await models.leaveAdjustments.create({
    empid: employee.empid, days: delta, reason: String(reason).trim().slice(0, 300), mode,
    balance_before: current, balance_after: round(current + delta), by: adminName(admin)
  });
  return { data: await leaveBalance(employee.empid) };
}

// Admin: opening balance for someone who joined before HRMS tracked their leave
// (e.g. joined 2 years ago and already used some leave). From the "as of" date the balance is
// `days`, then 1.5 is added each following month; leave before that date no longer counts.
// A new opening balance replaces the previous one.
export async function setOpeningBalance(admin, { emp_id: empid, days, as_of: asOf, reason } = {}) {
  const value = Number(days);
  checkDays(value);
  if (value < 0) throw httpError(400, "The opening balance can't be below 0.");
  const date = normalizeDate(asOf) || todayKey();
  if (date > todayKey()) throw httpError(400, "The 'as of' date can't be in the future.");
  const employee = await findEmployee(empid);
  const joined = normalizeDate(employee.jdate);
  if (joined && date < joined) throw httpError(400, "The 'as of' date can't be before the joining date.");

  const before = await leaveBalance(employee.empid);
  await models.leaveAdjustments.create({
    empid: employee.empid, days: value, mode: "opening", as_of: date,
    reason: String(reason || "Opening balance").trim().slice(0, 300) || "Opening balance",
    balance_before: before.balance ?? 0, balance_after: value, by: adminName(admin)
  });
  return { data: await leaveBalance(employee.empid) };
}

// Admin: remove one adjustment or opening balance (e.g. a correction made under the old all-time balance).
export async function removeAdjustment(admin, id) {
  if (!/^[a-f\d]{24}$/i.test(String(id || ""))) throw httpError(404, "Adjustment not found.");
  const item = await models.leaveAdjustments.findOne({ _id: id }).lean();
  if (!item) throw httpError(404, "Adjustment not found.");
  await models.leaveAdjustments.findOneAndDelete({ _id: item._id });
  return { data: await leaveBalance(item.empid) };
}

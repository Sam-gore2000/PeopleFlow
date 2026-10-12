import { resourceConfig } from "../config/resources.js";
import { models } from "../models/index.js";
import { secondsSince, todayKey } from "../utils/date.js";
import { httpError } from "../utils/httpError.js";
import { grossWorkSeconds } from "../utils/workTime.js";
import { breakSummary, closeStaleBreaks, empId, endBreak, findActiveBreak } from "./breakService.js";
import { scopeFilter } from "./resourceService.js";

const HALF_DAY_SECONDS = 4 * 3600;
const MIN_WORK_SECONDS = 60;
const DUPLICATE_KEY = 11000;

// Work time for a record: punch in -> punch out (or now, while still working), breaks included.
function workSeconds(row, now = Date.now()) {
  return row?.punch_in ? grossWorkSeconds(row, now) : 0;
}

// Records from an earlier day that were never punched out are flagged instead of left "open".
async function closeStaleAttendance(id, today) {
  const stale = await models.attendance.find({ emp_id: id, attendance_date: { $lt: today }, punch_in: { $exists: true }, punch_out: null }).lean();
  for (const row of stale) {
    if (row.status !== "Missed Punch Out") await models.attendance.updateOne({ _id: row._id }, { $set: { status: "Missed Punch Out" } });
  }
}

export async function today(user) {
  return (await models.attendance.findOne({ emp_id: empId(user), attendance_date: todayKey() }).lean()) || {};
}

// Everything the punch card needs in one call, including server time so the browser timer stays accurate.
export async function status(user) {
  const now = new Date();
  const id = empId(user);
  const date = todayKey(now);
  const [row, breaks] = await Promise.all([
    models.attendance.findOne({ emp_id: id, attendance_date: date }).lean(),
    breakSummary(id, date, now.getTime())
  ]);
  return {
    date,
    server_time: now.toISOString(),
    attendance: row || null,
    punched_in: Boolean(row?.punch_in && !row.punch_out),
    punched_out: Boolean(row?.punch_out),
    work_seconds: workSeconds(row, now.getTime()),
    break_seconds: row?.punch_out && typeof row.break_seconds === "number" ? row.break_seconds : breaks.totalSeconds,
    closed_break_seconds: breaks.closedSeconds,
    on_break: Boolean(breaks.active),
    active_break_start: breaks.active?.break_start || null,
    break_count: breaks.rows.length,
    breaks: breaks.rows
  };
}

export async function punchIn(user) {
  const id = empId(user);
  const date = todayKey();
  await Promise.all([closeStaleAttendance(id, date), closeStaleBreaks(id, date)]);

  const existing = await models.attendance.findOne({ emp_id: id, attendance_date: date }).lean();
  if (existing?.punch_out) return { payload: { action: "already_completed", data: existing } };
  if (existing) return { payload: { action: "already_punched_in", punch_in: existing.punch_in, data: existing } };

  const employee = user.empid ? await models.employees.findOne({ empid: user.empid }).lean() : null;
  try {
    const data = await models.attendance.create({
      emp_id: id,
      emp_name: employee?.fname || user.name || user.username,
      role: user.role,
      department: employee?.department,
      report_manager_id: employee?.report_manager_id,
      attendance_date: date,
      punch_in: new Date(),
      status: "Present"
    });
    return { statusCode: 201, payload: { action: "punchin", punch_in: data.punch_in, data } };
  } catch (error) {
    if (error?.code !== DUPLICATE_KEY) throw error;
    const current = await models.attendance.findOne({ emp_id: id, attendance_date: date }).lean();
    return { payload: { action: "already_punched_in", punch_in: current?.punch_in, data: current } };
  }
}

export async function punchOut(user) {
  const id = empId(user);
  const date = todayKey();
  const row = await models.attendance.findOne({ emp_id: id, attendance_date: date }).lean();
  if (!row?.punch_in) throw httpError(400, "You haven't punched in today.", "not_punched_in");
  if (row.punch_out) return { payload: { action: "already_completed", data: row } };
  if (secondsSince(row.punch_in) < MIN_WORK_SECONDS) throw httpError(400, "Please work for some time before punching out.", "too_fast");

  // A break still running at punch-out is ended at the same moment.
  const endedAt = new Date();
  const running = await findActiveBreak(id, date);
  if (running) await endBreak(running, endedAt);

  const { closedSeconds } = await breakSummary(id, date, endedAt.getTime());
  const work = Math.max(0, secondsSince(row.punch_in, endedAt.getTime())); // breaks included
  const data = await models.attendance.findOneAndUpdate(
    { _id: row._id, punch_out: null },
    { $set: { punch_out: endedAt, work_seconds: work, break_seconds: closedSeconds, status: work < HALF_DAY_SECONDS ? "Half Day" : "Present" } },
    { new: true }
  );
  if (!data) return { payload: { action: "already_completed", data: await models.attendance.findOne({ _id: row._id }).lean() } };
  return { payload: { action: "punchout", auto_ended_break: Boolean(running), data } };
}

// Kept for older clients: punches in, or punches out if already in.
export async function toggle(user) {
  const row = await models.attendance.findOne({ emp_id: empId(user), attendance_date: todayKey() }).lean();
  return row?.punch_in && !row.punch_out ? punchOut(user) : punchIn(user);
}

export async function report(user, query) {
  const filter = {};
  if (query.emp_id) filter.emp_id = query.emp_id;
  if (query.month) filter.attendance_date = { $gte: `${query.month}-01`, $lte: `${query.month}-31` };
  const scoped = scopeFilter(resourceConfig.attendance, user, filter);
  return { data: await models.attendance.find(scoped).sort({ attendance_date: 1 }).lean() };
}

function monthRange(month) {
  const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(month || "") ? month : todayKey().slice(0, 7);
  const [year, monthNumber] = valid.split("-").map(Number);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  return { month: valid, from: `${valid}-01`, to: `${valid}-${String(lastDay).padStart(2, "0")}` };
}

function breakView(row, now) {
  const running = !row.break_end;
  return {
    start: row.break_start,
    end: row.break_end || null,
    seconds: running ? secondsSince(row.break_start, now) : row.break_seconds || 0,
    active: running,
    auto_closed: Boolean(row.auto_closed)
  };
}

// One day of one person: live values for today's open record, final values once punched out.
function dayView(row, dayBreaks, today, now) {
  const breaks = dayBreaks.map((item) => breakView(item, now));
  const liveBreakSeconds = breaks.reduce((sum, item) => sum + item.seconds, 0);
  const live = !row.punch_out && row.attendance_date === today;
  const onBreak = live && breaks.some((item) => item.active);
  const breakSeconds = row.punch_out && typeof row.break_seconds === "number" ? row.break_seconds : liveBreakSeconds;
  let status = row.status || "Present";
  if (live) status = onBreak ? "On Break" : "Working";
  else if (!row.punch_out && row.punch_in) status = "Missed Punch Out";

  return {
    date: row.attendance_date,
    punch_in: row.punch_in || null,
    punch_out: row.punch_out || null,
    work_seconds: row.punch_in && (row.punch_out || live) ? workSeconds(row, now) : 0,
    break_seconds: breakSeconds,
    break_count: breaks.length,
    breaks,
    status,
    live
  };
}

// Admin: every person's working hours and breaks for a month, day by day.
// Which people a report may include: admins everyone, managers their team plus themselves.
async function reportScope(user) {
  if (!user || user.role === "admin") return null;
  const team = await models.employees.find({ report_manager_id: user.empid }).lean();
  return [user.empid, ...team.map((member) => member.empid)];
}

export async function monthlyReport(query = {}, user = null) {
  const now = Date.now();
  const today = todayKey();
  const { month, from, to } = monthRange(query.month);
  const inMonth = { attendance_date: { $gte: from, $lte: to } };
  const allowed = await reportScope(user);
  if (allowed && query.emp_id && !allowed.includes(String(query.emp_id))) throw httpError(403, "You can only see your own team's report.");
  const person = query.emp_id ? { emp_id: String(query.emp_id) } : allowed ? { emp_id: { $in: allowed } } : {};
  const employeeFilter = query.emp_id ? { empid: String(query.emp_id) } : allowed ? { empid: { $in: allowed } } : {};

  const [employees, rows, breakRows] = await Promise.all([
    models.employees.find(employeeFilter).sort({ fname: 1 }).lean(),
    models.attendance.find({ ...inMonth, ...person }).sort({ attendance_date: 1 }).lean(),
    models.breaks.find({ ...inMonth, ...person }).sort({ break_start: 1 }).lean()
  ]);

  const breaksByDay = new Map();
  for (const item of breakRows) {
    const key = `${item.emp_id}|${item.attendance_date}`;
    if (!breaksByDay.has(key)) breaksByDay.set(key, []);
    breaksByDay.get(key).push(item);
  }

  // Everyone on the payroll appears, even with no attendance; admins who punched in are added too.
  const people = new Map(
    employees.map((employee) => [employee.empid, { emp_id: employee.empid, emp_name: employee.fname, department: employee.department || "", position: employee.position || "", days: [] }])
  );
  for (const row of rows) {
    if (!people.has(row.emp_id)) people.set(row.emp_id, { emp_id: row.emp_id, emp_name: row.emp_name || row.emp_id, department: row.department || "", position: row.role === "admin" ? "Admin" : "", days: [] });
    people.get(row.emp_id).days.push(dayView(row, breaksByDay.get(`${row.emp_id}|${row.attendance_date}`) || [], today, now));
  }

  const summaries = [...people.values()].map((entry) => {
    const worked = entry.days.filter((day) => day.work_seconds > 0);
    const workTotal = entry.days.reduce((sum, day) => sum + day.work_seconds, 0);
    return {
      ...entry,
      days_present: entry.days.filter((day) => ["Present", "Working", "On Break"].includes(day.status)).length,
      half_days: entry.days.filter((day) => day.status === "Half Day").length,
      missed_punch_out: entry.days.filter((day) => day.status === "Missed Punch Out").length,
      work_seconds: workTotal,
      break_seconds: entry.days.reduce((sum, day) => sum + day.break_seconds, 0),
      break_count: entry.days.reduce((sum, day) => sum + day.break_count, 0),
      avg_work_seconds: worked.length ? Math.round(workTotal / worked.length) : 0,
      live: entry.days.some((day) => day.live)
    };
  });

  const totals = summaries.reduce(
    (sum, entry) => ({
      employees: sum.employees + 1,
      tracked: sum.tracked + (entry.days.length ? 1 : 0),
      attendance_days: sum.attendance_days + entry.days.length,
      work_seconds: sum.work_seconds + entry.work_seconds,
      break_seconds: sum.break_seconds + entry.break_seconds,
      break_count: sum.break_count + entry.break_count
    }),
    { employees: 0, tracked: 0, attendance_days: 0, work_seconds: 0, break_seconds: 0, break_count: 0 }
  );

  return { month, from, to, generated_at: new Date(now).toISOString(), totals, employees: summaries };
}

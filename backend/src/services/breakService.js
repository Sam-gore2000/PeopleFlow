import { models } from "../models/index.js";
import { secondsSince, todayKey } from "../utils/date.js";
import { httpError } from "../utils/httpError.js";

const DUPLICATE_KEY = 11000;

// Attendance identity: employees/managers use their empid, admins their username.
export function empId(user) {
  return user.empid || user.username;
}

// The break currently running today, if any (break_end: null also matches legacy rows with no break_end).
export function findActiveBreak(id, date = todayKey()) {
  return models.breaks.findOne({ emp_id: id, attendance_date: date, break_start: { $exists: true }, break_end: null });
}

// All of a day's breaks: closed total, the running one, and the live total including it.
export async function breakSummary(id, date = todayKey(), now = Date.now()) {
  const rows = await models.breaks.find({ emp_id: id, attendance_date: date }).sort({ break_start: 1 }).lean();
  const active = rows.find((row) => row.break_start && !row.break_end) || null;
  const closedSeconds = rows.reduce((sum, row) => sum + (row.break_end ? row.break_seconds || 0 : 0), 0);
  const runningSeconds = active ? secondsSince(active.break_start, now) : 0;
  return { rows, active, closedSeconds, totalSeconds: closedSeconds + runningSeconds };
}

export async function totalBreakSeconds(id, date = todayKey()) {
  return (await breakSummary(id, date)).closedSeconds;
}

// Ends a running break. The `break_end: null` condition makes a double stop harmless.
export async function endBreak(active, endedAt = new Date()) {
  const seconds = secondsSince(active.break_start, endedAt.getTime());
  const data = await models.breaks.findOneAndUpdate(
    { _id: active._id, break_end: null },
    { $set: { break_end: endedAt, break_seconds: seconds, active: false } },
    { new: true }
  );
  return data || models.breaks.findOne({ _id: active._id }).lean();
}

// Breaks left running on an earlier day (e.g. the browser was closed) are closed with zero time,
// so they never block today's breaks or inflate the report.
export async function closeStaleBreaks(id, today = todayKey()) {
  const stale = await models.breaks.find({ emp_id: id, break_end: null, attendance_date: { $lt: today } }).lean();
  for (const row of stale) {
    await models.breaks.updateOne(
      { _id: row._id },
      { $set: { break_end: row.break_start, break_seconds: 0, active: false, auto_closed: true } }
    );
  }
}

export async function breaksToday(user) {
  const summary = await breakSummary(empId(user));
  return {
    total_break_seconds: summary.closedSeconds,
    active_break_start: summary.active?.break_start || null,
    break_count: summary.rows.length,
    breaks: summary.rows
  };
}

function openAttendance(id, date) {
  return models.attendance.findOne({ emp_id: id, attendance_date: date, punch_in: { $exists: true }, punch_out: null }).lean();
}

export async function startBreak(user) {
  const id = empId(user);
  const today = todayKey();
  const attendance = await openAttendance(id, today);
  if (!attendance) throw httpError(400, "Punch in first before starting a break.", "not_punched_in");

  const running = await findActiveBreak(id, today);
  if (running) return { payload: { action: "break_already_active", break_start: running.break_start, data: running } };

  try {
    const data = await models.breaks.create({
      emp_id: id,
      emp_name: attendance.emp_name,
      attendance_id: String(attendance._id),
      attendance_date: today,
      break_start: new Date(),
      active: true
    });
    return { statusCode: 201, payload: { action: "break_start", break_start: data.break_start, data } };
  } catch (error) {
    if (error?.code !== DUPLICATE_KEY) throw error;
    const current = await findActiveBreak(id, today);
    return { payload: { action: "break_already_active", break_start: current?.break_start, data: current } };
  }
}

export async function stopBreak(user) {
  const id = empId(user);
  const running = await findActiveBreak(id, todayKey());
  if (!running) throw httpError(400, "You are not on a break right now.", "no_active_break");
  const data = await endBreak(running);
  return { payload: { action: "break_end", seconds: data?.break_seconds || 0, data } };
}

// Kept for older clients: starts a break, or stops the running one.
export async function toggleBreak(user) {
  const running = await findActiveBreak(empId(user), todayKey());
  return running ? stopBreak(user) : startBreak(user);
}

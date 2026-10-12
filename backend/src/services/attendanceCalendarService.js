import { env } from "../config/env.js";
import { ROLES } from "../constants/roles.js";
import { models } from "../models/index.js";
import { httpError } from "../utils/httpError.js";
import { grossWorkSeconds } from "../utils/workTime.js";
import { todayKey } from "../utils/date.js";
import { holidayMap, normalizeDate, weekday } from "../utils/workdays.js";
import { empId } from "./breakService.js";

const APPROVED = 1;
const PRESENT_STATUSES = new Set(["Present", "Half Day", "Missed Punch Out"]);

function monthDays(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const count = new Date(year, monthNumber, 0).getDate();
  return Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`);
}

// Which employee's records this user may open: their own; a manager also their team; an admin anyone.
export async function resolveEmployee(user, requested) {
  const ownId = empId(user);
  const target = String(requested || "").trim() || ownId;
  if (user.role === ROLES.EMPLOYEE && target !== ownId) throw httpError(403, "You can only view your own attendance.");

  const employee = await models.employees.findOne({ empid: target }).lean();
  if (user.role === ROLES.MANAGER && target !== ownId && employee?.report_manager_id !== user.empid) {
    throw httpError(403, "You can only view your own team's attendance.");
  }
  if (!employee && target !== ownId) throw httpError(404, `No employee with ID ${target}.`);
  return {
    empid: target,
    name: employee?.fname || user.name || target,
    jdate: normalizeDate(employee?.jdate),
    added: normalizeDate(employee?.createdAt ? new Date(employee.createdAt) : ""),
    position: employee?.position || "",
    department: employee?.department || ""
  };
}

// Month calendar for one person: Present / Half Day / Leave / Absent / Holiday / Week Off per day,
// plus totals. Order of precedence: worked that day > holiday > week off > approved leave > absent.
export async function monthCalendar(user, query = {}) {
  const month = /^\d{4}-(0[1-9]|1[0-2])$/.test(query.month || "") ? query.month : todayKey().slice(0, 7);
  const employee = await resolveEmployee(user, query.emp_id);
  const dates = monthDays(month);
  const from = dates[0];
  const to = dates[dates.length - 1];
  const today = todayKey();

  const [attendanceRows, leaveRows, allHolidays, firstRecord] = await Promise.all([
    models.attendance.find({ emp_id: employee.empid, attendance_date: { $gte: from, $lte: to } }).lean(),
    models.leaves.find({ empid: employee.empid, status: APPROVED, leave1: { $lte: to }, leave2: { $gte: from } }).lean(),
    holidayMap(),
    models.attendance.findOne({ emp_id: employee.empid }).sort({ attendance_date: 1 }).lean()
  ]);

  const attendanceByDate = new Map(attendanceRows.map((row) => [row.attendance_date, row]));
  const holidays = allHolidays;
  const leaveFor = (date) => leaveRows.find((leave) => normalizeDate(leave.leave1) <= date && date <= normalizeDate(leave.leave2));

  // A working day with no punch-in is Absent from the joining date onwards
  // (if no joining date is set: from when the employee was added, else from their first punch-in).
  const trackingStart = employee.jdate || employee.added || firstRecord?.attendance_date || null;

  const days = dates.map((date) => {
    const record = attendanceByDate.get(date);
    const holidayName = holidays.get(date);
    const leave = leaveFor(date);
    const weeklyOff = env.weeklyOffDays.includes(weekday(date));
    const day = { date, weekday: weekday(date), is_today: date === today, weekly_off: weeklyOff, status: null };

    if (record?.punch_in) {
      const live = !record.punch_out && date === today;
      day.status = record.status === "Half Day" ? "Half Day" : "Present";
      day.punch_in = record.punch_in;
      day.punch_out = record.punch_out || null;
      day.work_seconds = grossWorkSeconds(record); // punch in -> out (or now), breaks included
      day.break_seconds = record.break_seconds || 0;
      day.missed_punch_out = !record.punch_out && !live;
      day.working_now = live;
    } else if (record && PRESENT_STATUSES.has(record.status)) {
      day.status = record.status === "Half Day" ? "Half Day" : "Present"; // added by admin without times
    } else if (holidayName) {
      day.status = "Holiday";
    } else if (weeklyOff) {
      day.status = "Week Off"; // Saturday/Sunday (WEEKLY_OFF_DAYS), even inside a leave
    } else if (leave) {
      day.status = "Leave";
      day.leave_type = `${leave.leavet || "Leave"}${/^half/i.test(leave.leave_duration || "") ? ` (${leave.leave_duration})` : ""}`;
    } else if (record?.status === "Absent") {
      day.status = "Absent";
    } else if (date < today && trackingStart && date >= trackingStart) {
      day.status = "Absent";
    }
    if (holidayName) day.holiday_name = holidayName;
    if (leave && day.status !== "Leave") day.leave_type = leave.leavet || "Leave";
    return day;
  });

  const count = (status) => days.filter((day) => day.status === status).length;
  return {
    month,
    employee,
    settings: { weekly_off_days: env.weeklyOffDays },
    summary: {
      present: count("Present"),
      half_day: count("Half Day"),
      leave: count("Leave"),
      absent: count("Absent"),
      holiday: count("Holiday"),
      week_off: count("Week Off"),
      working_days: days.filter((day) => !day.weekly_off && day.status !== "Holiday").length
    },
    days
  };
}

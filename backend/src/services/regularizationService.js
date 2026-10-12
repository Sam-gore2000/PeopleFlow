import { ROLES } from "../constants/roles.js";
import { models } from "../models/index.js";
import { todayKey } from "../utils/date.js";
import { httpError } from "../utils/httpError.js";
import { breakSummary, empId } from "./breakService.js";

// Attendance regularization: an employee asks to fix a missed / wrong punch, their manager
// (or an admin) approves, rejects or corrects it, and approval writes the times into attendance.
// Stored in the legacy attendance request collection (attendance_res); date / punch_in / punch_out
// are kept filled too so older screens can still read the requests.

const PENDING = 0;
const APPROVED = 1;
const REJECTED = 2;
const HALF_DAY_SECONDS = 4 * 3600;
const MAX_SHIFT_HOURS = 24;
const PAGE_SIZE = 10;
const STATUS_NAMES = { [PENDING]: "Pending", [APPROVED]: "Approved", [REJECTED]: "Rejected" };

const isDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
const isTime = (value) => /^([01]\d|2[0-3]):[0-5]\d$/.test(String(value || ""));
const validId = (id) => /^[a-f\d]{24}$/i.test(String(id || ""));
const at = (date, time) => new Date(`${date}T${time}:00`); // office time zone (APP_TIMEZONE)

// Checks the four date/time fields; returns them with the punch-in/out Date objects.
function checkTimes({ in_date, login_time, out_date, logout_time }) {
  if (!isDate(in_date)) throw httpError(400, "Choose the In Date.");
  if (!isTime(login_time)) throw httpError(400, "Enter the Login Time.");
  const outDate = out_date || in_date;
  if (!isDate(outDate)) throw httpError(400, "Choose the Out Date.");
  if (!isTime(logout_time)) throw httpError(400, "Enter the Logout Time.");
  if (in_date > todayKey()) throw httpError(400, "You can't regularize a future date.");
  if (outDate < in_date) throw httpError(400, "The Out Date can't be before the In Date.");

  const punchIn = at(in_date, login_time);
  const punchOut = at(outDate, logout_time);
  if (punchOut <= punchIn) throw httpError(400, "The Logout Time must be after the Login Time.");
  if (punchOut - punchIn > MAX_SHIFT_HOURS * 3600_000) throw httpError(400, `A shift can't be longer than ${MAX_SHIFT_HOURS} hours.`);
  if (punchOut > new Date()) throw httpError(400, "The Logout Time can't be in the future.");
  return { in_date, login_time, out_date: outDate, logout_time, punchIn, punchOut };
}

function view(row) {
  const status = Number(row.status) || PENDING;
  return {
    _id: row._id,
    empid: row.empid,
    name: row.name,
    report_manager_id: row.report_manager_id,
    in_date: row.in_date || row.date,
    login_time: row.login_time || row.punch_in,
    out_date: row.out_date || row.date,
    logout_time: row.logout_time || row.punch_out,
    reason: row.reason,
    status,
    status_name: STATUS_NAMES[status] || "Pending",
    decided_by: row.decided_by || "",
    decided_at: row.decided_at || null,
    manager_note: row.manager_note || "",
    original: row.original || null,
    createdAt: row.createdAt
  };
}

// Requests this user may decide on: admins all, managers their team (never their own).
async function decisionScope(user) {
  if (user.role === ROLES.ADMIN) return {};
  if (user.role !== ROLES.MANAGER) throw httpError(403, "Only managers and admins can approve requests.");
  return { report_manager_id: user.empid, empid: { $ne: user.empid } };
}

// Employee / manager: ask to regularize one day.
export async function createRequest(user, body = {}) {
  if (user.role === ROLES.ADMIN) throw httpError(400, "Admins can correct attendance directly in Attendance Details.");
  const id = empId(user);
  const reason = String(body.reason || "").trim();
  if (reason.length < 3) throw httpError(400, "Please give a reason.");
  const times = checkTimes(body);

  const duplicate = await models.attendanceRequests.findOne({ empid: id, status: PENDING, $or: [{ in_date: times.in_date }, { date: times.in_date }] }).lean();
  if (duplicate) throw httpError(409, `You already have a pending request for ${times.in_date}. Cancel it first to send a new one.`);

  const employee = await models.employees.findOne({ empid: id }).lean();
  if (!employee?.report_manager_id) throw httpError(400, "No reporting manager is set for you. Please ask HR to add one in Employee Details.");
  const current = await models.attendance.findOne({ emp_id: id, attendance_date: times.in_date }).lean();

  const data = await models.attendanceRequests.create({
    empid: id,
    name: employee.fname || user.name || id,
    report_manager_id: employee.report_manager_id,
    in_date: times.in_date,
    login_time: times.login_time,
    out_date: times.out_date,
    logout_time: times.logout_time,
    date: times.in_date,
    punch_in: times.login_time,
    punch_out: times.logout_time,
    reason: reason.slice(0, 500),
    status: PENDING,
    original: current ? { punch_in: current.punch_in || null, punch_out: current.punch_out || null, status: current.status || "" } : null
  });
  return { statusCode: 201, payload: { data: view(data) } };
}

// List: scope "mine" (own requests) or "team" (to approve: manager's team / admin everyone).
export async function listRequests(user, { scope = "mine", status = "", page = 1 } = {}) {
  const filter = scope === "team" ? await decisionScope(user) : { empid: empId(user) };
  if (status !== "" && status !== "all" && STATUS_NAMES[Number(status)] !== undefined) {
    filter.status = Number(status) === PENDING ? { $in: [PENDING, null] } : Number(status);
  }
  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const [rows, total, pending] = await Promise.all([
    models.attendanceRequests.find(filter).sort({ createdAt: -1, _id: -1 }).skip((pageNumber - 1) * PAGE_SIZE).limit(PAGE_SIZE).lean(),
    models.attendanceRequests.countDocuments(filter),
    models.attendanceRequests.countDocuments({ ...filter, status: { $in: [PENDING, null] } })
  ]);
  return { data: rows.map(view), total, page: pageNumber, page_size: PAGE_SIZE, pending };
}

// Writes the approved times into attendance (creates the day if it has no record).
async function applyToAttendance(request, times, decidedBy) {
  const employee = await models.employees.findOne({ empid: request.empid }).lean();
  const { closedSeconds } = await breakSummary(request.empid, times.in_date);
  const workSeconds = Math.max(0, Math.round((times.punchOut - times.punchIn) / 1000)); // breaks included
  const values = {
    punch_in: times.punchIn,
    punch_out: times.punchOut,
    work_seconds: workSeconds,
    break_seconds: closedSeconds,
    status: workSeconds < HALF_DAY_SECONDS ? "Half Day" : "Present",
    regularized: true,
    regularized_by: decidedBy,
    regularization_id: String(request._id)
  };
  const existing = await models.attendance.findOne({ emp_id: request.empid, attendance_date: times.in_date }).lean();
  if (existing) {
    await models.attendance.updateOne({ _id: existing._id }, { $set: values });
  } else {
    await models.attendance.create({
      emp_id: request.empid,
      emp_name: employee?.fname || request.name,
      role: "employee",
      department: employee?.department,
      report_manager_id: employee?.report_manager_id || request.report_manager_id,
      attendance_date: times.in_date,
      ...values
    });
  }
}

// Manager / admin: approve (optionally with corrected times) or reject, with a note.
export async function decide(user, id, body = {}) {
  const action = body.action;
  if (!["approve", "reject"].includes(action)) throw httpError(400, "Choose Approve or Reject.");
  if (!validId(id)) throw httpError(404, "Request not found.");
  const request = await models.attendanceRequests.findOne({ _id: id, ...(await decisionScope(user)) }).lean();
  if (!request) throw httpError(404, "Request not found.");
  if ((Number(request.status) || PENDING) !== PENDING) throw httpError(409, `This request was already ${STATUS_NAMES[Number(request.status)].toLowerCase()}.`);

  const note = String(body.note || "").trim().slice(0, 500);
  const decidedBy = user.empid ? `${user.name || user.empid} (${user.empid})` : user.username || "admin";
  const update = { decided_by: decidedBy, decided_at: new Date(), manager_note: note };

  if (action === "reject") {
    if (!note) throw httpError(400, "Please add a note explaining the rejection.");
    await models.attendanceRequests.updateOne({ _id: request._id }, { $set: { ...update, status: REJECTED } });
  } else {
    const current = view(request);
    const times = checkTimes({
      in_date: body.in_date || current.in_date,
      login_time: body.login_time || current.login_time,
      out_date: body.out_date || current.out_date,
      logout_time: body.logout_time || current.logout_time
    });
    await applyToAttendance(request, times, decidedBy);
    await models.attendanceRequests.updateOne({ _id: request._id }, {
      $set: {
        ...update,
        status: APPROVED,
        in_date: times.in_date, login_time: times.login_time, out_date: times.out_date, logout_time: times.logout_time,
        date: times.in_date, punch_in: times.login_time, punch_out: times.logout_time
      }
    });
  }
  return { data: view(await models.attendanceRequests.findOne({ _id: request._id }).lean()) };
}

// Employee: withdraw a request that is still pending.
export async function cancelRequest(user, id) {
  if (!validId(id)) throw httpError(404, "Request not found.");
  const request = await models.attendanceRequests.findOne({ _id: id, empid: empId(user) }).lean();
  if (!request) throw httpError(404, "Request not found.");
  if ((Number(request.status) || PENDING) !== PENDING) throw httpError(409, "Only pending requests can be cancelled.");
  await models.attendanceRequests.findOneAndDelete({ _id: request._id });
  return { ok: true };
}

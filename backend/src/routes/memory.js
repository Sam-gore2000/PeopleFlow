import express from "express";
import { signUser, requireAuth } from "../middleware/auth.js";
import { secondsToHms, timeKey, todayKey } from "../utils/date.js";

const router = express.Router();

const memory = {
  notices: [
    {
      _id: "notice-local-1",
      heading: "Welcome to HRMS",
      descr: "Local memory mode is active because MongoDB is not running.",
      created_at: new Date(),
      createdAt: new Date()
    }
  ],
  employees: [
    {
      _id: "emp-testuser",
      fname: "Local Test User",
      empid: "testuser",
      email: "testuser@localhost.test",
      phno: "9999999900",
      pass: "test123",
      department: "QA",
      position: "Employee",
      jdate: "2026-09-22",
      bdate: "1999-09-22",
      report_manager: "Sample Manager",
      report_manager_id: "MGR001",
      status: "Offline"
    },
    {
      _id: "emp-manager",
      fname: "Sample Manager",
      empid: "MGR001",
      email: "manager@example.com",
      phno: "9999999998",
      pass: "manager123",
      department: "Operations",
      position: "Team Manager",
      jdate: "2025-12-01",
      bdate: "1995-09-22",
      status: "Offline"
    }
  ],
  admins: [{ _id: "admin-local", username: "admin", password: "admin123", email: "admin@example.com" }],
  attendance: [],
  breaks: [],
  leaves: [],
  bankDetails: [],
  payslips: [],
  holidays: [],
  queries: [],
  projects: [],
  teams: [],
  tasks: [],
  meetings: [],
  dprs: [],
  timesheets: [],
  userLogs: [],
  attendanceRequests: []
};

const resourceTitles = {
  admins: ["Admin Access", ["username", "email"]],
  employees: ["Employee Details", ["fname", "empid", "email", "phno", "department", "position", "report_manager_id", "status"]],
  leaves: ["Leave Details", ["fname", "empid", "leavet", "leave1", "leave2", "total_leave", "reason", "response", "status"]],
  attendance: ["Attendance Details", ["emp_id", "emp_name", "attendance_date", "punch_in", "punch_out", "work_seconds", "break_seconds", "status"]],
  breaks: ["Break Report", ["emp_id", "attendance_date", "break_start", "break_end", "break_seconds"]],
  bankDetails: ["Compensation Details", ["empid", "employeeName", "designation", "department", "tsalary", "bsalary", "accountNumber", "bankName", "branchName", "ifscCode"]],
  payslips: ["Payslip", ["empid", "employeeName", "month", "year", "tsalary", "netSalary", "created_at"]],
  holidays: ["Holidays", ["hdname", "hddate", "descr"]],
  notices: ["HR Notice", ["heading", "descr", "created_at"]],
  queries: ["Query", ["emp_id", "emp_name", "date", "subject", "message", "status"]],
  projects: ["Project Details", ["project", "description", "date", "duedate", "budget", "projectclient", "status", "app_type"]],
  teams: ["Department", ["team_name", "team_lead", "tmember_1", "tmember_2", "tmember_3", "tmembers"]],
  tasks: ["Task Details", ["emp_id", "emp_project", "emp_team", "task", "start_date", "due_date", "status", "priority"]],
  meetings: ["Team Meeting", ["organiser", "team", "emp", "date", "time", "link", "message"]],
  dprs: ["Daily Project Report", ["empid", "workmode", "pname", "wout", "status"]],
  timesheets: ["Timesheet", ["team", "project", "task", "date", "enddate", "note"]],
  userLogs: ["Login Details", ["emp_id", "emp_name", "date", "in_timestamp", "out_timestamp", "sessTime", "status"]],
  attendanceRequests: ["Attendance Requests", ["empid", "name", "date", "punch_in", "punch_out", "reason", "status"]]
};

function byId(collection, id) {
  return memory[collection]?.find((item) => item._id === id);
}

function currentEmployee(req) {
  return memory.employees.find((employee) => employee.empid === req.user?.empid);
}

function publicEmployee(employee) {
  if (!employee) return null;
  const { pass, ...safe } = employee;
  return safe;
}

function newId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

function matchesSearch(row, columns, q) {
  if (!q) return true;
  const needle = q.toLowerCase();
  return columns.some((column) => String(row[column] ?? "").toLowerCase().includes(needle));
}

router.post("/auth/login", (req, res) => {
  const { username, password, remember } = req.body;
  const admin = memory.admins.find((item) => item.username === username && item.password === password);
  if (admin) {
    const user = { id: admin._id, username: admin.username, role: "admin", name: "Admin" };
    const token = signUser(user);
    res.cookie("hrms_token", token, { httpOnly: true, sameSite: "lax", maxAge: remember ? 315360000000 : 43200000 });
    return res.json({ token, user, mode: "memory" });
  }

  const employee = memory.employees.find((item) => item.empid === username && item.pass === password);
  if (!employee) return res.status(401).json({ message: "Incorrect username or password" });

  employee.status = "Online";
  const sessionId = String(Math.floor(1000000 + Math.random() * 9000000));
  memory.userLogs.push({
    _id: newId("log"),
    session_id: sessionId,
    emp_id: employee.empid,
    emp_name: employee.fname,
    date: todayKey(),
    in_timestamp: timeKey(),
    status: "Online"
  });
  const role = employee.position === "Team Manager" ? "manager" : "employee";
  const user = {
    id: employee._id,
    username: employee.empid,
    empid: employee.empid,
    name: employee.fname,
    role,
    position: employee.position,
    department: employee.department,
    report_manager_id: employee.report_manager_id,
    session_id: sessionId
  };
  const token = signUser(user);
  res.cookie("hrms_token", token, { httpOnly: true, sameSite: "lax", maxAge: remember ? 315360000000 : 43200000 });
  res.json({ token, user, mode: "memory" });
});

router.post("/auth/logout", requireAuth, (req, res) => {
  const employee = currentEmployee(req);
  if (employee) employee.status = "Offline";
  const log = memory.userLogs.find((item) => item.session_id === req.user.session_id);
  if (log) {
    log.out_timestamp = timeKey();
    log.sessTime = secondsToHms(0);
    log.status = "Offline";
  }
  res.clearCookie("hrms_token");
  res.json({ ok: true });
});

router.get("/auth/me", requireAuth, (req, res) => res.json({ user: req.user, mode: "memory" }));

router.put("/auth/profile", requireAuth, (req, res) => {
  const employee = currentEmployee(req);
  if (!employee) return res.status(403).json({ message: "Employee profile required" });
  Object.assign(employee, req.body);
  res.json({ data: publicEmployee(employee) });
});

router.put("/auth/password", requireAuth, (req, res) => {
  const employee = currentEmployee(req);
  if (!employee || employee.pass !== req.body.currentPassword) return res.status(400).json({ message: "Current password is incorrect" });
  employee.pass = req.body.newPassword;
  res.json({ ok: true });
});

router.get("/dashboard", requireAuth, (req, res) => {
  if (req.user.role === "admin") {
    const today = todayKey();
    const present = memory.attendance.filter((row) => row.attendance_date === today && row.status === "Present").length;
    return res.json({
      mode: "memory",
      stats: [
        { label: "Total Employees", value: memory.employees.length, icon: "bi-people", meta: "+12 new hires" },
        { label: "Department", value: memory.teams.length, icon: "bi-diagram-3", meta: "Across organization" },
        { label: "Pending Approvals", value: memory.leaves.filter((row) => row.status === 0).length, icon: "bi-clipboard-check", meta: "-3 vs yesterday" },
        { label: "Present Employee", value: present, icon: "bi-check-circle", meta: "Today" },
        { label: "Absent Employee", value: Math.max(0, memory.employees.length - present), icon: "bi-x-circle", meta: "Today" },
        { label: "Total Holiday", value: memory.holidays.length, icon: "bi-tsunami", meta: "This year" }
      ],
      notices: memory.notices
    });
  }

  res.json({
    mode: "memory",
    stats: [
      { label: "Leave Balance", value: 18, icon: "bi-calendar4-week", meta: "Available" },
      { label: "Attendance", value: "0%", icon: "bi-people", meta: "Current cycle" },
      { label: "Work Hours", value: "0 Hrs", icon: "bi-clock-history", meta: "This period" },
      { label: "Performance", value: "4.5 / 5", icon: "bi-star-fill", meta: "This month" }
    ],
    notices: memory.notices
  });
});

router.get("/dashboard/notifications", requireAuth, (_req, res) => res.json({ notifications: [] }));

router.get("/attendance/today", requireAuth, (req, res) => {
  const row = memory.attendance.find((item) => item.emp_id === req.user.empid && item.attendance_date === todayKey());
  res.json(row || {});
});

router.post("/attendance/toggle", requireAuth, (req, res) => {
  const employee = currentEmployee(req);
  const today = todayKey();
  let row = memory.attendance.find((item) => item.emp_id === req.user.empid && item.attendance_date === today);
  if (!row) {
    row = {
      _id: newId("attendance"),
      emp_id: req.user.empid,
      emp_name: employee?.fname || req.user.name,
      attendance_date: today,
      punch_in: new Date(),
      status: "Present"
    };
    memory.attendance.push(row);
    return res.status(201).json({ action: "punchin", punch_in: row.punch_in, data: row });
  }
  if (row.punch_out) return res.json({ action: "already_completed", data: row });
  const activeBreak = memory.breaks.find((item) => item.emp_id === req.user.empid && item.attendance_date === today && item.break_start && !item.break_end);
  if (activeBreak) return res.status(400).json({ action: "break_active", message: "Please end your break before punching out." });
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(row.punch_in).getTime()) / 1000));
  row.punch_out = new Date();
  row.work_seconds = seconds;
  row.status = seconds < 4 * 3600 ? "Half Day" : "Present";
  res.json({ action: "punchout", data: row });
});

router.get("/attendance/breaks/today", requireAuth, (req, res) => {
  const rows = memory.breaks.filter((item) => item.emp_id === req.user.empid && item.attendance_date === todayKey());
  const active = rows.find((row) => row.break_start && !row.break_end);
  res.json({
    total_break_seconds: rows.reduce((sum, row) => sum + (row.break_seconds || 0), 0),
    active_break_start: active?.break_start || null
  });
});

router.post("/attendance/breaks/toggle", requireAuth, (req, res) => {
  const today = todayKey();
  const attendance = memory.attendance.find((item) => item.emp_id === req.user.empid && item.attendance_date === today && !item.punch_out);
  if (!attendance) return res.status(400).json({ action: "not_punched_in", message: "Punch in first before taking a break." });
  const active = memory.breaks.find((item) => item.emp_id === req.user.empid && item.attendance_date === today && item.break_start && !item.break_end);
  if (!active) {
    const row = { _id: newId("break"), emp_id: req.user.empid, attendance_date: today, break_start: new Date() };
    memory.breaks.push(row);
    return res.status(201).json({ action: "break_start", break_start: row.break_start, data: row });
  }
  active.break_end = new Date();
  active.break_seconds = Math.max(0, Math.floor((active.break_end.getTime() - new Date(active.break_start).getTime()) / 1000));
  res.json({ action: "break_end", seconds: active.break_seconds, data: active });
});

router.get("/resources/meta", requireAuth, (_req, res) => {
  res.json({
    resources: Object.entries(resourceTitles).map(([key, [title, columns]]) => ({ key, title, columns }))
  });
});

router.get("/resources/:resource", requireAuth, (req, res) => {
  const resource = req.params.resource;
  const rows = memory[resource];
  const meta = resourceTitles[resource];
  if (!rows || !meta) return res.status(404).json({ message: "Unknown resource" });
  const [title, columns] = meta;
  const data = rows.filter((row) => matchesSearch(row, columns, req.query.q));
  res.json({ data, total: data.length, columns, title, mode: "memory" });
});

router.get("/resources/:resource/:id", requireAuth, (req, res) => {
  const row = byId(req.params.resource, req.params.id);
  if (!row) return res.status(404).json({ message: "Record not found" });
  res.json({ data: row });
});

router.post("/resources/:resource", requireAuth, (req, res) => {
  const rows = memory[req.params.resource];
  if (!rows) return res.status(404).json({ message: "Unknown resource" });
  const data = { _id: newId(req.params.resource), ...req.body, createdAt: new Date() };
  rows.push(data);
  res.status(201).json({ data });
});

router.put("/resources/:resource/:id", requireAuth, (req, res) => {
  const row = byId(req.params.resource, req.params.id);
  if (!row) return res.status(404).json({ message: "Record not found" });
  Object.assign(row, req.body);
  res.json({ data: row });
});

router.patch("/resources/:resource/:id/status", requireAuth, (req, res) => {
  const row = byId(req.params.resource, req.params.id);
  if (!row) return res.status(404).json({ message: "Record not found" });
  row.status = req.body.status;
  if (req.body.response !== undefined) row.response = req.body.response;
  res.json({ data: row });
});

router.delete("/resources/:resource/:id", requireAuth, (req, res) => {
  const rows = memory[req.params.resource];
  if (!rows) return res.status(404).json({ message: "Unknown resource" });
  const index = rows.findIndex((row) => row._id === req.params.id);
  if (index >= 0) rows.splice(index, 1);
  res.json({ ok: true });
});

export default router;

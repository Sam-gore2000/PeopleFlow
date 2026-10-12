// Metadata for the generic /api/resources/:resource CRUD endpoints.
//  - model:         key in the models registry (models/index.js)
//  - adminOnly:     only admins may read or write
//  - employeeField: field holding the owning employee's empid (used to scope employees to their own rows)
//  - managerField:  field holding the reporting manager's empid (used to scope managers to their team)
//  - selfService:   non-admins may create and edit rows (within their scope); otherwise writes are admin-only
//  - approvable:    managers (and admins) may approve/reject via PATCH /:id/status
//  - employeeMap:   record field -> employee field, always copied from the employee record on save
//                   (so the name/manager on a row always match the Employee ID; nobody can type a different one)
//  - employeeDefaults: record field -> employee field, copied only when the field is left empty
//  - hiddenFields:  never returned by the API (password hashes)
//  - passwordField: hashed with bcrypt on save; left unchanged when submitted empty
//  - searchFields:  extra fields the search box looks in, besides the columns
//  - requiredFields: must be filled on create and can't be emptied on edit
//  - requiredOnCreate: must be filled when creating only (e.g. the password)
//  - uniqueFields:  no two rows may share these values (case-insensitive)
//  - yearField:     date field (YYYY-MM-DD text) the ?year=2026 filter applies to
//  - ownOnly:       private to the person (salary, bank details): managers and employees only ever
//                   see their own rows; only admins see everyone's
// Deleting is always admin-only.
export const resourceConfig = {
  admins: {
    model: "admins",
    adminOnly: true,
    title: "Admin Access",
    hiddenFields: ["password"],
    requiredFields: ["username"],
    requiredOnCreate: ["password"],
    uniqueFields: ["username"],
    passwordField: "password",
    columns: ["username", "email"]
  },
  employees: {
    model: "employees",
    adminOnly: true,
    title: "Employee Details",
    hiddenFields: ["pass"],
    requiredFields: ["empid", "email", "department", "position"],
    requiredOnCreate: ["pass"],
    uniqueFields: ["empid", "email"],
    passwordField: "pass",
    searchFields: ["username", "report_manager"],
    columns: ["fname", "empid", "email", "phno", "department", "position", "report_manager_id", "status"]
  },
  leaves: {
    model: "leaves",
    selfService: true,
    approvable: true,
    title: "Leave Details",
    employeeField: "empid",
    managerField: "report_manager_id",
    employeeMap: { fname: "fname", report_manager_id: "report_manager_id" },
    columns: ["fname", "empid", "leavet", "leave_duration", "leave1", "leave2", "total_leave", "reason", "response", "status"]
  },
  attendance: {
    model: "attendance",
    title: "Attendance Details",
    employeeField: "emp_id",
    managerField: "report_manager_id",
    employeeMap: { emp_name: "fname", report_manager_id: "report_manager_id", department: "department" },
    columns: ["emp_id", "emp_name", "attendance_date", "punch_in", "punch_out", "work_seconds", "break_seconds", "status"]
  },
  breaks: {
    model: "breaks",
    adminOnly: true,
    title: "Break Report",
    employeeField: "emp_id",
    employeeMap: { emp_name: "fname" },
    columns: ["emp_id", "emp_name", "attendance_date", "break_start", "break_end", "break_seconds"]
  },
  bankDetails: {
    model: "bankDetails",
    title: "Compensation Details",
    employeeField: "empid",
    ownOnly: true,
    employeeMap: { employeeName: "fname" },
    employeeDefaults: { designation: "position", department: "department" },
    columns: ["empid", "employeeName", "designation", "department", "tsalary", "bsalary", "accountNumber", "bankName", "branchName", "ifscCode"]
  },
  payslips: {
    model: "payslips",
    title: "Payslip",
    employeeField: "empid",
    ownOnly: true,
    yearField: "date",
    employeeMap: { employeeName: "fname" },
    // month / year / netSalary are filled from the payslip date and Net Payable Amount on save.
    searchFields: ["date", "designation", "department"],
    columns: ["empid", "employeeName", "month", "year", "tsalary", "netSalary", "createdAt"]
  },
  holidays: {
    model: "holidays",
    title: "Holidays",
    columns: ["hdname", "hddate", "descr"]
  },
  notices: {
    model: "notices",
    title: "HR Notice",
    columns: ["heading", "descr", "created_at"]
  },
  queries: {
    model: "queries",
    selfService: true,
    approvable: true,
    title: "Query",
    employeeField: "emp_id",
    employeeMap: { emp_name: "fname" },
    columns: ["emp_id", "emp_name", "date", "subject", "message", "status"]
  },
  projects: {
    model: "projects",
    adminOnly: true,
    title: "Project Details",
    columns: ["project", "description", "date", "duedate", "budget", "projectclient", "status", "app_type"]
  },
  teams: {
    model: "teams",
    adminOnly: true,
    title: "Department",
    columns: ["team_name", "team_lead", "tmember_1", "tmember_2", "tmember_3", "tmembers"]
  },
  tasks: {
    model: "tasks",
    title: "Task Details",
    employeeField: "emp_id",
    employeeMap: { emp_name: "fname" },
    searchFields: ["emp_name"],
    columns: ["emp_id", "emp_project", "emp_team", "task", "start_date", "due_date", "status", "priority"]
  },
  meetings: {
    model: "meetings",
    selfService: true,
    title: "Team Meeting",
    columns: ["organiser", "team", "emp", "date", "time", "link", "message"]
  },
  dprs: {
    model: "dprs",
    selfService: true,
    title: "Daily Project Report",
    employeeField: "empid",
    employeeMap: { emp_name: "fname" },
    searchFields: ["emp_name"],
    columns: ["empid", "workmode", "pname", "wout", "status"]
  },
  timesheets: {
    model: "timesheets",
    selfService: true,
    title: "Timesheet",
    employeeField: "emp_id",
    employeeMap: { emp_name: "fname" },
    columns: ["emp_id", "emp_name", "team", "project", "task", "date", "enddate", "note"]
  },
  userLogs: {
    model: "userLogs",
    adminOnly: true,
    title: "Login Details",
    employeeField: "emp_id",
    columns: ["emp_id", "emp_name", "date", "in_timestamp", "out_timestamp", "sessTime", "status"]
  },
  attendanceRequests: {
    model: "attendanceRequests",
    selfService: true,
    approvable: true,
    title: "Attendance Requests",
    employeeField: "empid",
    managerField: "report_manager_id",
    employeeMap: { name: "fname", report_manager_id: "report_manager_id" },
    columns: ["empid", "name", "date", "punch_in", "punch_out", "reason", "status"]
  }
};

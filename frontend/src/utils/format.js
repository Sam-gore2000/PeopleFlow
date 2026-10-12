export function toLabel(key) {
  return key.replace(/_/g, " ").replace(/([A-Z])/g, " $1").replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatValue(value) {
  if (value === undefined || value === null || value === "") return "-";
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return value.length > 80 ? `${value.slice(0, 80)}...` : value;
  if (value instanceof Date) return value.toLocaleString();
  if (typeof value === "object") {
    const date = new Date(value);
    return date.toString() !== "Invalid Date" ? date.toLocaleString() : JSON.stringify(value);
  }
  return String(value);
}

export function statusText(value) {
  if (value === 0 || value === "0" || value === undefined) return "Pending";
  if (value === 1 || value === "1") return "Approved";
  if (value === 2 || value === "2") return "Rejected";
  return value;
}

export function secondsToClock(seconds = 0) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = String(Math.floor(total / 3600)).padStart(2, "0");
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
  const s = String(total % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

// 27540 -> "7h 39m", 540 -> "9m", 42 -> "42s"
export function formatDuration(seconds = 0) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  if (m) return `${m}m`;
  return total ? `${total}s` : "0m";
}

// ISO date-time -> "09:42 AM" in the viewer's locale.
export function formatTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "-" : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// "2026-09-30" -> "Wed, 30 Sep"
export function formatDay(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short" });
}

// Table headings for common database field names, used when a page doesn't set its own.
export const DEFAULT_COLUMN_LABELS = {
  fname: "Employee Name",
  empid: "Employee ID",
  emp_id: "Employee ID",
  emp_name: "Employee Name",
  employeeName: "Employee Name",
  name: "Employee Name",
  phno: "Phone",
  email: "Email",
  report_manager_id: "Manager ID",
  report_manager: "Report Manager",
  jdate: "Joining Date",
  bdate: "Birth Date",
  add: "Address",
  padd: "Permanent Address",
  edu: "Education",
  leavet: "Leave Type",
  leave1: "From",
  leave2: "To",
  total_leave: "Days",
  attendance_date: "Date",
  work_seconds: "Work Hours",
  break_seconds: "Break Time",
  tsalary: "Total Salary",
  bsalary: "Basic Salary",
  netSalary: "Net Salary",
  ifscCode: "IFSC Code",
  hdname: "Holiday",
  hddate: "Date",
  descr: "Description",
  created_at: "Created On",
  createdAt: "Created On",
  in_timestamp: "Login Time",
  out_timestamp: "Logout Time",
  sessTime: "Session Time",
  pname: "Project",
  wout: "Work Output",
  workmode: "Work Mode",
  emp_project: "Project",
  emp_team: "Team",
  app_type: "App Type",
  projectclient: "Client",
  duedate: "Due Date",
  enddate: "End Date",
  tmembers: "Members"
};

// Heading for a table column: the page's own columnLabels, then the form field's label,
// then the defaults above, then the field name tidied up ("report_status" -> "Report Status").
export function columnLabel(column, { columnLabels = {}, fields = [] } = {}) {
  const formLabel = fields?.find((field) => field.name === column)?.label;
  return columnLabels?.[column] || formLabel || DEFAULT_COLUMN_LABELS[column] || toLabel(column);
}

import { formatDuration, formatTime } from "../../utils/format.js";

const hours = (seconds) => (Math.max(0, seconds || 0) / 3600).toFixed(2);

function csvCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function download(filename, rows) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }); // BOM so Excel reads UTF-8
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// One row per employee for the month.
export function downloadSummaryCsv(report, employees) {
  const rows = [[
    "Employee ID", "Employee Name", "Department", "Days Present", "Half Days", "Missed Punch-Out",
    "Work Hours", "Work (h:m)", "Break Hours", "Break (h:m)", "Breaks Taken", "Avg Work / Day"
  ]];
  for (const e of employees) {
    rows.push([
      e.emp_id, e.emp_name, e.department, e.days_present, e.half_days, e.missed_punch_out,
      hours(e.work_seconds), formatDuration(e.work_seconds), hours(e.break_seconds), formatDuration(e.break_seconds),
      e.break_count, formatDuration(e.avg_work_seconds)
    ]);
  }
  download(`work-break-summary-${report.month}.csv`, rows);
}

// One row per employee per day, with every break session listed.
export function downloadDailyCsv(report, employees) {
  const rows = [[
    "Employee ID", "Employee Name", "Department", "Date", "Punch In", "Punch Out", "Status",
    "Work Hours", "Work (h:m)", "Break Hours", "Break (h:m)", "Breaks Taken", "Break Sessions"
  ]];
  for (const e of employees) {
    for (const day of e.days) {
      const sessions = day.breaks
        .map((b) => `${formatTime(b.start)}-${b.active ? "running" : formatTime(b.end)} (${formatDuration(b.seconds)})`)
        .join("; ");
      rows.push([
        e.emp_id, e.emp_name, e.department, day.date, formatTime(day.punch_in), formatTime(day.punch_out), day.status,
        hours(day.work_seconds), formatDuration(day.work_seconds), hours(day.break_seconds), formatDuration(day.break_seconds),
        day.break_count, sessions
      ]);
    }
  }
  download(`work-break-daily-${report.month}.csv`, rows);
}

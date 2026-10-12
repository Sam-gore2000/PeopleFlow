import { useEffect, useMemo, useState } from "react";
import { ROLES } from "../../../constants/app.js";
import { EmployeePicker } from "../../../components/forms/EmployeePicker.jsx";
import { formatDuration, formatTime } from "../../../utils/format.js";
import { LeaveBalanceCard } from "../../leave/LeaveBalanceCard.jsx";
import { attendanceApi } from "../attendanceApi.js";

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const STATUS_CLASS = { Present: "present", "Half Day": "half", Leave: "leave", Absent: "absent", Holiday: "holiday", "Week Off": "weekoff" };
const LEGEND = [
  { key: "today", label: "Today" },
  { key: "present", label: "Present" },
  { key: "half", label: "Half Day" },
  { key: "leave", label: "Leave" },
  { key: "absent", label: "Absent" },
  { key: "holiday", label: "Holiday" },
  { key: "weekoff", label: "Week Off" }
];

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function shiftMonth(month, delta) {
  const [year, number] = month.split("-").map(Number);
  const date = new Date(year, number - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

const monthTitle = (month) => new Date(`${month}-01T00:00:00`).toLocaleDateString([], { month: "long", year: "numeric" });
const longDate = (date) => new Date(`${date}T00:00:00`).toLocaleDateString([], { weekday: "long", day: "numeric", month: "long", year: "numeric" });

// 6-week grid: leading days of the previous month, the month, trailing days of the next month.
function buildGrid(month, days) {
  const [year, number] = month.split("-").map(Number);
  const first = new Date(year, number - 1, 1);
  const cells = [];
  for (let i = first.getDay(); i > 0; i -= 1) cells.push({ outside: true, label: new Date(year, number - 1, 1 - i).getDate() });
  days.forEach((day) => cells.push({ ...day, label: Number(day.date.slice(8)) }));
  let next = 1;
  while (cells.length % 7 !== 0) cells.push({ outside: true, label: next++ });
  return cells;
}

function DayDetails({ day, onRegularize }) {
  if (!day) return <p className="cal-hint">Select a date to see its details.</p>;
  const rows = [];
  if (day.punch_in) rows.push(["Punch In", formatTime(day.punch_in)]);
  if (day.punch_in) rows.push(["Punch Out", day.working_now ? "Still working" : day.missed_punch_out ? "Missed punch out" : formatTime(day.punch_out)]);
  if (day.punch_in) rows.push(["Work Hours", formatDuration(day.work_seconds)]);
  if (day.break_seconds) rows.push(["Break Time", formatDuration(day.break_seconds)]);
  if (day.holiday_name) rows.push(["Holiday", day.holiday_name]);
  if (day.leave_type) rows.push(["Leave", day.leave_type]);
  const status = day.status || (day.is_today ? "Not punched in yet" : "No record");
  return (
    <div className="cal-details">
      <div className="cal-details-head">
        <strong>{longDate(day.date)}</strong>
        <span className={`cal-pill ${STATUS_CLASS[day.status] || ""}`}>{status}</span>
      </div>
      {rows.length > 0 && (
        <dl>{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      )}
      {onRegularize && !day.working_now && (day.status === "Absent" || day.missed_punch_out || day.status === "Present" || day.status === "Half Day" || (day.is_today && !day.status)) && (
        <button type="button" className="btn btn-outline-secondary btn-sm cal-regularize-day" onClick={() => onRegularize(day)}>
          <i className="bi bi-clock-history" /> Regularize this day
        </button>
      )}
    </div>
  );
}

// Managers: "My Attendance" button plus a dropdown of team members.
function TeamPicker({ user, team, selected, onSelect }) {
  const viewingSelf = selected === user.empid;
  return (
    <div className="cal-team">
      <span className="cal-team-label">Team attendance</span>
      <div className="cal-team-row">
        <button type="button" className={`cal-team-chip ${viewingSelf ? "active" : ""}`} onClick={() => onSelect(user.empid)} aria-pressed={viewingSelf}>
          <i className="bi bi-person" /> My Attendance
        </button>
        <select
          className={`form-select cal-team-select ${viewingSelf ? "" : "active"}`}
          value={viewingSelf ? "" : selected}
          onChange={(event) => onSelect(event.target.value || user.empid)}
          aria-label="Team member"
        >
          <option value="">Select team member ({team.length})</option>
          {team.map((member) => <option key={member.empid} value={member.empid}>{member.fname} ({member.empid})</option>)}
        </select>
      </div>
    </div>
  );
}

// Month calendar of Present / Half Day / Leave / Absent / Holiday / Week Off (Saturday & Sunday).
// Employees see their own; managers their own and their team's; admins can pick any employee.
// onRegularize(day?) shows "Regularize Attendance" for the person's own calendar; refreshKey reloads it.
export function AttendanceCalendar({ user, onRegularize, refreshKey = 0 }) {
  const isAdmin = user.role === ROLES.ADMIN;
  const isManager = user.role === ROLES.MANAGER;
  const [team, setTeam] = useState([]);
  const [month, setMonth] = useState(currentMonth);
  const [empId, setEmpId] = useState(isAdmin ? "" : user.empid || "");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (!isManager) return;
    attendanceApi.team().then((result) => setTeam(result.members || [])).catch(() => setTeam([]));
  }, [isManager]);

  const showsCalendar = !isAdmin || Boolean(empId);
  const viewingOther = Boolean(empId) && empId !== user.empid;

  useEffect(() => {
    if (!showsCalendar) return undefined;
    let alive = true;
    setLoading(true);
    setError("");
    attendanceApi.calendar(month, isAdmin || viewingOther ? empId : "")
      .then((result) => { if (alive) { setData(result); setSelected(result.days.find((day) => day.is_today) || null); } })
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [month, empId, isAdmin, showsCalendar, viewingOther, refreshKey]);

  const cells = useMemo(() => (data && data.month === month ? buildGrid(month, data.days) : []), [data, month]);
  const atCurrentMonth = month >= currentMonth();

  return (
    <div className="card cal-card">
      <div className="card-body">
        <div className="cal-top">
          <div>
            <h5 className="cal-title">Attendance Calendar</h5>
          </div>
          {onRegularize && !isAdmin && !viewingOther && (
            <button type="button" className="btn btn-success cal-regularize" onClick={() => onRegularize(null)}>
              <i className="bi bi-clock-history" /> Regularize Attendance
            </button>
          )}
          {isAdmin && (
            <div className="cal-picker">
              <EmployeePicker onPick={(employee) => setEmpId(employee.empid)} id="calendar-employee-options" />
            </div>
          )}
        </div>

        {isManager && team.length > 0 && <TeamPicker user={user} team={team} selected={empId} onSelect={setEmpId} />}

        {!showsCalendar ? (
          <p className="cal-hint cal-empty">Type an Employee ID or name to see their attendance calendar.</p>
        ) : (
          <div className="cal-layout">
            <div className="cal-main">
              {(isAdmin || viewingOther) && data?.employee && <p className="cal-who">{data.employee.name} · {data.employee.empid}{data.employee.department ? ` · ${data.employee.department}` : ""}</p>}
              <div className="cal-nav">
                <button type="button" onClick={() => setMonth((value) => shiftMonth(value, -1))} aria-label="Previous month"><i className="bi bi-chevron-left" /></button>
                <span>{monthTitle(month)}</span>
                <button type="button" onClick={() => setMonth((value) => shiftMonth(value, 1))} disabled={atCurrentMonth} aria-label="Next month"><i className="bi bi-chevron-right" /></button>
              </div>

              <div className={`cal-grid ${loading ? "is-loading" : ""}`} role="grid" aria-label={`Attendance for ${monthTitle(month)}`}>
                {WEEKDAYS.map((name) => <div className="cal-weekday" key={name} role="columnheader">{name}</div>)}
                {cells.map((cell, index) => (cell.outside ? (
                  <div className="cal-cell outside" key={`o${index}`}><span className="cal-day">{cell.label}</span></div>
                ) : (
                  <button
                    type="button"
                    key={cell.date}
                    className={`cal-cell ${STATUS_CLASS[cell.status] || ""} ${cell.is_today ? "today" : ""} ${selected?.date === cell.date ? "selected" : ""}`}
                    onClick={() => setSelected(cell)}
                    title={[cell.status, cell.holiday_name].filter(Boolean).join(" · ") || undefined}
                  >
                    <span className="cal-day">{cell.label}</span>
                  </button>
                )))}
              </div>

              <div className="cal-legend">
                {LEGEND.map((item) => <span key={item.key}><i className={`cal-swatch ${item.key}`} />{item.label}</span>)}
              </div>
              {error && <p className="cal-error">{error}</p>}
            </div>

            <div className="cal-side">
              {data && (
                <div className="cal-summary">
                  <div><strong>{data.summary.present}</strong><span>Present</span></div>
                  <div><strong>{data.summary.half_day}</strong><span>Half Day</span></div>
                  <div><strong>{data.summary.leave}</strong><span>Leave</span></div>
                  <div><strong>{data.summary.absent}</strong><span>Absent</span></div>
                  <div><strong>{data.summary.holiday}</strong><span>Holiday</span></div>
                  <div><strong>{data.summary.week_off}</strong><span>Week Off</span></div>
                  <div className="cal-summary-wide"><strong>{data.summary.working_days}</strong><span>Working Days</span></div>
                </div>
              )}
              <DayDetails day={selected} onRegularize={onRegularize && !isAdmin && !viewingOther ? onRegularize : null} />
              {data?.employee && <LeaveBalanceCard empId={viewingOther || isAdmin ? data.employee.empid : ""} compact editable={isAdmin} />}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Alert } from "../../components/common/Alert.jsx";
import { PageTitle } from "../../components/common/PageTitle.jsx";
import { Pagination } from "../../components/tables/Pagination.jsx";
import { ROLES } from "../../constants/app.js";
import { formatDay, formatDuration, formatTime } from "../../utils/format.js";
import { attendanceApi } from "./attendanceApi.js";
import { downloadDailyCsv, downloadSummaryCsv } from "./reportExport.js";
import { ScrollTable } from "../../components/tables/ScrollTable.jsx";

const LIVE_REFRESH_MS = 60_000;
const PAGE_SIZE = 10;

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

const SORTS = {
  name: (a, b) => (a.emp_name || "").localeCompare(b.emp_name || ""),
  work: (a, b) => b.work_seconds - a.work_seconds,
  break: (a, b) => b.break_seconds - a.break_seconds,
  days: (a, b) => b.days_present - a.days_present
};

function StatusBadge({ status }) {
  const tone = status === "Working" || status === "On Break" ? "live" : status === "Present" ? "ok" : "warn";
  return <span className={`report-badge ${tone}`}>{status}</span>;
}

function StatTile({ icon, label, value, meta }) {
  return (
    <div className="report-stat">
      <div className="report-stat-icon"><i className={`bi ${icon}`} /></div>
      <p>{label}</p>
      <h3>{value}</h3>
      <span>{meta}</span>
    </div>
  );
}

function BreakSessions({ breaks }) {
  if (!breaks.length) return <span className="text-muted-soft">No breaks</span>;
  return (
    <div className="break-chips">
      {breaks.map((item, index) => (
        <span key={index} className={`break-chip ${item.active ? "running" : ""}`} title={item.auto_closed ? "Closed automatically" : undefined}>
          {formatTime(item.start)} - {item.active ? "now" : formatTime(item.end)} <strong>{formatDuration(item.seconds)}</strong>
        </span>
      ))}
    </div>
  );
}

function DailyDetail({ employee }) {
  if (!employee.days.length) return <p className="report-empty">No attendance recorded this month.</p>;
  return (
    <ScrollTable>
      <table className="table report-daily">
        <thead>
          <tr><th>Date</th><th>Punch In</th><th>Punch Out</th><th>Work Hours</th><th>Break Time</th><th>Break Sessions</th><th>Status</th></tr>
        </thead>
        <tbody>
          {employee.days.map((day) => (
            <tr key={day.date}>
              <td>{formatDay(day.date)}</td>
              <td>{formatTime(day.punch_in)}</td>
              <td>{day.live ? "-" : formatTime(day.punch_out)}</td>
              <td><strong>{formatDuration(day.work_seconds)}</strong></td>
              <td>{formatDuration(day.break_seconds)} <small>({day.break_count})</small></td>
              <td><BreakSessions breaks={day.breaks} /></td>
              <td><StatusBadge status={day.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </ScrollTable>
  );
}

// Admin: every employee's working hours and breaks for a month, with a day-by-day drill-down.
// Manager: the same for their team (and themselves) - the server limits the rows.
export function BreakReportPage({ user }) {
  const isManager = user?.role === ROLES.MANAGER;
  const [month, setMonth] = useState(currentMonth);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [sort, setSort] = useState("name");
  const [onlyActive, setOnlyActive] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setReport(await attendanceApi.monthlyReport(month));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { load(); }, [load]);

  // While someone is still working today, keep the figures fresh.
  const hasLive = Boolean(report?.employees?.some((employee) => employee.live));
  useEffect(() => {
    if (!hasLive) return undefined;
    const timer = setInterval(load, LIVE_REFRESH_MS);
    return () => clearInterval(timer);
  }, [hasLive, load]);

  const departments = useMemo(
    () => [...new Set((report?.employees || []).map((employee) => employee.department).filter(Boolean))].sort(),
    [report]
  );

  const employees = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (report?.employees || [])
      .filter((employee) => !department || employee.department === department)
      .filter((employee) => !onlyActive || employee.days.length > 0)
      .filter((employee) => !term || `${employee.emp_name} ${employee.emp_id}`.toLowerCase().includes(term))
      .sort(SORTS[sort]);
  }, [report, search, department, onlyActive, sort]);

  // Back to page 1 whenever the list changes shape.
  useEffect(() => { setPage(1); }, [search, department, onlyActive, sort, month]);
  const pageRows = employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totals = useMemo(() => {
    const work = employees.reduce((sum, employee) => sum + employee.work_seconds, 0);
    const breaks = employees.reduce((sum, employee) => sum + employee.break_seconds, 0);
    const workedDays = employees.reduce((sum, employee) => sum + employee.days.filter((day) => day.work_seconds > 0).length, 0);
    const breakCount = employees.reduce((sum, employee) => sum + employee.break_count, 0);
    return {
      tracked: employees.filter((employee) => employee.days.length).length,
      work,
      breaks,
      breakCount,
      avgDay: workedDays ? Math.round(work / workedDays) : 0,
      workedDays
    };
  }, [employees]);

  return (
    <>
      <PageTitle>{isManager ? "Team Break & Work Report" : "Break & Work Report"}</PageTitle>

      <div className="card report-card">
        <div className="card-body">
          <div className="report-toolbar">
            <label>
              <span>Month</span>
              <input type="month" className="form-control" value={month} max={currentMonth()} onChange={(event) => setMonth(event.target.value || currentMonth())} />
            </label>
            <label className="report-search">
              <span>Employee</span>
              <input className="form-control" placeholder="Search name or ID" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label>
              <span>Department</span>
              <select className="form-select" value={department} onChange={(event) => setDepartment(event.target.value)}>
                <option value="">All departments</option>
                {departments.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
            </label>
            <label>
              <span>Sort by</span>
              <select className="form-select" value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="name">Name</option>
                <option value="work">Most work hours</option>
                <option value="break">Most break time</option>
                <option value="days">Most days present</option>
              </select>
            </label>
            <label className="report-check">
              <input type="checkbox" checked={onlyActive} onChange={(event) => setOnlyActive(event.target.checked)} />
              <span>Only with attendance</span>
            </label>
            <div className="report-actions">
              <button className="btn btn-outline-secondary" onClick={load} disabled={loading}>
                <i className={`bi bi-arrow-clockwise ${loading ? "spin" : ""}`} /> Refresh
              </button>
              <button className="btn btn-outline-secondary" onClick={() => downloadSummaryCsv(report, employees)} disabled={!employees.length}>
                <i className="bi bi-download" /> Summary CSV
              </button>
              <button className="btn report-primary" onClick={() => downloadDailyCsv(report, employees)} disabled={!employees.length}>
                <i className="bi bi-file-earmark-spreadsheet" /> Daily CSV
              </button>
            </div>
          </div>

          <Alert type="danger" className="mt-3 mb-0">{error}</Alert>

          <div className="report-stats">
            <StatTile icon="bi-people" label={isManager ? "Team Members Tracked" : "Employees Tracked"} value={`${totals.tracked} / ${employees.length}`} meta="with attendance this month" />
            <StatTile icon="bi-briefcase" label="Total Work Hours" value={formatDuration(totals.work)} meta={`${totals.workedDays} working days logged`} />
            <StatTile icon="bi-cup-hot" label="Total Break Time" value={formatDuration(totals.breaks)} meta={`${totals.breakCount} breaks taken`} />
            <StatTile icon="bi-graph-up" label="Avg Work / Day" value={formatDuration(totals.avgDay)} meta="per employee per day" />
          </div>

          {hasLive && <p className="report-live-note"><span className="live-dot" /> Some employees are working right now. Figures refresh every minute.</p>}

          <ScrollTable>
            <table className="table report-table">
              <thead>
                <tr>
                  <th>Employee</th><th>Days Present</th><th>Half Days</th><th>Missed Punch-Out</th>
                  <th>Work Hours</th><th>Break Time</th><th>Breaks</th><th>Avg / Day</th><th />
                </tr>
              </thead>
              <tbody>
                {loading && !report && <tr><td colSpan={9} className="text-center py-4">Loading report...</td></tr>}
                {!loading && report && employees.length === 0 && <tr><td colSpan={9} className="text-center py-4">No employees match these filters.</td></tr>}
                {pageRows.map((employee) => {
                  const open = expanded === employee.emp_id;
                  return (
                    <Fragment key={employee.emp_id}>
                      <tr className={open ? "is-open" : ""}>
                        <td>
                          <div className="report-person">
                            <strong>{employee.emp_name}</strong>
                            <small>{employee.emp_id}{employee.department ? ` · ${employee.department}` : ""}</small>
                          </div>
                        </td>
                        <td>{employee.days_present}</td>
                        <td>{employee.half_days}</td>
                        <td>{employee.missed_punch_out ? <span className="report-badge warn">{employee.missed_punch_out}</span> : 0}</td>
                        <td><strong>{formatDuration(employee.work_seconds)}</strong></td>
                        <td>{formatDuration(employee.break_seconds)}</td>
                        <td>{employee.break_count}</td>
                        <td>{formatDuration(employee.avg_work_seconds)}</td>
                        <td className="text-end">
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => setExpanded(open ? null : employee.emp_id)} disabled={!employee.days.length}>
                            {open ? "Hide" : "Daily"} <i className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"}`} />
                          </button>
                        </td>
                      </tr>
                      {open && (
                        <tr className="report-detail-row">
                          <td colSpan={9}><DailyDetail employee={employee} /></td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </ScrollTable>
          <Pagination page={page} pageSize={PAGE_SIZE} total={employees.length} onChange={setPage} label="employees" />
        </div>
      </div>
    </>
  );
}

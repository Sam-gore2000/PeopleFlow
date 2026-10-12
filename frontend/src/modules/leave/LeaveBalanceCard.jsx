import { useEffect, useState } from "react";
import { api } from "../../services/api.js";
import { useDialog } from "../../components/feedback/DialogProvider.jsx";
import { attendanceApi } from "../attendance/attendanceApi.js";

const shortDate = (value) => new Date(value).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
const signed = (value) => (value > 0 ? `+${value}` : String(value));

// Admin form: set the balance to a number, or add / remove days, with a reason.
function AdjustForm({ balance, onSaved, onCancel }) {
  const [mode, setMode] = useState("set");
  const [days, setDays] = useState(balance.balance ?? "");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const dialog = useDialog();

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const result = await attendanceApi.adjustLeaveBalance({ emp_id: balance.empid, mode, days, reason });
      onSaved(result.data);
      dialog.success("Leave balance updated", `Available balance is now ${result.data.balance} days.`);
    } catch (error) {
      dialog.error("Couldn't update balance", error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="lb-adjust" onSubmit={submit}>
      <div className="lb-modes" role="radiogroup" aria-label="Adjustment type">
        <button type="button" role="radio" aria-checked={mode === "set"} className={mode === "set" ? "active" : ""} onClick={() => { setMode("set"); setDays(balance.balance ?? ""); }}>Set balance to</button>
        <button type="button" role="radio" aria-checked={mode === "add"} className={mode === "add" ? "active" : ""} onClick={() => { setMode("add"); setDays(""); }}>Add / remove days</button>
      </div>
      <label>
        <span>{mode === "set" ? "New available balance (days)" : "Days to add (use - to remove, e.g. -1.5)"}</span>
        <input className="form-control" type="number" step="0.5" min={mode === "set" ? 0 : undefined} value={days} onChange={(event) => setDays(event.target.value)} required />
      </label>
      <label>
        <span>Reason</span>
        <input className="form-control" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Carry forward from previous HRM" maxLength={300} required />
      </label>
      <div className="lb-adjust-actions">
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button type="submit" className="btn btn-success" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
      </div>
    </form>
  );
}

// Paid leave: earned (1.5 per month from joining) + admin adjustments - used (approved) = available.
// empId: whose balance (blank = the signed-in user). editable: admin may adjust it.
export function LeaveBalanceCard({ empId = "", refreshKey = 0, compact = false, editable = false }) {
  const dialog = useDialog();
  const [balance, setBalance] = useState(null);
  const [error, setError] = useState("");
  const [adjusting, setAdjusting] = useState(false);

  useEffect(() => {
    let alive = true;
    setAdjusting(false);
    attendanceApi.leaveBalance(empId)
      .then((result) => { if (alive) { setBalance(result.data); setError(""); } })
      .catch((err) => alive && setError(err.message));
    return () => { alive = false; };
  }, [empId, refreshKey]);

  if (error) return compact ? null : <p className="lb-note">{error}</p>;
  if (!balance) return null;

  async function removeAdjustment(item) {
    const ok = await dialog.confirm({ title: "Remove this adjustment?", text: `${item.mode === "opening" ? `Opening balance of ${item.days}` : `${signed(item.days)} days`} ("${item.reason}") will be removed and the balance recalculated.`, confirmText: "Yes, remove" });
    if (!ok) return;
    try {
      const result = await api(`/attendance/leave-balance/adjustments/${item._id}`, { method: "DELETE" });
      setBalance(result.data);
      dialog.success("Adjustment removed", `Available balance is now ${result.data.available ?? result.data.balance} days.`);
    } catch (err) {
      dialog.error("Couldn't remove", err.message);
    }
  }

  const adjustButton = editable && !adjusting && (
    <button type="button" className="btn btn-outline-secondary btn-sm lb-adjust-btn" onClick={() => setAdjusting(true)}><i className="bi bi-pencil-square" /> Adjust</button>
  );
  const form = adjusting && <AdjustForm balance={balance} onSaved={(next) => { setBalance(next); setAdjusting(false); }} onCancel={() => setAdjusting(false)} />;

  if (balance.balance === null) {
    return (
      <div className={`lb-card ${compact ? "compact" : ""}`}>
        <div className="lb-head"><strong>Paid Leave Balance</strong>{adjustButton}</div>
        <p className="lb-note"><i className="bi bi-info-circle" /> {balance.note}.{editable ? " Add the joining date in Employee Details, or set a balance with Adjust." : " HR can add it in Employee Details."}</p>
        {form}
      </div>
    );
  }

  const items = [
    { label: balance.on_probation ? "Available now" : "Available", value: balance.available ?? balance.balance, main: true },
    ...(balance.opening ? [{ label: `Opening (${shortDate(`${balance.opening.as_of}T00:00:00`)})`, value: balance.opening.days }] : []),
    { label: balance.opening ? "Earned since" : `Earned in ${balance.year}`, value: balance.opening ? Math.max(0, Math.round((balance.earned - balance.opening.days) * 100) / 100) : balance.earned },
    ...(balance.adjusted ? [{ label: "Adjusted", value: signed(balance.adjusted) }] : []),
    { label: `Used in ${balance.year}`, value: balance.used },
    { label: compact ? "Pending" : "Pending approval", value: balance.pending }
  ];
  return (
    <div className={`lb-card ${compact ? "compact" : ""}`}>
      <div className="lb-head">
        <div>
          <strong>Paid Leave Balance · {balance.year}</strong>
          <span>{balance.opening
            ? `Opening balance of ${balance.opening.days} on ${shortDate(`${balance.opening.as_of}T00:00:00`)}, then ${balance.per_month} per month`
            : balance.earned_from
              ? `${balance.per_month} days per month from ${shortDate(`${balance.earned_from}T00:00:00`)}${balance.joined && balance.joined < balance.year_start ? ` (joined ${shortDate(`${balance.joined}T00:00:00`)})` : ""}`
              : "Set manually (no joining date)"}</span>
        </div>
        {adjustButton}
      </div>
      {balance.on_probation && (
        <p className="lb-probation" role="note">
          <i className="bi bi-hourglass-split" /> {editable ? "On probation" : "You're on probation"} until <strong>{shortDate(`${balance.probation_ends}T00:00:00`)}</strong>.
          {" "}Paid leave can be used after completing {balance.probation_months} months from joining. {balance.balance} {balance.balance === 1 ? "day has" : "days have"} built up so far.
        </p>
      )}
      <div className="lb-grid">
        {items.map((item) => (
          <div key={item.label} className={item.main ? "lb-main" : ""}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </div>
        ))}
      </div>
      {form}
      {editable && balance.adjustments?.length > 0 && (
        <details className="lb-history">
          <summary>Adjustment history ({balance.adjustments.length})</summary>
          <ul>
            {balance.adjustments.map((item) => (
              <li key={item._id} className={item.counts ? "" : "not-counted"}>
                <strong className={item.days > 0 ? "plus" : "minus"}>{item.mode === "opening" ? item.days : signed(item.days)}</strong>
                <span>{item.mode === "opening" ? `Opening balance as of ${shortDate(`${item.as_of}T00:00:00`)} - ` : ""}{item.reason}</span>
                <small>{item.balance_before} → {item.balance_after} · {item.by} · {shortDate(item.createdAt)}{item.counts ? "" : " · not counted (earlier leave year or replaced)"}</small>
                <button type="button" className="lb-remove" onClick={() => removeAdjustment(item)} aria-label="Remove adjustment"><i className="bi bi-trash" /></button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

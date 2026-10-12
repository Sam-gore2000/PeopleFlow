import { useEffect, useRef, useState } from "react";
import { useDialog } from "../../../components/feedback/DialogProvider.jsx";
import { attendanceApi } from "../attendanceApi.js";

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
const timeOf = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

// Popup form for an employee to fix a missed or wrong punch. `day` (optional) pre-fills the date and known times.
export function RegularizeModal({ day, onClose, onSent }) {
  const dialog = useDialog();
  const firstField = useRef(null);
  const [form, setForm] = useState(() => ({
    in_date: day?.date || "",
    login_time: timeOf(day?.punch_in),
    out_date: day?.date || "",
    logout_time: timeOf(day?.punch_out),
    reason: ""
  }));
  const [saving, setSaving] = useState(false);
  const set = (name, value) => setForm((current) => ({ ...current, [name]: value, ...(name === "in_date" && (!current.out_date || current.out_date < value) ? { out_date: value } : {}) }));

  useEffect(() => { firstField.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await attendanceApi.requestRegularization(form);
      onSent?.();
      onClose();
      dialog.success("Request sent", "Your manager will review your attendance regularization request.");
    } catch (error) {
      dialog.error("Couldn't send request", error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rg-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <form className="rg-card" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="rg-title">
        <button type="button" className="rg-close" onClick={onClose} disabled={saving} aria-label="Close"><i className="bi bi-x-lg" /></button>
        <h2 id="rg-title">Regularize Attendance</h2>
        <p className="rg-text">Missed a punch or have wrong times? Enter your actual login and logout. Your manager will approve it.</p>
        <div className="rg-grid">
          <label><span>In Date</span><input ref={firstField} className="form-control" type="date" max={todayKey()} value={form.in_date} onChange={(event) => set("in_date", event.target.value)} required /></label>
          <label><span>Login Time</span><input className="form-control" type="time" value={form.login_time} onChange={(event) => set("login_time", event.target.value)} required /></label>
          <label><span>Out Date</span><input className="form-control" type="date" min={form.in_date || undefined} max={todayKey()} value={form.out_date} onChange={(event) => set("out_date", event.target.value)} required /></label>
          <label><span>Logout Time</span><input className="form-control" type="time" value={form.logout_time} onChange={(event) => set("logout_time", event.target.value)} required /></label>
        </div>
        <label><span>Reason</span><textarea className="form-control" rows="3" maxLength={500} value={form.reason} onChange={(event) => set("reason", event.target.value)} placeholder="e.g. Forgot to punch out / system was down" required /></label>
        <div className="rg-actions">
          <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" className="btn btn-success" disabled={saving}>{saving ? "Sending..." : "Submit Request"}</button>
        </div>
      </form>
    </div>
  );
}

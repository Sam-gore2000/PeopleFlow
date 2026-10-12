import { useEffect, useState } from "react";
import { useDialog } from "../../../components/feedback/DialogProvider.jsx";
import { attendanceApi } from "../attendanceApi.js";

const shortDate = (value) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString([], { weekday: "short", day: "2-digit", month: "short", year: "numeric" }) : "-");

// Manager / admin: review one request - approve as asked, correct the times and approve, or reject with a note.
export function DecisionModal({ request, onClose, onDone }) {
  const dialog = useDialog();
  const [times, setTimes] = useState({ in_date: request.in_date, login_time: request.login_time, out_date: request.out_date, logout_time: request.logout_time });
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState("");
  const set = (name, value) => setTimes((current) => ({ ...current, [name]: value }));
  const edited = ["in_date", "login_time", "out_date", "logout_time"].some((key) => times[key] !== request[key]);

  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && !saving && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [saving, onClose]);

  async function decide(action) {
    if (saving) return;
    if (action === "reject" && !note.trim()) return dialog.error("Add a note", "Please tell the employee why the request is rejected.");
    setSaving(action);
    try {
      await attendanceApi.decideRegularization(request._id, action === "approve" ? { action, ...times, note } : { action, note });
      onDone?.();
      onClose();
      dialog.success(action === "approve" ? "Approved" : "Rejected", action === "approve" ? `${request.name}'s attendance for ${shortDate(times.in_date)} has been updated.` : `${request.name} will see your note.`);
    } catch (error) {
      dialog.error("Couldn't save", error.message);
    } finally {
      setSaving("");
    }
  }

  return (
    <div className="rg-backdrop" onMouseDown={(event) => event.target === event.currentTarget && !saving && onClose()}>
      <div className="rg-card" role="dialog" aria-modal="true" aria-labelledby="rg-decide-title">
        <button type="button" className="rg-close" onClick={onClose} disabled={Boolean(saving)} aria-label="Close"><i className="bi bi-x-lg" /></button>
        <h2 id="rg-decide-title">Review Request</h2>
        <p className="rg-text"><strong>{request.name}</strong> ({request.empid}) · requested {shortDate(request.in_date)}</p>
        <blockquote className="rg-reason">{request.reason}</blockquote>
        {request.original && (
          <p className="rg-text rg-small">Currently recorded: {request.original.punch_in ? new Date(request.original.punch_in).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "no punch in"} - {request.original.punch_out ? new Date(request.original.punch_out).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "no punch out"}{request.original.status ? ` (${request.original.status})` : ""}</p>
        )}
        <p className="rg-label">Times to apply {edited && <span className="rg-edited">edited</span>}</p>
        <div className="rg-grid">
          <label><span>In Date</span><input className="form-control" type="date" value={times.in_date} onChange={(event) => set("in_date", event.target.value)} /></label>
          <label><span>Login Time</span><input className="form-control" type="time" value={times.login_time} onChange={(event) => set("login_time", event.target.value)} /></label>
          <label><span>Out Date</span><input className="form-control" type="date" min={times.in_date} value={times.out_date} onChange={(event) => set("out_date", event.target.value)} /></label>
          <label><span>Logout Time</span><input className="form-control" type="time" value={times.logout_time} onChange={(event) => set("logout_time", event.target.value)} /></label>
        </div>
        <label><span>Note to employee {`(required to reject)`}</span><textarea className="form-control" rows="2" maxLength={500} value={note} onChange={(event) => setNote(event.target.value)} placeholder="e.g. Corrected logout as per gate register" /></label>
        <div className="rg-actions">
          <button type="button" className="btn rg-reject" onClick={() => decide("reject")} disabled={Boolean(saving)}>{saving === "reject" ? "Rejecting..." : "Reject"}</button>
          <button type="button" className="btn btn-success" onClick={() => decide("approve")} disabled={Boolean(saving)}>{saving === "approve" ? "Approving..." : edited ? "Approve with changes" : "Approve"}</button>
        </div>
      </div>
    </div>
  );
}

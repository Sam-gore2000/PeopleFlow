import { useState } from "react";
import { useDialog } from "../../components/feedback/DialogProvider.jsx";
import { EmployeePicker } from "../../components/forms/EmployeePicker.jsx";
import { attendanceApi } from "../attendance/attendanceApi.js";

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

// Admin: opening paid-leave balance for employees who joined before HRMS tracked their leave
// (e.g. joined 2 years ago and already used some). From the "as of" date their balance is this
// number; 1.5 days are added every month after it, and leave taken before that date no longer counts.
export function OpeningBalanceForm({ onSaved }) {
  const dialog = useDialog();
  const [employee, setEmployee] = useState(null);
  const [days, setDays] = useState("");
  const [asOf, setAsOf] = useState(todayKey);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    if (!employee) return dialog.error("Choose an employee", "Type the Employee ID or name and pick the employee.");
    setSaving(true);
    try {
      const result = await attendanceApi.setOpeningLeaveBalance({ emp_id: employee.empid, days, as_of: asOf, reason: reason || "Opening balance" });
      dialog.success("Opening balance saved", `${employee.fname} has ${result.data.balance} days of paid leave from ${asOf}.`);
      onSaved?.(employee.empid);
      setDays("");
      setReason("");
      setEmployee(null);
      setPickerKey((key) => key + 1);
    } catch (error) {
      dialog.error("Couldn't save", error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card lb-opening">
      <div className="card-body">
        <h5 className="cal-title">Add Opening Leave Balance</h5>
        <p className="lb-note">For employees who joined before HRMS tracked their leave. Their balance becomes this number on the chosen date; {`1.5`} days are added each month after it, and leave taken before that date is no longer counted.</p>
        <form className="lb-opening-form" onSubmit={submit}>
          <label>
            <span>Employee <b className="field-required">*</b></span>
            <EmployeePicker key={pickerKey} onPick={setEmployee} id="opening-balance-employee-options" />
            {employee && <small className="field-hint">{employee.fname} · {employee.empid}{employee.department ? ` · ${employee.department}` : ""}</small>}
          </label>
          <label>
            <span>Leave balance (days) <b className="field-required">*</b></span>
            <input className="form-control" type="number" min="0" step="0.5" value={days} onChange={(event) => setDays(event.target.value)} placeholder="e.g. 8.5" required />
          </label>
          <label>
            <span>Balance as of <b className="field-required">*</b></span>
            <input className="form-control" type="date" max={todayKey()} value={asOf} onChange={(event) => setAsOf(event.target.value)} required />
          </label>
          <label className="lb-opening-reason">
            <span>Note</span>
            <input className="form-control" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Balance carried over from old HRM" maxLength={300} />
          </label>
          <div className="lb-opening-actions">
            <button className="btn btn-success" disabled={saving}>{saving ? "Saving..." : "Save Opening Balance"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

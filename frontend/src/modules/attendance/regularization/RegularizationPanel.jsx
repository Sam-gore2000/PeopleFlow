import { useCallback, useEffect, useState } from "react";
import { useDialog } from "../../../components/feedback/DialogProvider.jsx";
import { Pagination } from "../../../components/tables/Pagination.jsx";
import { attendanceApi } from "../attendanceApi.js";
import { DecisionModal } from "./DecisionModal.jsx";
import { ScrollTable } from "../../../components/tables/ScrollTable.jsx";

const shortDate = (value) => (value ? new Date(`${value}T00:00:00`).toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" }) : "-");
const time12 = (value) => {
  if (!value) return "-";
  const [hours, minutes] = value.split(":").map(Number);
  return new Date(2000, 0, 1, hours, minutes).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};
const STATUS_TABS = [{ value: "0", label: "Pending" }, { value: "1", label: "Approved" }, { value: "2", label: "Rejected" }, { value: "", label: "All" }];

function StatusPill({ request }) {
  return <span className={`rg-status s${request.status}`}>{request.status_name}</span>;
}

// "mine": the signed-in person's own requests (cancel while pending).
// "team": requests to decide - a manager's team, or everyone for an admin.
export function RegularizationPanel({ scope, title, refreshKey = 0, onChanged }) {
  const dialog = useDialog();
  const [status, setStatus] = useState(scope === "team" ? "0" : "");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [reviewing, setReviewing] = useState(null);

  const load = useCallback(() => {
    attendanceApi.regularizations({ scope, status, page })
      .then((data) => { setResult(data); setError(""); })
      .catch((err) => setError(err.message));
  }, [scope, status, page]);

  useEffect(() => { load(); }, [load, refreshKey]);
  useEffect(() => { setPage(1); }, [status]);

  async function cancel(request) {
    const ok = await dialog.confirm({ title: "Cancel this request?", text: `Your request for ${shortDate(request.in_date)} will be withdrawn.`, confirmText: "Yes, cancel it", cancelText: "Keep it" });
    if (!ok) return;
    try {
      await attendanceApi.cancelRegularization(request._id);
      load();
      dialog.success("Request cancelled", "You can send a new request any time.");
    } catch (err) {
      dialog.error("Couldn't cancel", err.message);
    }
  }

  const rows = result?.data || [];
  const team = scope === "team";

  return (
    <div className="card rg-panel">
      <div className="card-body">
        <div className="rg-panel-top">
          <h5 className="cal-title">{title}{team && result?.pending > 0 && <span className="rg-badge">{result.pending} pending</span>}</h5>
          {team && (
            <div className="rg-tabs" role="tablist">
              {STATUS_TABS.map((tab) => (
                <button key={tab.label} type="button" role="tab" aria-selected={status === tab.value} className={status === tab.value ? "active" : ""} onClick={() => setStatus(tab.value)}>{tab.label}</button>
              ))}
            </div>
          )}
        </div>
        {error && <p className="cal-error">{error}</p>}
        <ScrollTable>
          <table className="table rg-table">
            <thead>
              <tr>
                {team && <th>Employee</th>}
                <th>In Date</th><th>Login</th><th>Out Date</th><th>Logout</th><th>Reason</th><th>Status</th><th>{team ? "Action" : "Manager Note"}</th>{!team && <th />}
              </tr>
            </thead>
            <tbody>
              {result && rows.length === 0 && <tr><td colSpan={team ? 8 : 8} className="text-center py-4">{team ? "No requests here." : "You haven't sent any regularization requests."}</td></tr>}
              {rows.map((request) => (
                <tr key={request._id}>
                  {team && <td><div className="report-person"><strong>{request.name}</strong><small>{request.empid}</small></div></td>}
                  <td>{shortDate(request.in_date)}</td>
                  <td>{time12(request.login_time)}</td>
                  <td>{shortDate(request.out_date)}</td>
                  <td>{time12(request.logout_time)}</td>
                  <td className="rg-reason-cell">{request.reason}</td>
                  <td><StatusPill request={request} /></td>
                  {team ? (
                    <td>
                      {request.status === 0
                        ? <button type="button" className="btn-action btn-view" onClick={() => setReviewing(request)}><i className="bi bi-pencil-square" /> Review</button>
                        : <small className="rg-muted">{request.decided_by}{request.manager_note ? ` - "${request.manager_note}"` : ""}</small>}
                    </td>
                  ) : (
                    <>
                      <td className="rg-reason-cell">{request.manager_note || <span className="rg-muted">-</span>}</td>
                      <td>{request.status === 0 && <button type="button" className="btn-action btn-action-danger" onClick={() => cancel(request)}><i className="bi bi-x-circle" /> Cancel</button>}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </ScrollTable>
        {result && <Pagination page={page} pageSize={result.page_size} total={result.total} onChange={setPage} label="requests" />}
      </div>
      {reviewing && <DecisionModal request={reviewing} onClose={() => setReviewing(null)} onDone={() => { load(); onChanged?.(); }} />}
    </div>
  );
}

import { ROLES } from "../../constants/app.js";

const APPROVED = 1;
const REJECTED = 2;

export function RowActions({ row, user, canWrite, approvable, onEdit, onDelete, onStatus, onView, viewLabel = "View Profile", viewIcon = "bi-person-badge", extraActions = [] }) {
  const id = row._id || row.id;
  return (
    <div className="row-actions">
      {approvable && user.role !== ROLES.EMPLOYEE && (
        <>
          <button className="btn-action btn-action-success" onClick={() => onStatus(id, APPROVED)}>Approve</button>
          <button className="btn-action btn-action-danger" onClick={() => onStatus(id, REJECTED)}>Reject</button>
        </>
      )}
      {extraActions.map((action) => (
        <button key={action.label} className={`btn-action ${action.className || "btn-view"}`} onClick={() => action.onClick(row)}><i className={`bi ${action.icon}`} /> {action.label}</button>
      ))}
      {onView && <button className="btn-action btn-view" onClick={() => onView(row)}><i className={`bi ${viewIcon}`} /> {viewLabel}</button>}
      {canWrite && <button className="btn-action btn-edit" onClick={() => onEdit(row)}><i className="bi bi-pencil" /> Edit</button>}
      {user.role === ROLES.ADMIN && <button className="btn-action btn-action-danger" onClick={() => onDelete(row)}><i className="bi bi-trash" /> Delete</button>}
    </div>
  );
}

import { useEffect, useState } from "react";
import { dashboardApi } from "../../../modules/dashboard/index.js";

// Birthday / work-anniversary notifications for today.
export function NotificationBell() {
  const [notes, setNotes] = useState([]);
  useEffect(() => { dashboardApi.notifications().then((r) => setNotes(r.notifications || [])).catch(() => {}); }, []);

  return (
    <li className="nav-item dropdown position-relative">
      <button className="nav-link birthday-bell"><span className="bi bi-bell-fill" /><span className="birthday-count">({notes.length})</span></button>
      {notes.length > 0 && <div className="birthday-dropdown show">{notes.map((note) => <div className="birthday-item" key={note}>{note}</div>)}</div>}
    </li>
  );
}

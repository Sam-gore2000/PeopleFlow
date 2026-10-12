import { formatTime } from "../../../utils/format.js";

function stateLabel({ punchedIn, punchedOut, onBreak }) {
  if (onBreak) return { dot: "break", text: "On break" };
  if (punchedIn) return { dot: "active", text: "Clocked in" };
  if (punchedOut) return { dot: "idle", text: "Day complete" };
  return { dot: "idle", text: "Not clocked in" };
}

export function AttendanceStatus({ punchedIn, punchedOut, onBreak, punchIn }) {
  const state = stateLabel({ punchedIn, punchedOut, onBreak });
  return (
    <div className="attendance-status">
      <div className="status-pill">
        <span className={`dot ${state.dot}`} />
        <span className="status-text">{state.text}</span>
      </div>
      <div className="status-pill">
        <i className="bi bi-calendar" />
        <span>{punchIn ? `Punched in at ${formatTime(punchIn)}` : "No punch today"}</span>
      </div>
    </div>
  );
}

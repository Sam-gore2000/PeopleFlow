import { Alert } from "../../../components/common/Alert.jsx";
import { useAttendanceTracker } from "../hooks/useAttendanceTracker.js";
import { AttendanceStatus } from "./AttendanceStatus.jsx";
import { AttendanceSummary } from "./AttendanceSummary.jsx";
import { TimerControl } from "./TimerControl.jsx";

function punchButton({ punchedIn, punchedOut }) {
  if (punchedOut) return { label: "Day Complete", icon: "bi-check2-circle", className: "punch-in" };
  if (punchedIn) return { label: "Punch Out", icon: "bi-pause", className: "punch-in bg-danger" };
  return { label: "Punch In", icon: "bi-play", className: "punch-in" };
}

// Punch in/out and start/stop break for the signed-in user (employee, manager and admin alike).
export function AttendanceCard() {
  const tracker = useAttendanceTracker();
  const { punchedIn, punchedOut, onBreak, busy, loaded, attendance } = tracker;
  const punch = punchButton(tracker);

  return (
    <div className="attendance-card" id="punch">
      <div className="attendance-header">
        <div><h4>Attendance</h4><p>Track your working hours and breaks</p></div>
        <div className="attendance-clock"><i className="bi bi-clock" /></div>
      </div>

      <TimerControl
        buttonClass={punch.className}
        icon={punch.icon}
        label={punch.label}
        onClick={tracker.togglePunch}
        disabled={!loaded || busy || punchedOut}
        hint={punchedOut ? "You've already punched out today" : undefined}
        timerLabel="Today's Work Time"
        timerId="timer"
        seconds={tracker.workSeconds}
      />

      <TimerControl
        className="mt-3"
        buttonClass={onBreak ? "break-active" : "break-start"}
        icon={onBreak ? "bi-stop-circle" : "bi-cup-hot"}
        label={onBreak ? "Stop Break" : "Start Break"}
        onClick={tracker.toggleBreak}
        disabled={!loaded || busy || !punchedIn}
        hint={!punchedIn ? "Punch in to start a break" : undefined}
        timerLabel={onBreak ? "On Break - Total Today" : "Break Time Today"}
        seconds={tracker.breakSeconds}
      />

      <Alert type={tracker.message?.type || "warning"} className="mt-3 mb-0">{tracker.message?.text}</Alert>
      <AttendanceStatus punchedIn={punchedIn} punchedOut={punchedOut} onBreak={onBreak} punchIn={attendance.punch_in} />
      <div className="attendance-divider" />
      <AttendanceSummary punchIn={attendance.punch_in} punchOut={attendance.punch_out} breakCount={tracker.breakCount} />
    </div>
  );
}

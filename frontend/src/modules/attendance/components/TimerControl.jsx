import { secondsToClock } from "../../../utils/format.js";

// A punch-style button next to a running timer (used for both work time and break time).
export function TimerControl({ className = "", buttonClass, icon, label, onClick, timerLabel, seconds, timerId, disabled = false, hint }) {
  return (
    <div className={`attendance-main ${className}`.trim()}>
      <button className={`attendance-punch ${buttonClass}`} onClick={onClick} disabled={disabled} title={hint}>
        <div className="punch-icon"><i className={`bi ${icon}`} /></div>
        <span>{label}</span>
      </button>
      <div className="attendance-timer">
        <p>{timerLabel}</p>
        <h2 id={timerId}>{secondsToClock(seconds)}</h2>
      </div>
    </div>
  );
}

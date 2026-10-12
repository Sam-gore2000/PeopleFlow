export function LiveClock({ now }) {
  return (
    <li className="nav-item d-flex align-items-center">
      <div className="time">
        <h3><i className="bi bi-stopwatch me-1" /><span id="liveTime">{now.toLocaleTimeString("en-US", { hour12: false })}</span></h3>
      </div>
    </li>
  );
}

import { formatTime } from "../../../utils/format.js";

// Today's figures under the punch card.
export function AttendanceSummary({ punchIn, punchOut, breakCount }) {
  const items = [
    { value: formatTime(punchIn), label: "Punch In" },
    { value: breakCount, label: breakCount === 1 ? "Break Today" : "Breaks Today" },
    { value: formatTime(punchOut), label: "Punch Out" }
  ];
  return (
    <div className="attendance-summary">
      {items.map((item) => (
        <div className="summary-item" key={item.label}><h3>{item.value}</h3><p>{item.label}</p></div>
      ))}
    </div>
  );
}

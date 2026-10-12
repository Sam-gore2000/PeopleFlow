import { WEEK_DAYS, WEEKEND_START_INDEX, WEEKLY_STATS, WEEKLY_Y_AXIS } from "../dashboard.data.js";

function WeeklyChart() {
  return (
    <div className="weekly-chart">
      <div className="chart-bars">
        <div className="y-axis">{WEEKLY_Y_AXIS.map((label) => <span key={label}>{label}</span>)}</div>
        {WEEK_DAYS.map((day, index) => (
          <div className={`day ${index >= WEEKEND_START_INDEX ? "muted" : ""}`} key={day}>
            <div className="bar-stack">
              <div className="bar target" style={{ height: `${65 + index * 3}%` }} />
              <div className="bar actual" style={{ height: `${60 + index * 2}%` }} />
            </div>
            <span>{day}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function WeeklyCard() {
  return (
    <div className="weekly-card">
      <div className="weekly-header">
        <div><h4>Weekly Overview</h4><p>Your work hours this week</p></div>
        <div className="weekly-action"><i className="bi bi-graph-up-arrow" /></div>
      </div>
      <div className="weekly-stats">
        {WEEKLY_STATS.map((stat) => (
          <div className="weekly-stat" key={stat.label}>
            <div className="stat-icon"><i className={`bi ${stat.icon}`} /></div>
            <p>{stat.label}</p>
            <h3>{stat.value}</h3>
          </div>
        ))}
      </div>
      <WeeklyChart />
      <div className="weekly-divider" />
      <div className="weekly-legend">
        <div><span className="dot active" /> Actual Hours</div>
        <div><span className="dot" /> Target Hours</div>
      </div>
    </div>
  );
}

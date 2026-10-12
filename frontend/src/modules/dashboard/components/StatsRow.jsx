import { StatCard } from "./StatCard.jsx";

export function StatsRow({ stats, navigate, canOpen }) {
  return (
    <div className="row stats-row">
      {stats.map((stat) => (
        <StatCard key={stat.label} stat={stat} onOpen={stat.page && navigate && canOpen?.(stat.page) ? () => navigate(stat.page) : null} />
      ))}
    </div>
  );
}

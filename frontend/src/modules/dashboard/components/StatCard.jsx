// A dashboard number card. With onOpen, the whole card links to its page (e.g. Total Employees -> Employee Details).
export function StatCard({ stat, onOpen }) {
  const linkProps = onOpen
    ? {
        role: "link",
        tabIndex: 0,
        onClick: onOpen,
        onKeyDown: (event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onOpen(); } },
        title: `Open ${stat.label}`
      }
    : {};
  return (
    <div className="col-lg-3 col-md-3 col-sm-6 col-6">
      <div className={`stats-card${onOpen ? " is-link" : ""}`} {...linkProps}>
        <div className="stats-icon"><i className={`bi ${stat.icon || "bi-grid"}`} /></div>
        <p className="stats-label">{stat.label}</p>
        <h2 className="stats-value">{stat.value}</h2>
        <span className="stats-meta neutral">{stat.meta}</span>
        {onOpen && <i className="bi bi-arrow-up-right stats-open" aria-hidden="true" />}
      </div>
    </div>
  );
}

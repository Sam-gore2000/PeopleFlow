function SidebarLink({ item, active, onSelect }) {
  return (
    <li className="nav-item">
      <button type="button" className={`nav-link ${active ? "active" : "collapsed"}`} onClick={() => onSelect(item.key)} aria-current={active ? "page" : undefined}>
        <i className={`bi ${item.icon}`} aria-hidden="true" />
        <span>{item.label}</span>
      </button>
    </li>
  );
}

// Desktop: the chevron collapses the sidebar to icons. Mobile: the sidebar slides over the page,
// opened from the menu button in the header and closed with the X, the backdrop or Escape.
export function Sidebar({ items, page, setPage, collapsed, onToggle, isMobile }) {
  return (
    <aside id="sidebar" className="sidebar" aria-label="Main menu" aria-hidden={isMobile && collapsed ? true : undefined}>
      <div className="sidebar-logo">
        <button type="button" className="logo-button" onClick={() => setPage("dashboard")} aria-label="Go to dashboard">
          {/* Expanded: full logo (white on dark theme, black on light). Collapsed: the monogram. */}
          <img src="/img/hrm-white-logo.png" alt="LionReach Media" className="logo-full logo-on-dark" />
          <img src="/img/hrm-black-logo.png" alt="LionReach Media" className="logo-full logo-on-light" />
          <img src="/img/LRM_monogram.png" alt="LionReach Media" className="logo-icon" />
        </button>
        <button
          type="button"
          className="toggle-sidebar-btn sidebar-toggle"
          onClick={onToggle}
          aria-label={isMobile ? "Close menu" : collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-controls="sidebar"
        >
          <i className={`bi ${isMobile ? "bi-x-lg" : "bi-chevron-double-left"}`} aria-hidden="true" />
        </button>
      </div>
      <ul className="sidebar-nav" id="sidebar-nav">
        {items.map((item) => <SidebarLink key={item.key} item={item} active={page === item.key} onSelect={setPage} />)}
      </ul>
    </aside>
  );
}

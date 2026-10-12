import { useNow } from "../../hooks/useNow.js";
import { Greeting } from "./header/Greeting.jsx";
import { LiveClock } from "./header/LiveClock.jsx";
import { LogoutButton } from "./header/LogoutButton.jsx";
import { NotificationBell } from "./header/NotificationBell.jsx";
import { ThemeToggle } from "./header/ThemeToggle.jsx";

// onOpenMenu: phones / tablets get a menu button (the sidebar is hidden there).
export function Header({ user, onLogout, onToggleTheme, onOpenMenu, menuOpen = false }) {
  const now = useNow();
  return (
    <header id="header" className="header">
      {onOpenMenu && (
        <div className="header-mobile-brand">
          <button type="button" className="header-menu-btn" onClick={onOpenMenu} aria-label="Open menu" aria-controls="sidebar" aria-expanded={menuOpen}>
            <i className="bi bi-list" aria-hidden="true" />
          </button>
          <img src="/img/LRM_monogram.png" alt="LionReach Media" className="header-monogram" />
        </div>
      )}
      <Greeting user={user} now={now} />
      <nav className="header-nav ms-auto">
        <ul className="d-flex align-items-center">
          <LiveClock now={now} />
          <ThemeToggle onToggle={onToggleTheme} />
          <NotificationBell />
          <LogoutButton onLogout={onLogout} />
        </ul>
      </nav>
    </header>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Footer } from "../components/layout/Footer.jsx";
import { Header } from "../components/layout/Header.jsx";
import { Sidebar } from "../components/layout/Sidebar.jsx";
import { useSidebar } from "../hooks/useSidebar.js";
import { DEFAULT_PAGE } from "../modules/registry.js";
import { navForRole } from "../navigation/index.js";
import { closeOpenViewFromHistory, pageFromHash, pushPage, startHistory } from "./history.js";
import { PageRouter } from "./PageRouter.jsx";

// Signed-in shell: sidebar + header + current page + footer.
export function AppLayout({ user, onLogout, onToggleTheme }) {
  const sidebar = useSidebar();
  const navItems = navForRole(user.role);
  const allowedPages = useMemo(() => new Set(navItems.map((item) => item.key)), [navItems]);
  const allowed = useCallback((key) => Boolean(key) && allowedPages.has(key), [allowedPages]);

  // Opening a link like #/payslips goes straight to that page (if this role may see it).
  const [page, setPage] = useState(() => (allowed(pageFromHash()) ? pageFromHash() : DEFAULT_PAGE));
  const pageRef = useRef(page);
  pageRef.current = page;

  useEffect(() => { startHistory(pageRef.current); }, []);

  useEffect(() => {
    function onPopState(event) {
      if (closeOpenViewFromHistory()) return;
      const state = event.state;
      // Address typed or edited by hand (e.g. #/leaves): open that page if this role may see it.
      if (!state) {
        const typed = pageFromHash();
        if (allowed(typed) && typed !== pageRef.current) {
          window.history.replaceState({ hrms: "page", page: typed }, "", `#/${typed}`);
          setPage(typed);
          return;
        }
      }
      if (state?.hrms === "root" || !state) {
        // Back at the first page: stay in the app.
        window.history.pushState({ hrms: "page", page: pageRef.current }, "", `#/${pageRef.current}`);
        return;
      }
      const next = allowed(state.page) ? state.page : DEFAULT_PAGE;
      if (next !== pageRef.current) setPage(next);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [allowed]);

  const navigate = useCallback((next) => {
    if (!allowed(next)) return;
    if (next !== pageRef.current) pushPage(next);
    setPage(next);
    sidebar.closeOnMobile();
    window.scrollTo({ top: 0 });
  }, [allowed, sidebar.closeOnMobile]);

  useEffect(() => { if (!allowedPages.has(page)) setPage(DEFAULT_PAGE); }, [allowedPages, page]);

  return (
    <div className="app-layout">
      <Sidebar items={navItems} page={page} setPage={navigate} collapsed={sidebar.collapsed} onToggle={sidebar.toggle} isMobile={sidebar.isMobile} />
      {/* Mobile: tapping outside the open menu closes it. */}
      {sidebar.isMobile && sidebar.mobileOpen && <div className="sidebar-backdrop" onClick={sidebar.closeOnMobile} aria-hidden="true" />}
      <div className="main-wrapper">
        <Header
          user={user}
          onLogout={onLogout}
          onToggleTheme={onToggleTheme}
          onOpenMenu={sidebar.isMobile ? () => sidebar.setCollapsed(false) : null}
          menuOpen={sidebar.mobileOpen}
        />
        <main id="main" className="main"><PageRouter page={page} user={user} navigate={navigate} canOpen={allowed} /></main>
        <Footer />
      </div>
    </div>
  );
}

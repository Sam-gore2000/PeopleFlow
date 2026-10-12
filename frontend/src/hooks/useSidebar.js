import { useCallback, useEffect, useState } from "react";

// Phones and tablets (up to 991px): the sidebar slides in over the page and is closed by default.
// Laptops / desktops: the sidebar is always there and can be collapsed to icons.
const MOBILE_QUERY = "(max-width: 991px)";

function isMobileScreen() {
  return typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;
}

// Sidebar state, reflected as classes on <body> for the CSS:
//   sidebar-collapsed     desktop: icons only / mobile: hidden
//   sidebar-mobile-open   mobile: menu open (locks page scrolling behind it)
export function useSidebar() {
  const [isMobile, setIsMobile] = useState(isMobileScreen);
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Follow the screen size (rotating a tablet, resizing a window).
  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const onChange = () => { setIsMobile(query.matches); setMobileOpen(false); };
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const collapsed = isMobile ? !mobileOpen : desktopCollapsed;

  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", collapsed);
    document.body.classList.toggle("sidebar-mobile-open", isMobile && mobileOpen);
  }, [collapsed, isMobile, mobileOpen]);

  // Escape closes the mobile menu.
  useEffect(() => {
    if (!isMobile || !mobileOpen) return undefined;
    const onKey = (event) => event.key === "Escape" && setMobileOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMobile, mobileOpen]);

  const setCollapsed = useCallback((next) => {
    if (isMobile) setMobileOpen(!next);
    else setDesktopCollapsed(next);
  }, [isMobile]);

  const toggle = useCallback(() => setCollapsed(!collapsed), [collapsed, setCollapsed]);
  const closeOnMobile = useCallback(() => { if (isMobile) setMobileOpen(false); }, [isMobile]);

  return { collapsed, setCollapsed, toggle, isMobile, mobileOpen, closeOnMobile };
}

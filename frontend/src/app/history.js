import { useEffect } from "react";

// Browser history for the signed-in app.
//  - Every sidebar page gets its own entry (#/leaves, #/payslips ...), so Back / Forward move between pages.
//  - Opening a view inside a page (a payslip, a profile, bank details) adds an entry, so Back closes it.
//  - Back at the first page stays in the app instead of leaving to an empty tab.

let openViewClose = null;

export const pageFromHash = () => (window.location.hash.match(/^#\/([\w-]+)/) || [])[1] || null;

export function startHistory(page) {
  window.history.replaceState({ hrms: "root", page }, "", `#/${page}`);
  window.history.pushState({ hrms: "page", page }, "", `#/${page}`);
}

export function pushPage(page) {
  openViewClose = null;
  window.history.pushState({ hrms: "page", page }, "", `#/${page}`);
}

// Called by AppLayout on popstate. Returns true when an open view was closed instead.
export function closeOpenViewFromHistory() {
  if (!openViewClose) return false;
  const close = openViewClose;
  openViewClose = null;
  close();
  return true;
}

// For pages that show a view in place of their list: Back (browser or in-app) closes the view.
// Returns the function the in-app Back button should call.
export function useViewHistory(isOpen, close) {
  useEffect(() => {
    if (!isOpen) return undefined;
    window.history.pushState({ ...(window.history.state || {}), hrms: "view" }, "", window.location.hash);
    openViewClose = close;
    return () => { if (openViewClose === close) openViewClose = null; };
  }, [isOpen]);

  return () => {
    if (openViewClose && window.history.state?.hrms === "view") window.history.back(); // popstate closes it
    else close();
  };
}

// After logout: drop the page address so Back / Forward only show the login screen.
export function resetHistoryAfterLogout() {
  openViewClose = null;
  window.history.replaceState({ hrms: "logout" }, "", window.location.pathname + window.location.search);
}

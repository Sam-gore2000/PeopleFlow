import { useEffect, useState } from "react";
import { resetHistoryAfterLogout } from "../../app/history.js";
import { authApi } from "./authApi.js";

const USER_KEY = "hrms_user";

function readStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// Signed-in user, persisted across reloads.
export function useAuth() {
  const [user, setUser] = useState(readStoredUser);

  useEffect(() => {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  }, [user]);

  // A page restored from the browser's back/forward cache re-checks the login
  // (e.g. after logging out in another tab), so a stale screen is never shown.
  useEffect(() => {
    function onPageShow(event) {
      if (event.persisted && !readStoredUser()) setUser(null);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      resetHistoryAfterLogout();
    }
  }

  return { user, login: setUser, logout };
}

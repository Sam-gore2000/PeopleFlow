import { api, setToken } from "../../services/api.js";

export const authApi = {
  async login(credentials) {
    const result = await api("/auth/login", { method: "POST", body: credentials });
    setToken(result.token);
    return result.user;
  },
  async logout() {
    try { await api("/auth/logout", { method: "POST" }); }
    catch { /* Local logout still clears stale sessions. */ }
    setToken(null);
  }
};

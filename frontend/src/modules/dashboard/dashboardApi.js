import { api } from "../../services/api.js";

export const dashboardApi = {
  summary: () => api("/dashboard"),
  notifications: () => api("/dashboard/notifications")
};

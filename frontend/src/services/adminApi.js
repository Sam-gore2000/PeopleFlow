import { api } from "./api.js";

export const adminApi = {
  directory: () => api("/admin/directory"),
  employeeProfile: (empid) => api(`/admin/employees/${encodeURIComponent(empid)}/profile`)
};

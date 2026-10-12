import { api } from "../../services/api.js";

export const attendanceApi = {
  status: () => api("/attendance/status"),
  punchIn: () => api("/attendance/punch-in", { method: "POST" }),
  punchOut: () => api("/attendance/punch-out", { method: "POST" }),
  startBreak: () => api("/attendance/breaks/start", { method: "POST" }),
  stopBreak: () => api("/attendance/breaks/stop", { method: "POST" }),
  calendar: (month, empId = "") =>
    api(`/attendance/calendar?month=${encodeURIComponent(month)}${empId ? `&emp_id=${encodeURIComponent(empId)}` : ""}`),
  leaveBalance: (empId = "") => api(`/attendance/leave-balance${empId ? `?emp_id=${encodeURIComponent(empId)}` : ""}`),
  adjustLeaveBalance: (body) => api("/attendance/leave-balance/adjust", { method: "POST", body }),
  setOpeningLeaveBalance: (body) => api("/attendance/leave-balance/opening", { method: "POST", body }),
  team: () => api("/manager/team"),
  regularizations: ({ scope = "mine", status = "", page = 1 } = {}) => api(`/attendance/regularizations?scope=${scope}&status=${status}&page=${page}`),
  requestRegularization: (body) => api("/attendance/regularizations", { method: "POST", body }),
  decideRegularization: (id, body) => api(`/attendance/regularizations/${id}/decision`, { method: "PATCH", body }),
  cancelRegularization: (id) => api(`/attendance/regularizations/${id}`, { method: "DELETE" }),
  monthlyReport: (month, empId = "") =>
    api(`/attendance/report/monthly?month=${encodeURIComponent(month)}${empId ? `&emp_id=${encodeURIComponent(empId)}` : ""}`)
};

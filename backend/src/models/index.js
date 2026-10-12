import Admin from "./Admin.js";
import AttendanceData from "./AttendanceData.js";
import BreakData from "./BreakData.js";
import Employee from "./Employee.js";
import Leave from "./Leave.js";
import LeaveAdjustment from "./LeaveAdjustment.js";
import PasswordReset from "./PasswordReset.js";
import UserLog from "./UserLog.js";
import * as legacy from "./legacyModels.js";

export const mongooseModels = {
  admins: Admin,
  employees: Employee,
  attendance: AttendanceData,
  breaks: BreakData,
  leaves: Leave,
  leaveAdjustments: LeaveAdjustment,
  passwordResets: PasswordReset,
  userLogs: UserLog,
  bankDetails: legacy.BankDetail,
  payslips: legacy.Payslip,
  holidays: legacy.Holiday,
  notices: legacy.Notice,
  queries: legacy.EmployeeQuery,
  projects: legacy.Project,
  teams: legacy.TeamMember,
  tasks: legacy.AssignTask,
  detailedTasks: legacy.Task,
  meetings: legacy.Meeting,
  dprs: legacy.Dpr,
  timesheets: legacy.Timesheet,
  legacyAttendance: legacy.LegacyAttendance,
  attendanceRequests: legacy.AttendanceRequest
};

// Services always read models through this registry, so the whole app can be
// switched to the in-memory store (see data/memoryStore.js) when MongoDB is down.
export const models = { ...mongooseModels };

export function useModels(replacements) {
  Object.assign(models, replacements);
}

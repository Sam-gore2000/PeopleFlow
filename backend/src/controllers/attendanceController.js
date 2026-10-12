import * as attendanceCalendarService from "../services/attendanceCalendarService.js";
import { adjustLeaveBalance, leaveBalance, removeAdjustment, setOpeningBalance } from "../services/leaveBalanceService.js";
import * as attendanceService from "../services/attendanceService.js";
import * as breakService from "../services/breakService.js";
import * as regularizationService from "../services/regularizationService.js";
import { handleRequest } from "../utils/handleRequest.js";

export const status = handleRequest((req) => attendanceService.status(req.user));
export const today = handleRequest((req) => attendanceService.today(req.user));
export const punchIn = handleRequest((req) => attendanceService.punchIn(req.user));
export const punchOut = handleRequest((req) => attendanceService.punchOut(req.user));
export const toggle = handleRequest((req) => attendanceService.toggle(req.user));
export const report = handleRequest((req) => attendanceService.report(req.user, req.query));
export const monthlyReport = handleRequest((req) => attendanceService.monthlyReport(req.query, req.user));
export const breaksToday = handleRequest((req) => breakService.breaksToday(req.user));
export const startBreak = handleRequest((req) => breakService.startBreak(req.user));
export const stopBreak = handleRequest((req) => breakService.stopBreak(req.user));
export const toggleBreak = handleRequest((req) => breakService.toggleBreak(req.user));
export const calendar = handleRequest((req) => attendanceCalendarService.monthCalendar(req.user, req.query));
// ?emp_id= (employee: own; manager: own + team; admin: anyone)
export const leaveBalanceFor = handleRequest(async (req) => {
  const employee = await attendanceCalendarService.resolveEmployee(req.user, req.query.emp_id);
  return { data: await leaveBalance(employee.empid) };
});
export const adjustLeave = handleRequest((req) => adjustLeaveBalance(req.user, req.body));
export const createRegularization = handleRequest((req) => regularizationService.createRequest(req.user, req.body));
export const listRegularizations = handleRequest((req) => regularizationService.listRequests(req.user, req.query));
export const decideRegularization = handleRequest((req) => regularizationService.decide(req.user, req.params.id, req.body));
export const cancelRegularization = handleRequest((req) => regularizationService.cancelRequest(req.user, req.params.id));
export const openingLeave = handleRequest((req) => setOpeningBalance(req.user, req.body));
export const removeLeaveAdjustment = handleRequest((req) => removeAdjustment(req.user, req.params.id));

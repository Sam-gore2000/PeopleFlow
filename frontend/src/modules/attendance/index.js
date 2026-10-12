import { attendanceRequestsConfig } from "./attendance.config.js";
import { AttendancePage } from "./AttendancePage.jsx";
import { BreakReportPage } from "./BreakReportPage.jsx";

export { AttendanceCard } from "./components/AttendanceCard.jsx";

export const attendanceModule = { key: "attendance", Page: AttendancePage };
// Admin sidebar "Break Report": monthly work hours + breaks for every employee.
export const breakReportModule = { key: "breaks", Page: BreakReportPage };
export const attendanceRequestsModule = { key: "attendanceRequests", config: attendanceRequestsConfig };

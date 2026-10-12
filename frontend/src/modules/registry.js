import { adminAccessModule } from "./adminAccess/index.js";
import { attendanceModule, attendanceRequestsModule, breakReportModule } from "./attendance/index.js";
import { compensationModule } from "./compensation/index.js";
import { dailyReportsModule } from "./dailyReports/index.js";
import { dashboardModule } from "./dashboard/index.js";
import { employeesModule } from "./employees/index.js";
import { handbookModule } from "./handbook/index.js";
import { holidaysModule } from "./holidays/index.js";
import { leaveModule } from "./leave/index.js";
import { loginLogsModule } from "./loginLogs/index.js";
import { meetingsModule } from "./meetings/index.js";
import { noticesModule } from "./notices/index.js";
import { payslipModule } from "./payslip/index.js";
import { profileModule } from "./profile/index.js";
import { projectsModule } from "./projects/index.js";
import { queriesModule } from "./queries/index.js";
import { tasksModule } from "./tasks/index.js";
import { teamsModule } from "./teams/index.js";
import { timesheetsModule } from "./timesheets/index.js";

// Every page the app can show, keyed by the page key used in navigation.
// A module provides either its own `Page` component or a `config` rendered by the shared ResourcePage.
const modules = [
  dashboardModule,
  profileModule,
  handbookModule,
  employeesModule,
  leaveModule,
  attendanceModule,
  breakReportModule,
  attendanceRequestsModule,
  payslipModule,
  compensationModule,
  holidaysModule,
  noticesModule,
  queriesModule,
  projectsModule,
  teamsModule,
  tasksModule,
  meetingsModule,
  dailyReportsModule,
  timesheetsModule,
  adminAccessModule,
  loginLogsModule
];

export const moduleRegistry = Object.fromEntries(modules.map((module) => [module.key, module]));

export const DEFAULT_PAGE = dashboardModule.key;

import { employeePolicy } from "./employeePolicy.js";
import employeeRoutes from "./employeeRoutes.js";
import { dashboardStats } from "./employeeService.js";

export const employeeModule = { basePath: "/employee", routes: employeeRoutes, policy: employeePolicy, dashboardStats };

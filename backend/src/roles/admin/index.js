import { adminPolicy } from "./adminPolicy.js";
import adminRoutes from "./adminRoutes.js";
import { dashboardStats } from "./adminService.js";

export const adminModule = { basePath: "/admin", routes: adminRoutes, policy: adminPolicy, dashboardStats };

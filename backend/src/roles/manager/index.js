import { managerPolicy } from "./managerPolicy.js";
import managerRoutes from "./managerRoutes.js";
import { dashboardStats } from "./managerService.js";

export const managerModule = { basePath: "/manager", routes: managerRoutes, policy: managerPolicy, dashboardStats };

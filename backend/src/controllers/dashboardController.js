import * as dashboardService from "../services/dashboardService.js";
import { handleRequest } from "../utils/handleRequest.js";

export const dashboard = handleRequest((req) => dashboardService.dashboard(req.user));
export const notifications = handleRequest((req) => dashboardService.notifications(req.user));

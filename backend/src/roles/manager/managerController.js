import { handleRequest } from "../../utils/handleRequest.js";
import * as managerService from "./managerService.js";

export const team = handleRequest((req) => managerService.team(req.user));
export const approvals = handleRequest((req) => managerService.approvals(req.user));

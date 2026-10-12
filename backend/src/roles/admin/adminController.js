import { handleRequest } from "../../utils/handleRequest.js";
import * as profileService from "../../services/profileService.js";
import * as adminService from "./adminService.js";

export const overview = handleRequest((req) => adminService.overview(req.user));
export const directory = handleRequest(() => profileService.employeeDirectory());
export const employeeProfile = handleRequest((req) => profileService.profileForEmployee(req.params.empid));

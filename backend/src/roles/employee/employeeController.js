import { handleRequest } from "../../utils/handleRequest.js";
import * as employeeService from "./employeeService.js";

export const home = handleRequest((req) => employeeService.home(req.user));

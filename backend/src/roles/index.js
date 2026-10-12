import { ROLES } from "../constants/roles.js";
import { adminModule } from "./admin/index.js";
import { employeeModule } from "./employee/index.js";
import { managerModule } from "./manager/index.js";

export const roleModules = {
  [ROLES.ADMIN]: adminModule,
  [ROLES.MANAGER]: managerModule,
  [ROLES.EMPLOYEE]: employeeModule
};

// Unknown roles fall back to the most restrictive (employee) rules.
export function getRoleModule(role) {
  return roleModules[role] || employeeModule;
}

import { ROLES } from "../constants/roles.js";

export function requireRole(roles, message) {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) return res.status(403).json({ message });
    next();
  };
}

export const requireAdmin = requireRole([ROLES.ADMIN], "Admin access required");
export const requireManager = requireRole([ROLES.MANAGER, ROLES.ADMIN], "Manager access required");
export const requireEmployee = requireRole([ROLES.EMPLOYEE, ROLES.MANAGER], "Employee access required");

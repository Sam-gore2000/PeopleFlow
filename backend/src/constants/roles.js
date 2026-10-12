export const ROLES = Object.freeze({
  ADMIN: "admin",
  MANAGER: "manager",
  EMPLOYEE: "employee"
});

// Employees whose position matches are signed in with the manager role.
export function roleForPosition(position = "") {
  return position === "Team Manager" || /manager/i.test(position) ? ROLES.MANAGER : ROLES.EMPLOYEE;
}

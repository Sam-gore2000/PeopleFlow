import { ROLES } from "../constants/app.js";
import { adminNav } from "./adminNav.js";
import { employeeNav } from "./employeeNav.js";
import { managerNav } from "./managerNav.js";

const navByRole = {
  [ROLES.ADMIN]: adminNav,
  [ROLES.MANAGER]: managerNav,
  [ROLES.EMPLOYEE]: employeeNav
};

// Pages a role must always have, added automatically if its nav file doesn't list them
// (placed after the `after` item).
const REQUIRED = {
  [ROLES.MANAGER]: [{ key: "breaks", label: "Team Break Report", icon: "bi-cup-hot", after: "attendance" }]
};

const cache = new Map();

export function navForRole(role) {
  if (cache.has(role)) return cache.get(role);
  const items = [...(navByRole[role] || employeeNav)];
  for (const { after, ...item } of REQUIRED[role] || []) {
    if (items.some((existing) => existing.key === item.key)) continue;
    const index = items.findIndex((existing) => existing.key === after);
    items.splice(index >= 0 ? index + 1 : items.length, 0, item);
  }
  cache.set(role, items);
  return items;
}

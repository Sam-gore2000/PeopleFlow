import { useEffect, useState } from "react";
import { adminApi } from "../services/adminApi.js";

// One shared request for the whole app; refreshed after employees are added, edited or deleted.
let cached = null;

export function invalidateEmployeeDirectory() {
  cached = null;
}

// Admin only: [{ empid, fname, department, position, report_manager_id, ... }] for ID <-> name auto-fill.
export function useEmployeeDirectory(enabled) {
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    if (!cached) cached = adminApi.directory().then((result) => result.data || []).catch((error) => { cached = null; throw error; });
    cached.then((list) => alive && setEmployees(list)).catch(() => {});
    return () => { alive = false; };
  }, [enabled]);

  return employees;
}

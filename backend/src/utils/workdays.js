import { env } from "../config/env.js";
import { models } from "../models/index.js";

// Dates may be stored as 2026-01-26 (date input) or 26-01-2026 / 26/01/2026 (older data).
export function normalizeDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
  }
  const text = String(value || "").trim();
  let match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  match = text.match(/^(\d{2})[-/](\d{2})[-/](\d{4})$/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return "";
}

export const weekday = (date) => new Date(`${date}T00:00:00`).getDay();
export const isWeeklyOff = (date) => env.weeklyOffDays.includes(weekday(date));

// { "2026-10-02": "Gandhi Jayanti", ... } from the Holidays table.
export async function holidayMap() {
  const rows = await models.holidays.find({}).lean();
  const map = new Map();
  for (const row of rows) {
    const date = normalizeDate(row.hddate);
    if (date) map.set(date, row.hdname || "Holiday");
  }
  return map;
}

// Leave days that actually count: from..to, skipping weekly offs (Sat/Sun) and holidays.
export function workingDaysBetween(from, to, holidays = new Map()) {
  const start = normalizeDate(from);
  const end = normalizeDate(to);
  if (!start || !end || end < start) return 0;
  let count = 0;
  for (let day = new Date(`${start}T00:00:00`); ; day.setDate(day.getDate() + 1)) {
    const date = normalizeDate(day);
    if (date > end) break;
    if (!isWeeklyOff(date) && !holidays.has(date)) count += 1;
  }
  return count;
}

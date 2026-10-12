export function todayKey(date = new Date()) {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 10);
}

export function timeKey(date = new Date()) {
  return date.toTimeString().slice(0, 8);
}

export function secondsToHms(seconds = 0) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function secondsSince(date, now = Date.now()) {
  return Math.max(0, Math.floor((now - new Date(date).getTime()) / 1000));
}

export function daysBetweenInclusive(startDate, endDate) {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  const ms = end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0);
  return Math.max(1, Math.floor(ms / 86_400_000) + 1);
}

// Attendance/payroll cycle runs from the 25th of one month to the 24th of the next.
export function payCycleRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getDate() >= 25 ? now.getMonth() : now.getMonth() - 1, 25);
  return [todayKey(start), todayKey(now)];
}

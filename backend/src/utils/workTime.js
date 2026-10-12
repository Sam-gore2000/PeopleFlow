// Work hours = punch in -> punch out, INCLUDING breaks (break time is tracked separately).
// While someone is still punched in, it counts up to `now`.
// Records with punch times are always calculated from them, so older records saved as
// "work minus breaks" show the same hours as new ones.
export function grossWorkSeconds(row, now = Date.now()) {
  if (!row?.punch_in) return Math.max(0, Number(row?.work_seconds) || 0);
  const start = new Date(row.punch_in).getTime();
  const end = row.punch_out ? new Date(row.punch_out).getTime() : now;
  if (Number.isNaN(start) || Number.isNaN(end)) return Math.max(0, Number(row.work_seconds) || 0);
  return Math.max(0, Math.round((end - start) / 1000));
}

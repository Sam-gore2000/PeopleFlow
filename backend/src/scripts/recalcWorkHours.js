// One-time fix: older attendance records saved "work hours minus breaks". Work hours now include
// breaks (punch in -> punch out), so this recalculates the saved hours (and Present / Half Day) from
// the punch times.
//   npm run fix-work-hours            preview what would change (nothing is written)
//   npm run fix-work-hours -- --apply write the changes
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { models } from "../models/index.js";
import { grossWorkSeconds } from "../utils/workTime.js";

const HALF_DAY_SECONDS = 4 * 3600;
const apply = process.argv.includes("--apply");
const hours = (seconds) => `${Math.floor(seconds / 3600)}h ${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}m`;

await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
const rows = await models.attendance.find({ punch_in: { $exists: true, $ne: null }, punch_out: { $exists: true, $ne: null } }).lean();

let changed = 0;
const examples = [];
for (const row of rows) {
  const work = grossWorkSeconds(row);
  const update = {};
  if (Number(row.work_seconds) !== work) update.work_seconds = work;
  if (["Present", "Half Day"].includes(row.status)) {
    const status = work < HALF_DAY_SECONDS ? "Half Day" : "Present";
    if (status !== row.status) update.status = status;
  }
  if (!Object.keys(update).length) continue;
  changed += 1;
  if (examples.length < 10) examples.push(`  ${row.emp_id} ${row.attendance_date}: ${hours(Number(row.work_seconds) || 0)} -> ${hours(work)}${update.status ? ` (${row.status} -> ${update.status})` : ""}`);
  if (apply) await models.attendance.updateOne({ _id: row._id }, { $set: update });
}

console.log(`\n  Attendance records checked: ${rows.length}, needing an update: ${changed}`);
if (examples.length) console.log(examples.join("\n"));
console.log(apply ? `\n  ✔ Updated ${changed} records.\n` : changed ? "\n  Nothing written yet. Run again with --apply to save:  npm run fix-work-hours -- --apply\n" : "\n  Everything is already up to date.\n");
await mongoose.disconnect();

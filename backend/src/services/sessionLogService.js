import { models } from "../models/index.js";
import { secondsSince, secondsToHms, timeKey, todayKey } from "../utils/date.js";

// Records a login in user_log and marks the employee online. Returns the session id.
export async function open(employee) {
  const sessionId = String(Math.floor(1000000 + Math.random() * 9000000));
  await models.userLogs.create({
    session_id: sessionId,
    emp_id: employee.empid,
    emp_name: employee.fname,
    date: todayKey(),
    in_timestamp: timeKey(),
    status: "Online"
  });
  await models.employees.updateOne({ _id: employee._id }, { $set: { status: "Online", last_act: new Date().toISOString() } });
  return sessionId;
}

// Closes the user's session log with its duration and marks the employee offline.
export async function close(user) {
  const log = await models.userLogs.findOne({ session_id: user.session_id });
  let sessTime = "00:00:00";
  if (log?.in_timestamp) {
    const [h, m, s] = log.in_timestamp.split(":").map(Number);
    const start = new Date();
    start.setHours(h || 0, m || 0, s || 0, 0);
    sessTime = secondsToHms(secondsSince(start));
  }
  await models.userLogs.updateOne({ session_id: user.session_id }, { $set: { out_timestamp: timeKey(), sessTime, status: "Offline" } });
  await models.employees.updateOne({ empid: user.empid }, { $set: { status: "Offline" } });
}

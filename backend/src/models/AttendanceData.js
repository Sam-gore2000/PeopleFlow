import mongoose from "mongoose";
import { baseOptions } from "./schemaOptions.js";

const attendanceSchema = new mongoose.Schema(
  {
    emp_id: String,
    emp_name: String,
    role: String,
    department: String,
    report_manager_id: String,
    user_id: String,
    attendance_date: String, // "YYYY-MM-DD" in APP_TIMEZONE
    work_date: String,
    punch_in: Date,
    punch_out: Date,
    work_seconds: Number, // punch_in -> punch_out, minus breaks
    break_seconds: Number,
    status: { type: String, default: "Present" } // Present | Half Day | Missed Punch Out | Absent
  },
  baseOptions
);

// One attendance record per person per day, so a double-click can never punch in twice.
attendanceSchema.index({ emp_id: 1, attendance_date: 1 }, { unique: true });

export default mongoose.model("AttendanceData", attendanceSchema, "attendance_data");

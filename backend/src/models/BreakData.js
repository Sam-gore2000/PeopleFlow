import mongoose from "mongoose";
import { baseOptions } from "./schemaOptions.js";

const breakSchema = new mongoose.Schema(
  {
    emp_id: String,
    emp_name: String,
    attendance_id: String,
    attendance_date: String, // "YYYY-MM-DD" in APP_TIMEZONE
    break_start: Date,
    break_end: Date,
    break_seconds: Number,
    active: Boolean, // true while the break is running
    auto_closed: Boolean // closed by the system (break left running into a later day)
  },
  baseOptions
);

// At most one running break per person.
breakSchema.index({ emp_id: 1 }, { unique: true, partialFilterExpression: { active: true } });
breakSchema.index({ attendance_date: 1, emp_id: 1 });

export default mongoose.model("BreakData", breakSchema, "break_data");

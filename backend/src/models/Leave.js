import mongoose from "mongoose";
import { baseOptions } from "./schemaOptions.js";

const leaveSchema = new mongoose.Schema(
  {
    fname: String,
    empid: String,
    report_manager_id: String,
    leavet: String,
    leave1: String,
    leave2: String,
    total_leave: Number,
    reason: String,
    response: String,
    status: { type: Number, default: 0 }
  },
  baseOptions
);

export default mongoose.model("Leave", leaveSchema, "user_leave");

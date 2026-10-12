import mongoose from "mongoose";
import { baseOptions } from "./schemaOptions.js";

const userLogSchema = new mongoose.Schema(
  {
    session_id: String,
    emp_id: String,
    emp_name: String,
    date: String,
    in_timestamp: String,
    out_timestamp: String,
    sessTime: String,
    status: String
  },
  baseOptions
);

export default mongoose.model("UserLog", userLogSchema, "user_log");

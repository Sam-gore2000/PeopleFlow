import mongoose from "mongoose";
import { baseOptions } from "./schemaOptions.js";

const employeeSchema = new mongoose.Schema(
  {
    fname: { type: String, trim: true },
    empid: { type: String, required: true, unique: true, trim: true },
    email: String,
    phno: String,
    username: String,
    pass: String,
    department: String,
    position: String,
    jdate: String,
    bdate: String,
    add: String,
    edu: String,
    skills: String,
    report_manager: String,
    report_manager_id: String,
    offer_ctc: String,
    prev_company: String,
    prev_exp: String,
    padd: String,
    profile_pic: String,
    pan_card: String,
    adhar_card: String,
    about: String,
    twitter: String,
    facebook: String,
    instagram: String,
    linkedin: String,
    status: { type: String, default: "Offline" },
    last_act: String
  },
  baseOptions
);

export default mongoose.model("Employee", employeeSchema, "emp_details");

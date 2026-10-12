import mongoose from "mongoose";
import { baseOptions } from "./schemaOptions.js";

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    email: String
  },
  baseOptions
);

export default mongoose.model("Admin", adminSchema, "admin");

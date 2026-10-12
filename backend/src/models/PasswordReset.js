import mongoose from "mongoose";
import { baseOptions } from "./schemaOptions.js";

// One forgot-password request per account: the emailed code (hashed), then a short-lived reset token (hashed).
const passwordResetSchema = new mongoose.Schema(
  {
    account_type: String, // "admin" | "employee"
    account_key: { type: String, index: true }, // admin username or employee empid
    email: String,
    otp_hash: String,
    otp_expires: Date,
    attempts: { type: Number, default: 0 },
    resend_after: Date,
    reset_token_hash: { type: String, index: true },
    reset_expires: Date
  },
  baseOptions
);

export default mongoose.model("PasswordReset", passwordResetSchema, "password_resets");

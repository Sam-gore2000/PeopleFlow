import fs from "fs";
import path from "path";
import { env } from "../config/env.js";
import { ROLES, roleForPosition } from "../constants/roles.js";
import { models } from "../models/index.js";
import { httpError } from "../utils/httpError.js";
import { hashPassword, matchesPassword } from "../utils/password.js";

// What an employee/manager may change on their own profile. Name, Employee ID, position,
// department, joining date, salary and reporting manager are HR's job (Admin -> Employee Details).
const SELF_EDITABLE = ["about", "phno", "email", "bdate", "add", "padd", "edu", "skills", "twitter", "facebook", "instagram", "linkedin"];
const ADMIN_EDITABLE = ["email"];
const MIN_PASSWORD_LENGTH = 6;

export const PROFILE_PHOTO_DIR = path.join(env.uploadDir, "profile");

export function publicEmployee(employee) {
  if (!employee) return null;
  const doc = employee.toObject ? employee.toObject() : { ...employee };
  delete doc.pass;
  return doc;
}

function pick(body, fields) {
  return Object.fromEntries(fields.filter((field) => body?.[field] !== undefined).map((field) => [field, typeof body[field] === "string" ? body[field].trim() : body[field]]));
}

// Profile shown on the profile page: the employee record plus the reporting manager's name.
async function employeeProfile(employee) {
  const data = publicEmployee(employee);
  data.role = roleForPosition(data.position);
  if (data.report_manager_id && !data.report_manager) {
    const manager = await models.employees.findOne({ empid: data.report_manager_id }).lean();
    if (manager) data.report_manager = manager.fname;
  }
  return data;
}

function adminProfile(admin) {
  return { _id: admin._id, username: admin.username, fname: admin.username, email: admin.email || "", role: ROLES.ADMIN, position: "Administrator", createdAt: admin.createdAt, password_changed_at: admin.password_changed_at || null };
}

async function findAccount(user) {
  if (user.role === ROLES.ADMIN) {
    const admin = await models.admins.findOne({ username: user.username });
    if (!admin) throw httpError(404, "Admin account not found");
    return { kind: "admin", doc: admin };
  }
  if (!user.empid) throw httpError(403, "Employee profile required");
  const employee = await models.employees.findOne({ empid: user.empid });
  if (!employee) throw httpError(404, "Employee profile not found");
  return { kind: "employee", doc: employee };
}

export async function getProfile(user) {
  const account = await findAccount(user);
  return { data: account.kind === "admin" ? adminProfile(account.doc) : await employeeProfile(account.doc) };
}

export async function updateProfile(user, body) {
  const account = await findAccount(user);
  const update = pick(body, account.kind === "admin" ? ADMIN_EDITABLE : SELF_EDITABLE);
  if (update.email !== undefined && update.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(update.email)) throw httpError(400, "Please enter a valid email address.");
  Object.assign(account.doc, update);
  await account.doc.save();
  return { data: account.kind === "admin" ? adminProfile(account.doc) : await employeeProfile(account.doc) };
}

export async function changePassword(user, { currentPassword, newPassword } = {}) {
  const account = await findAccount(user);
  const field = account.kind === "admin" ? "password" : "pass";
  if (!(await matchesPassword(currentPassword, account.doc[field]))) throw httpError(400, "Current password is incorrect");
  if (!newPassword || String(newPassword).length < MIN_PASSWORD_LENGTH) throw httpError(400, `New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  account.doc[field] = await hashPassword(newPassword);
  if (typeof account.doc.set === "function") account.doc.set("password_changed_at", new Date()); // field outside the schema
  else account.doc.password_changed_at = new Date();
  await account.doc.save();
  return { ok: true };
}

// Saves an uploaded profile photo (multer has already written the file) and removes the old one.
export async function updatePhoto(user, file) {
  if (!file) throw httpError(400, "Please choose a JPG, PNG or WebP image.");
  const account = await findAccount(user);
  if (account.kind !== "employee") {
    fs.rm(file.path, { force: true }, () => {});
    throw httpError(400, "Profile photos are available for employee accounts.");
  }
  const previous = account.doc.profile_pic;
  account.doc.profile_pic = `/uploads/profile/${file.filename}`;
  await account.doc.save();
  if (previous?.startsWith("/uploads/profile/")) fs.rm(path.join(PROFILE_PHOTO_DIR, path.basename(previous)), { force: true }, () => {});
  return { data: await employeeProfile(account.doc) };
}

// Admin: any employee's profile.
export async function profileForEmployee(empid) {
  const employee = await models.employees.findOne({ empid: String(empid || "").trim() }).lean();
  if (!employee) throw httpError(404, "Employee not found");
  return { data: await employeeProfile(employee) };
}

// Admin: light list used to auto-fill Employee ID <-> name in forms.
export async function employeeDirectory() {
  const employees = await models.employees.find({}).sort({ fname: 1 }).lean();
  return {
    data: employees.map(({ empid, fname, department, position, report_manager_id, report_manager, email, status }) => ({
      empid, fname, department, position, report_manager_id, report_manager, email, status
    }))
  };
}

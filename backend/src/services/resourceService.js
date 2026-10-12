import mongoose from "mongoose";
import { resourceConfig } from "../config/resources.js";
import { ROLES } from "../constants/roles.js";
import { models } from "../models/index.js";
import { getRoleModule } from "../roles/index.js";
import { httpError } from "../utils/httpError.js";
import { hashPassword } from "../utils/password.js";
import { cleanBody, escapeRegex, searchConditions } from "../utils/query.js";
import { holidayMap, workingDaysBetween } from "../utils/workdays.js";
import { preparePayslip } from "./payslipService.js";

// Extra per-resource processing before a row is saved.
const BEFORE_SAVE = { payslips: preparePayslip };

export function getResourceConfig(resource) {
  const config = resourceConfig[resource];
  if (!config) throw httpError(404, "Unknown resource");
  return config;
}

function modelFor(config) {
  return models[config.model];
}

// Fields only an approver may set; everyone else goes through PATCH /:id/status.
const APPROVAL_FIELDS = ["status", "response"];

function policyFor(user) {
  return getRoleModule(user.role).policy;
}

// Policy check and error message for each kind of write.
const PERMISSIONS = {
  write: ["canWrite", "You cannot add or edit records here"],
  approve: ["canApprove", "Only managers and admins can approve records"],
  delete: ["canDelete", "Only admins can delete records"]
};

function authorize(config, user, action) {
  const policy = policyFor(user);
  if (!policy.canAccess(config)) throw httpError(403, "Admin access required");
  const [check, message] = PERMISSIONS[action];
  if (!policy[check](config)) throw httpError(403, message);
}

// Checks the user's role may use this resource and narrows the filter to the rows they may see.
export function scopeFilter(config, user, input = {}, options = {}) {
  const policy = policyFor(user);
  if (!policy.canAccess(config)) throw httpError(403, "Admin access required");
  const { mine, ...filter } = input;
  // Private resources (payslips, bank details): only admins see other people's rows.
  if (config.ownOnly && user.role !== ROLES.ADMIN) {
    return { ...filter, [config.employeeField]: user.empid || "__none__" };
  }
  return policy.scope(config, user, filter, { ...options, mine: mine === "true" });
}

// Filter matching one row by id, but only if it lies inside the user's scope.
function scopedIdFilter(config, user, id, options) {
  if (!mongoose.isValidObjectId(id)) throw httpError(404, "Record not found");
  return { ...scopeFilter(config, user, {}, options), _id: id };
}

// Fills the employee's own fields on a row from the Employee record:
//  - employees/managers creating a row are pinned to themselves (Employee ID, name, manager);
//  - employees/managers editing a row can't move it to someone else;
//  - admins pick any Employee ID, and the name/manager are taken from that employee.
async function applyEmployeeFields(config, user, body, { creating }) {
  const idField = config.employeeField;
  if (!idField) return;
  const isAdmin = user.role === ROLES.ADMIN;
  const ownedFields = [idField, ...Object.keys(config.employeeMap || {})];

  if (!isAdmin && !creating) {
    ownedFields.forEach((field) => delete body[field]);
    return;
  }

  const empid = isAdmin ? String(body[idField] || "").trim() : user.empid;
  if (!empid) return;
  body[idField] = empid;
  // Exact ID first, then case-insensitive ("lrm_004" -> "LRM_004").
  const employee = (await models.employees.findOne({ empid }).lean()) || (await models.employees.findOne({ empid: { $regex: `^${escapeRegex(empid)}$`, $options: "i" } }).lean());
  if (!employee) return; // e.g. an admin's own attendance row

  body[idField] = employee.empid;
  for (const [field, source] of Object.entries(config.employeeMap || {})) {
    if (employee[source] !== undefined) body[field] = employee[source];
  }
  for (const [field, source] of Object.entries(config.employeeDefaults || {})) {
    if (!body[field] && employee[source]) body[field] = employee[source];
  }
}

// Passwords are stored as bcrypt hashes; an empty password on edit keeps the current one.
async function applyPassword(config, body) {
  const field = config.passwordField;
  if (!field || !(field in body)) return;
  if (!body[field]) delete body[field];
  else {
    body[field] = await hashPassword(body[field]);
    body.password_changed_at = new Date();
  }
}

// Cleans a create/update body: only approvers may set the approval fields (and on create only
// admins, so new requests start pending), and employees are pinned to their own empid.
async function prepareBody(resource, config, user, payload, { creating = false } = {}) {
  const policy = policyFor(user);
  const body = cleanBody(payload);
  const mayApprove = creating ? user.role === ROLES.ADMIN : policy.canApprove(config);
  if (config.approvable && !mayApprove) APPROVAL_FIELDS.forEach((field) => delete body[field]);
  if (creating) Object.assign(body, policy.ownerFields(config, user));
  await applyEmployeeFields(config, user, body, { creating });
  checkRequired(config, body, { creating });
  await applyPassword(config, body);
  // Leave days = working days only (weekly offs and holidays inside the range are not counted);
  // a half-day leave is a single date counted as 0.5.
  if (resource === "leaves") {
    if (isHalfDay(body.leave_duration) && body.leave1) body.leave2 = body.leave1;
    if (body.leave1 && body.leave2) {
      const days = workingDaysBetween(body.leave1, body.leave2, await holidayMap());
      body.total_leave = isHalfDay(body.leave_duration) ? days * 0.5 : days;
    }
  }
  return body;
}

const FIELD_NAMES = { empid: "Employee ID", email: "Email", department: "Department", position: "Position", pass: "Password", password: "Password", username: "Username" };
const fieldName = (field) => FIELD_NAMES[field] || field;
const isBlank = (value) => value === undefined || value === null || String(value).trim() === "";

// requiredFields: needed on create, can't be emptied on edit; requiredOnCreate: needed on create only.
function checkRequired(config, body, { creating }) {
  const missing = [
    ...(config.requiredFields || []).filter((field) => (creating ? isBlank(body[field]) : field in body && isBlank(body[field]))),
    ...(creating ? (config.requiredOnCreate || []).filter((field) => isBlank(body[field])) : [])
  ];
  if (missing.length) throw httpError(400, `Please fill in: ${missing.map(fieldName).join(", ")}.`);
}

// uniqueFields: no two rows may share a value (e.g. two employees with the same Employee ID or email).
async function checkUnique(config, model, body, id) {
  for (const field of config.uniqueFields || []) {
    if (isBlank(body[field])) continue;
    const value = String(body[field]).trim();
    body[field] = value;
    const clash = await model.findOne({ [field]: { $regex: `^${escapeRegex(value)}$`, $options: "i" }, ...(id ? { _id: { $ne: id } } : {}) }).lean();
    if (clash) throw httpError(409, `${fieldName(field)} "${value}" is already used by another record.`);
  }
}

// Half-day leave: one date, counted as 0.5 of a working day.
const isHalfDay = (duration) => /^half/i.test(String(duration || ""));

// Removes fields that must never leave the server (password hashes).
function hideFields(config, doc) {
  if (!doc || !config.hiddenFields?.length) return doc;
  const output = doc.toObject ? doc.toObject() : { ...doc };
  config.hiddenFields.forEach((field) => delete output[field]);
  return output;
}

export async function meta() {
  return {
    resources: Object.entries(resourceConfig).map(([key, config]) => ({ key, title: config.title, columns: config.columns, adminOnly: Boolean(config.adminOnly) }))
  };
}

export async function list(resource, user, query) {
  const config = getResourceConfig(resource);
  const { page = 1, limit = 100, q, ...rest } = query;
  const { year, ...filters } = rest;
  // ?year=2026 on resources with a yearField (e.g. payslips by their date).
  if (config.yearField && /^\d{4}$/.test(String(year || ""))) filters[config.yearField] = { $regex: `^${year}-` };
  const scoped = scopeFilter(config, user, filters);
  // The search is AND-ed with the scope, so it can never widen what a user may see.
  const model = modelFor(config);
  const search = searchConditions(config, q, (field) => model.schema?.path?.(field)?.instance);
  const filter = search.length ? { $and: [scoped, { $or: search }] } : scoped;
  const pageNumber = Math.max(1, Number.parseInt(page, 10) || 1);
  const pageSize = Math.min(500, Math.max(1, Number.parseInt(limit, 10) || 100));
  const [rows, total] = await Promise.all([
    model.find(filter).sort({ createdAt: -1, _id: -1 }).skip((pageNumber - 1) * pageSize).limit(pageSize).lean(),
    model.countDocuments(filter)
  ]);
  return { data: rows.map((row) => hideFields(config, row)), total, columns: config.columns, title: config.title };
}

export async function get(resource, id, user) {
  const config = getResourceConfig(resource);
  const data = await modelFor(config).findOne(scopedIdFilter(config, user, id)).lean();
  if (!data) throw httpError(404, "Record not found");
  return { data: hideFields(config, data) };
}

export async function create(resource, user, payload) {
  const config = getResourceConfig(resource);
  authorize(config, user, "write");
  const model = modelFor(config);
  const body = await prepareBody(resource, config, user, payload, { creating: true });
  await checkUnique(config, model, body);
  if (BEFORE_SAVE[resource]) await BEFORE_SAVE[resource](body, { model });
  const data = await model.create(body);
  return { statusCode: 201, payload: { data: hideFields(config, data) } };
}

export async function update(resource, id, user, payload) {
  const config = getResourceConfig(resource);
  authorize(config, user, "write");
  const body = await prepareBody(resource, config, user, payload);
  // Changing the approval fields counts as approving, so it carries the approval scope too.
  const approving = config.approvable && APPROVAL_FIELDS.some((field) => field in body);
  await checkUnique(config, modelFor(config), body, id);
  if (BEFORE_SAVE[resource]) {
    const existing = await modelFor(config).findOne(scopedIdFilter(config, user, id, { approving })).lean();
    if (!existing) throw httpError(404, "Record not found");
    await BEFORE_SAVE[resource](body, { model: modelFor(config), id, existing });
  }
  const data = await modelFor(config).findOneAndUpdate(scopedIdFilter(config, user, id, { approving }), body, { new: true });
  if (!data) throw httpError(404, "Record not found");
  return { data: hideFields(config, data) };
}

export async function updateStatus(resource, id, user, payload) {
  const config = getResourceConfig(resource);
  authorize(config, user, "approve");
  const update = { status: payload.status };
  if (payload.response !== undefined) update.response = payload.response;
  const data = await modelFor(config).findOneAndUpdate(scopedIdFilter(config, user, id, { approving: true }), update, { new: true });
  if (!data) throw httpError(404, "Record not found");
  return { data };
}

export async function remove(resource, id, user) {
  const config = getResourceConfig(resource);
  authorize(config, user, "delete");
  const data = await modelFor(config).findOneAndDelete(scopedIdFilter(config, user, id));
  if (!data) throw httpError(404, "Record not found");
  return { ok: true };
}

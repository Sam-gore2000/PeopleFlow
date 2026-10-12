export function escapeRegex(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const STATUS_LABELS = { pending: 0, approved: 1, rejected: 2 };
const MAX_SEARCH_LENGTH = 100;

// Conditions for the search box (any one may match). Each field is searched according to how
// the model stores it, because MongoDB rejects a text match on a Number or Date field:
//  - text fields: case-insensitive "contains";
//  - number fields: exact match when the search is a number;
//  - date fields: the whole day when the search is a date (2026-10-05);
//  - "pending" / "approved" / "rejected" on approvable resources (status is stored as 0 / 1 / 2).
// `typeOf(field)` returns the model's type for a field ("String", "Number", "Date", ...), if known.
export function searchConditions(config, q, typeOf = () => undefined) {
  const term = String(q ?? "").trim().slice(0, MAX_SEARCH_LENGTH);
  if (!term) return [];

  const hidden = new Set(config.hiddenFields || []);
  const fields = [...new Set([...config.columns, ...(config.searchFields || []), config.employeeField].filter(Boolean))].filter((field) => !hidden.has(field));
  const pattern = escapeRegex(term);
  const isNumber = /^-?\d+(\.\d+)?$/.test(term);
  const day = /^\d{4}-\d{2}-\d{2}$/.test(term) ? new Date(`${term}T00:00:00`) : null;
  const conditions = [];

  for (const field of fields) {
    const type = typeOf(field);
    if (type === "Number") {
      if (isNumber) conditions.push({ [field]: Number(term) });
    } else if (type === "Date") {
      if (day && !Number.isNaN(day.getTime())) conditions.push({ [field]: { $gte: day, $lt: new Date(day.getTime() + 86400000) } });
    } else if (type === "Boolean" || type === "ObjectId") {
      // not searchable as text
    } else {
      conditions.push({ [field]: { $regex: pattern, $options: "i" } });
      // Untyped legacy columns may hold numbers (e.g. a phone number saved as a number).
      if (isNumber && type !== "String") conditions.push({ [field]: Number(term) });
    }
  }

  if (config.approvable && term.length >= 3) {
    const statusIsNumber = typeOf("status") === "Number";
    for (const [label, code] of Object.entries(STATUS_LABELS)) {
      if (!label.startsWith(term.toLowerCase())) continue;
      conditions.push({ status: code });
      if (!statusIsNumber) conditions.push({ status: String(code) });
      if (code === 0) conditions.push({ status: { $exists: false } });
    }
  }
  return conditions;
}

// Kept for older callers: text search across the given fields.
export function searchFilter(fields, q) {
  const pattern = escapeRegex(q);
  return fields.map((field) => ({ [field]: { $regex: pattern, $options: "i" } }));
}

export function cleanBody(body) {
  const output = {};
  for (const [key, value] of Object.entries(body || {})) {
    if (value !== undefined && key !== "_id") output[key] = value;
  }
  return output;
}

// Form fields tied to an employee are marked in a module config with `employee: <kind>`:
//   id         Employee ID          name        Employee Name
//   manager    Report Manager ID    position    Designation / Position    department  Department
//
// Employees and managers: every such field is read-only and filled from their own login.
// Admins: type an Employee ID (or pick a name) and the other fields fill in automatically.
// The server applies the same rules, so a value typed around the UI is ignored anyway.

const FROM_EMPLOYEE = { id: "empid", name: "fname", manager: "report_manager_id", position: "position", department: "department" };
const FROM_SESSION = { id: "empid", name: "name", manager: "report_manager_id", position: "position", department: "department" };

// Always taken from the employee record, so read-only for admins too.
const ALWAYS_LOCKED = new Set(["manager"]);

export const ID_LIST = "employee-id-options";
export const NAME_LIST = "employee-name-options";

export const hasEmployeeFields = (fields) => fields.some((field) => field.employee);

// The signed-in employee's own values for a new form.
export function ownValues(fields, user) {
  return Object.fromEntries(fields.filter((field) => field.employee).map((field) => [field.name, user?.[FROM_SESSION[field.employee]] ?? ""]));
}

const normalize = (value) => String(value ?? "").trim().toLowerCase();

export function findById(directory, value) {
  const id = normalize(value);
  return id ? directory.find((employee) => normalize(employee.empid) === id) || null : null;
}

export function findByName(directory, value) {
  const name = normalize(value);
  const matches = name ? directory.filter((employee) => normalize(employee.fname) === name) : [];
  return { employee: matches.length === 1 ? matches[0] : null, count: matches.length };
}

// Values to copy into the form once an employee is identified.
export function valuesFromEmployee(fields, employee) {
  return Object.fromEntries(fields.filter((field) => field.employee).map((field) => [field.name, employee[FROM_EMPLOYEE[field.employee]] ?? ""]));
}

// Per-field UI state: read-only, suggestion list and a hint under the input.
export function employeeFieldProps(field, { isAdmin, values, directory, fields }) {
  if (!field.employee) return {};
  if (!isAdmin) return { readOnly: true, hint: "Filled from your login" };
  if (ALWAYS_LOCKED.has(field.employee)) return { readOnly: true, hint: "Filled from the employee record" };

  if (field.employee === "id") {
    const value = values[field.name];
    if (value && directory.length && !findById(directory, value)) return { list: ID_LIST, hint: "No employee with this ID", hintTone: "warn" };
    return { list: ID_LIST, hint: "Type an ID - the name fills in automatically" };
  }

  if (field.employee === "name") {
    const value = values[field.name];
    const idField = fields.find((item) => item.employee === "id");
    const { count } = findByName(directory, value);
    if (value && count > 1 && !findById(directory, values[idField?.name])) return { list: NAME_LIST, hint: `${count} employees share this name - choose by Employee ID`, hintTone: "warn" };
    return { list: NAME_LIST, hint: "Or pick a name - the ID fills in automatically" };
  }
  return {};
}

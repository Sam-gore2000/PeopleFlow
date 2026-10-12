import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ROLES } from "../../constants/app.js";
import { useEmployeeDirectory, invalidateEmployeeDirectory } from "../../hooks/useEmployeeDirectory.js";
import { useFormState } from "../../hooks/useFormState.js";
import { toLabel } from "../../utils/format.js";
import { Card } from "../common/Card.jsx";
import { PageTitle } from "../common/PageTitle.jsx";
import { useDialog } from "../feedback/DialogProvider.jsx";
import { employeeFieldProps, findById, findByName, hasEmployeeFields, ownValues, valuesFromEmployee } from "../forms/employeeFields.js";
import { Pagination } from "../tables/Pagination.jsx";
import { ResourceTable } from "../tables/ResourceTable.jsx";
import { ResourceForm } from "./ResourceForm.jsx";
import { SearchBar } from "./SearchBar.jsx";
import { useResource } from "./useResource.js";

const APPROVED = 1;

// A human-readable name for a row, used in the delete confirmation.
const LABEL_FIELDS = ["fname", "emp_name", "employeeName", "name", "heading", "hdname", "project", "team_name", "task", "subject", "username", "empid", "emp_id"];
function recordLabel(row) {
  const field = LABEL_FIELDS.find((key) => row[key]);
  const label = field ? String(row[field]) : "";
  return label.length > 60 ? `${label.slice(0, 60)}...` : label;
}

// Generic list + add/edit page driven by a module's resource config:
//   resource     backend resource key (/api/resources/:resource)
//   fields       form field definitions (defaults to the table columns); see forms/employeeFields.js
//                for `employee: "id" | "name" | ...` and `approverOnly: true`
//   selfService  non-admin users may add/edit their own records
//   approvable   managers/admins get Approve / Reject actions
//   columnLabels table headings, e.g. { fname: "Employee Name" } (otherwise the form label is used)
//   compute(values)          -> { field: value } recalculated after every change (fields marked computed: true)
//   defaults                 -> starting values for a new form (e.g. { leave_duration: "Full Day" })
// Field flags: required, requiredOnCreate (e.g. password), readOnlyWhen(values) -> hint text or false.
//   onEmployeeSelected(emp)  -> Promise<{ field: value }> extra values to load when an admin picks an employee
// Optional props: onView(row) adds a "View Profile" style action; viewLabel names it;
// intro is shown under the page title (e.g. the attendance calendar); filters are extra list
// parameters (e.g. { year: 2026 }) and toolbar renders their controls next to the search box;
// rowActions adds buttons to every row: [{ label, icon, onClick(row) }]; changing refreshKey reloads the table.
export function ResourcePage({ config, user, onView, viewLabel, viewIcon, intro, filters, toolbar, rowActions, refreshKey = 0 }) {
  const { resource, selfService = false, approvable = false } = config;
  const data = useResource(resource, { filters });
  const dialog = useDialog();
  const isAdmin = user.role === ROLES.ADMIN;
  const canApprove = user.role !== ROLES.EMPLOYEE;

  const fields = useMemo(() => {
    const all = config.fields || data.meta.columns.map((key) => ({ name: key, label: toLabel(key) }));
    return all.filter((field) => !field.approverOnly || canApprove);
  }, [config.fields, data.meta.columns, canApprove]);

  const linked = hasEmployeeFields(fields);
  const directory = useEmployeeDirectory(isAdmin && linked);
  // Employees/managers always start with their own ID and name filled in.
  const blankForm = useCallback(() => ({ ...(config.defaults || {}), ...(linked && !isAdmin ? ownValues(fields, user) : {}) }), [config.defaults, linked, isAdmin, fields, user]);

  const [form, setField, resetForm] = useFormState(blankForm());
  const formRef = useRef(form);
  formRef.current = form;
  const selection = useRef(0);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  // Reload the table when something outside it changed the data (e.g. an approved regularization).
  useEffect(() => { if (refreshKey) data.reload().catch(() => {}); }, [refreshKey]);

  const columns = data.meta.columns.length ? data.meta.columns : fields.map((field) => field.name);
  const canWrite = isAdmin || selfService;
  const title = data.meta.title || toLabel(resource);

  // Sets several fields and returns the merged values.
  function applyValues(base, patch, skip) {
    for (const [key, next] of Object.entries(patch || {})) if (key !== skip) setField(key, next);
    return { ...base, ...patch };
  }

  function recompute(values) {
    if (config.compute) applyValues(values, config.compute(values));
  }

  // Admin: an Employee ID fills the name (and manager/department...), a unique name fills the ID.
  // Then the page may load more for that employee (e.g. the payslip loads their compensation).
  function handleChange(name, value) {
    setField(name, value);
    let next = { ...formRef.current, [name]: value };
    const field = fields.find((item) => item.name === name);

    if (isAdmin && directory.length && (field?.employee === "id" || field?.employee === "name")) {
      const employee = field.employee === "id" ? findById(directory, value) : findByName(directory, value).employee;
      if (employee) {
        // An exact (case-insensitive) ID match is also corrected to its real casing.
        next = applyValues(next, valuesFromEmployee(fields, employee), field.employee === "id" ? null : name);
        if (config.onEmployeeSelected) {
          const ticket = ++selection.current; // ignore answers for an employee no longer selected
          config.onEmployeeSelected(employee).then((extra) => {
            if (ticket !== selection.current || !extra) return;
            recompute(applyValues(formRef.current, extra));
          }).catch(() => {});
        }
      }
    }
    recompute(next);
  }

  function fieldProps(field) {
    if (field.computed) return { readOnly: true, hint: "Calculated automatically" };
    const lockedHint = field.readOnlyWhen?.(form);
    if (lockedHint) return { readOnly: true, hint: lockedHint };
    const props = employeeFieldProps(field, { isAdmin, values: form, directory, fields });
    props.required = Boolean(field.required || (field.requiredOnCreate && !editing));
    // Editing: passwords are stored encrypted and can't be shown - an empty box keeps the current one.
    if (field.type === "password" && editing) {
      props.placeholder = "•••••••• (unchanged)";
      props.hint = props.hint || "The current password is kept unless you type a new one.";
    }
    return props;
  }

  function startEdit(row) {
    setEditing(row._id || row.id);
    resetForm({ ...(config.defaults || {}), ...row }); // older rows may lack newer fields (e.g. leave duration)
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditing(null);
    resetForm(blankForm());
  }

  function afterEmployeeChange() {
    if (resource === "employees") invalidateEmployeeDirectory();
  }

  async function submit() {
    if (saving) return; // ignore double clicks
    const isUpdate = Boolean(editing);
    setSaving(true);
    try {
      await data.save(editing, form);
      afterEmployeeChange();
      cancelEdit();
      dialog.success(isUpdate ? "Updated successfully" : "Saved successfully", `The record has been ${isUpdate ? "updated" : "added"} in ${title}.`);
    } catch (err) {
      dialog.error(isUpdate ? "Update failed" : "Couldn't save", err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(row) {
    const id = row._id || row.id;
    const label = recordLabel(row);
    const confirmed = await dialog.confirm({
      title: "Delete this record?",
      text: `${label ? `"${label}"` : "This record"} will be permanently deleted from ${title}. This can't be undone.`,
      confirmText: "Yes, delete"
    });
    if (!confirmed) return;
    try {
      await data.remove(id);
      afterEmployeeChange();
      if (editing === id) cancelEdit();
      dialog.success("Deleted", `${label ? `"${label}"` : "The record"} has been removed.`);
    } catch (err) {
      dialog.error("Delete failed", err.message);
    }
  }

  async function setStatus(id, status) {
    try {
      await data.setStatus(id, status);
      dialog.success(status === APPROVED ? "Approved" : "Rejected", `The request has been ${status === APPROVED ? "approved" : "rejected"}.`);
    } catch (err) {
      dialog.error("Couldn't update status", err.message);
    }
  }

  return (
    <>
      <PageTitle>{title}</PageTitle>
      {intro}
      {canWrite && (
        <ResourceForm
          title={data.meta.title}
          fields={fields}
          values={form}
          onChange={handleChange}
          fieldProps={fieldProps}
          directory={isAdmin ? directory : null}
          editing={editing}
          saving={saving}
          error={data.error}
          onSubmit={submit}
          onCancel={cancelEdit}
        />
      )}
      <Card>
        <div className="table-toolbar-row">
        <SearchBar
          value={data.search}
          onChange={data.setSearch}
          onSearch={data.searchNow}
          onClear={data.clearSearch}
          loading={data.loading}
          activeSearch={data.activeSearch}
          total={data.total}
        />
        {toolbar}
        </div>
        <ResourceTable
          columns={columns}
          columnLabels={config.columnLabels}
          fields={config.fields}
          records={data.records}
          loading={data.loading}
          activeSearch={data.activeSearch}
          user={user}
          canWrite={canWrite}
          approvable={approvable}
          onEdit={startEdit}
          onDelete={remove}
          onStatus={setStatus}
          onView={onView}
          viewLabel={viewLabel}
          viewIcon={viewIcon}
          extraActions={rowActions}
          showActions={canWrite || isAdmin || (approvable && canApprove) || Boolean(onView) || Boolean(rowActions?.length)}
          startIndex={(data.page - 1) * data.pageSize}
        />
        <Pagination page={data.page} pageSize={data.pageSize} total={data.total} onChange={(next) => { data.setPage(next); }} />
      </Card>
    </>
  );
}

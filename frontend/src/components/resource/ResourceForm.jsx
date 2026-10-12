import { Alert } from "../common/Alert.jsx";
import { Card } from "../common/Card.jsx";
import { ID_LIST, NAME_LIST } from "../forms/employeeFields.js";
import { FormFields } from "../forms/FormFields.jsx";

// Suggestions for the admin's Employee ID / Employee Name inputs.
function EmployeeOptions({ directory }) {
  if (!directory?.length) return null;
  return (
    <>
      <datalist id={ID_LIST}>
        {directory.map((employee) => <option key={employee.empid} value={employee.empid} label={`${employee.fname || ""}${employee.department ? ` · ${employee.department}` : ""}`} />)}
      </datalist>
      <datalist id={NAME_LIST}>
        {directory.map((employee) => <option key={employee.empid} value={employee.fname || ""} label={employee.empid} />)}
      </datalist>
    </>
  );
}

export function ResourceForm({ title, fields, values, onChange, fieldProps, directory, editing, saving = false, error, onSubmit, onCancel }) {
  function submit(event) {
    event.preventDefault();
    onSubmit();
  }

  const label = editing ? "Update" : "Submit";

  return (
    <Card title={`${editing ? "Update" : "Add"} ${title}`}>
      <form className="row g-3" onSubmit={submit}>
        <FormFields fields={fields} values={values} onChange={onChange} fieldProps={fieldProps} />
        <EmployeeOptions directory={directory} />
        <Alert type="danger">{error}</Alert>
        <div className="col-12 d-flex gap-2">
          <button className="btn btn-success" type="submit" disabled={saving}>{saving ? "Saving..." : label}</button>
          {editing && <button className="btn btn-outline-secondary" type="button" onClick={onCancel} disabled={saving}>Cancel</button>}
        </div>
      </form>
    </Card>
  );
}

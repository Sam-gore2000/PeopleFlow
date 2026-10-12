import { PasswordInput } from "./PasswordInput.jsx";

// Renders one form control from a field definition: { name, label, type, options }.
// Optional UI props: readOnly (locked, filled automatically), list (datalist id for suggestions), hint,
// required (red * and the browser won't submit it empty), placeholder.
export function Field({ field, value, onChange, readOnly = false, list, hint, hintTone, required = false, placeholder }) {
  const { name, label, type = "text", options = [] } = field;
  const handleChange = (event) => onChange(name, event.target.value);
  const className = `form-control${readOnly ? " field-locked" : ""}`;
  const common = { className, name, value: value ?? "", onChange: handleChange, readOnly, required: required && !readOnly, placeholder };

  let control;
  if (type === "textarea") {
    control = <textarea {...common} rows="3" />;
  } else if (type === "select") {
    control = (
      <select {...common} className={`${className} form-select`} disabled={readOnly}>
        <option value="">Select</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  } else if (type === "password") {
    control = <PasswordInput {...common} autoComplete="new-password" />;
  } else {
    control = <input {...common} type={type} list={list} autoComplete={list ? "off" : undefined} />;
  }

  return (
    <label className="col-md-6">
      <span>{label}{required && !readOnly && <b className="field-required" aria-hidden="true"> *</b>}{readOnly && <i className="bi bi-lock-fill field-lock-icon" aria-label="read-only" />}</span>
      {control}
      {hint && <small className={`field-hint ${hintTone || ""}`.trim()}>{hint}</small>}
    </label>
  );
}

import { Field } from "./Field.jsx";

// Renders a list of field definitions bound to a single form-state object.
// `fieldProps(field)` may add per-field UI props (readOnly, list, hint).
export function FormFields({ fields, values, onChange, fieldProps }) {
  return fields.map((field) => <Field key={field.name} field={field} value={values[field.name]} onChange={onChange} {...(fieldProps ? fieldProps(field) : {})} />);
}

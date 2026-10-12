import { useCallback, useState } from "react";

// Object-shaped form state with a (name, value) change handler matching <Field onChange>.
export function useFormState(initial = {}) {
  const [values, setValues] = useState(initial);
  const setField = useCallback((name, value) => setValues((current) => ({ ...current, [name]: value })), []);
  const reset = useCallback((next = initial) => setValues(next), [initial]);
  return [values, setField, reset];
}

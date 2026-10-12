import { useState } from "react";
import "./passwordInput.css";

// A password box with an eye button to show / hide what was typed.
// Use it like a normal <input>: <PasswordInput className="form-control" value={...} onChange={...} />
export function PasswordInput({ className = "form-control", ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-input">
      <input {...props} className={className} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="password-input-toggle"
        onClick={() => setVisible((shown) => !shown)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        tabIndex={-1}
      >
        <i className={`bi ${visible ? "bi-eye-slash" : "bi-eye"}`} />
      </button>
    </div>
  );
}

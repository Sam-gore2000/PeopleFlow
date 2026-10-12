import { useState } from "react";
import { useDialog } from "../../../components/feedback/DialogProvider.jsx";
import { FormFields } from "../../../components/forms/FormFields.jsx";
import { useFormState } from "../../../hooks/useFormState.js";
import { EMPTY_PASSWORDS, PASSWORD_FIELDS } from "../profile.config.js";
import { profileApi } from "../profileApi.js";

const MIN_LENGTH = 6;

// Change Password tab (employees, managers and admins).
export function ChangePasswordForm() {
  const [passwords, setField, reset] = useFormState(EMPTY_PASSWORDS);
  const [saving, setSaving] = useState(false);
  const dialog = useDialog();

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    if (passwords.newPassword.length < MIN_LENGTH) return dialog.error("Password too short", `The new password must be at least ${MIN_LENGTH} characters.`);
    if (passwords.newPassword !== passwords.renewPassword) {
      return dialog.error("Passwords don't match", "The new password and the re-entered password must be the same.");
    }
    setSaving(true);
    try {
      await profileApi.changePassword(passwords);
      reset(EMPTY_PASSWORDS);
      dialog.success("Password changed", "Use your new password the next time you sign in.");
    } catch (err) {
      dialog.error("Couldn't change password", err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="row g-3" onSubmit={submit}>
      <FormFields fields={PASSWORD_FIELDS} values={passwords} onChange={setField} />
      <div className="col-12"><button className="btn btn-success" disabled={saving}>{saving ? "Saving..." : "Change Password"}</button></div>
    </form>
  );
}

import { useEffect, useState } from "react";
import { useDialog } from "../../../components/feedback/DialogProvider.jsx";
import { FormFields } from "../../../components/forms/FormFields.jsx";
import { useFormState } from "../../../hooks/useFormState.js";
import { ADMIN_PROFILE_FIELDS, PROFILE_FIELDS } from "../profile.config.js";
import { profileApi } from "../profileApi.js";

// Edit Profile tab. Only the fields the person may change themselves are shown.
export function EditProfileForm({ profile, onSaved }) {
  const fields = profile.role === "admin" ? ADMIN_PROFILE_FIELDS : PROFILE_FIELDS;
  const pickEditable = (source) => Object.fromEntries(fields.map((field) => [field.name, source?.[field.name] ?? ""]));
  const [form, setField, resetForm] = useFormState(pickEditable(profile));
  const [saving, setSaving] = useState(false);
  const dialog = useDialog();

  useEffect(() => { resetForm(pickEditable(profile)); }, [profile]);

  async function submit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      const result = await profileApi.update(form);
      onSaved?.(result.data);
      dialog.success("Profile updated", "Your profile changes have been saved.");
    } catch (err) {
      dialog.error("Update failed", err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="row g-3" onSubmit={submit}>
      {profile.role !== "admin" && (
        <p className="profile-note col-12"><i className="bi bi-info-circle" /> Name, Employee ID, position, department and reporting manager are managed by HR.</p>
      )}
      <FormFields fields={fields} values={form} onChange={setField} />
      <div className="col-12"><button className="btn btn-success" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button></div>
    </form>
  );
}

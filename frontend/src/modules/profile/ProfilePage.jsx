import { useCallback, useEffect, useState } from "react";
import { Alert } from "../../components/common/Alert.jsx";
import { PageTitle } from "../../components/common/PageTitle.jsx";
import { useDialog } from "../../components/feedback/DialogProvider.jsx";
import { ChangePasswordForm } from "./components/ChangePasswordForm.jsx";
import { EditProfileForm } from "./components/EditProfileForm.jsx";
import { ProfileLayout } from "./components/ProfileLayout.jsx";
import { profileApi } from "./profileApi.js";

// "My Profile" for every panel (employee, manager, admin).
export function ProfilePage({ user }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const dialog = useDialog();

  const load = useCallback(() => profileApi.load().then(setProfile).catch((err) => setError(err.message)), []);
  useEffect(() => { load(); }, [load, user]);

  async function changePhoto(file) {
    if (file.size > 2 * 1024 * 1024) return dialog.error("Photo too large", "Please choose an image of 2 MB or smaller.");
    setUploading(true);
    try {
      const result = await profileApi.uploadPhoto(file);
      setProfile(result.data);
      dialog.success("Photo updated", "Your new profile photo has been saved.");
    } catch (err) {
      dialog.error("Upload failed", err.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <PageTitle>My Profile</PageTitle>
      <Alert type="danger">{error}</Alert>
      {!profile && !error && <p className="profile-loading">Loading profile...</p>}
      {profile && (
        <ProfileLayout
          profile={profile}
          onPhotoChange={profile.role === "admin" ? undefined : changePhoto}
          uploading={uploading}
          tabs={[
            { key: "edit", label: "Edit Profile", render: () => <EditProfileForm profile={profile} onSaved={setProfile} /> },
            { key: "password", label: "Change Password", render: () => <ChangePasswordForm /> }
          ]}
        />
      )}
    </>
  );
}

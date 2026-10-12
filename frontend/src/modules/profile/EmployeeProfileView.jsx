import { useEffect, useState } from "react";
import { Alert } from "../../components/common/Alert.jsx";
import { PageTitle } from "../../components/common/PageTitle.jsx";
import { adminApi } from "../../services/adminApi.js";
import { ProfileLayout } from "./components/ProfileLayout.jsx";

// Admin: read-only profile of any employee (opened from Employee Details -> View Profile).
export function EmployeeProfileView({ empid, onBack }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setProfile(null);
    setError("");
    adminApi.employeeProfile(empid).then((result) => setProfile(result.data)).catch((err) => setError(err.message));
  }, [empid]);

  useEffect(() => { window.scrollTo({ top: 0 }); }, []);

  return (
    <>
      <div className="profile-view-header">
        <PageTitle>Employee Profile</PageTitle>
        <button type="button" className="btn btn-outline-secondary profile-back" onClick={onBack}><i className="bi bi-arrow-left" /> Back to Employee Details</button>
      </div>
      <Alert type="danger">{error}</Alert>
      {!profile && !error && <p className="profile-loading">Loading profile...</p>}
      {profile && <ProfileLayout profile={profile} />}
    </>
  );
}

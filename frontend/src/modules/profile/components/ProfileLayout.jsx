import { useState } from "react";
import { ProfileOverview } from "./ProfileOverview.jsx";
import { ProfileSummaryCard } from "./ProfileSummaryCard.jsx";

// Two-column profile page: summary card on the left, tabs on the right.
// `tabs` adds tabs after Overview: [{ key, label, render: () => <... /> }].
export function ProfileLayout({ profile, tabs = [], onPhotoChange, uploading }) {
  const [active, setActive] = useState("overview");
  const passwordTab = tabs.find((tab) => tab.key === "password");
  const allTabs = [{ key: "overview", label: "Overview", render: () => <ProfileOverview profile={profile} onChangePassword={passwordTab ? () => setActive("password") : null} /> }, ...tabs];
  const current = allTabs.find((tab) => tab.key === active) || allTabs[0];

  return (
    <div className="profile-page">
      <div className="profile-page-side">
        <ProfileSummaryCard profile={profile} onPhotoChange={onPhotoChange} uploading={uploading} />
      </div>
      <div className="profile-page-main">
        <div className="card profile-details">
          <div className="card-body">
            <ul className="nav nav-tabs nav-tabs-bordered profile-tabs" role="tablist">
              {allTabs.map((tab) => (
                <li className="nav-item" key={tab.key} role="presentation">
                  <button type="button" role="tab" aria-selected={tab.key === current.key} className={`nav-link ${tab.key === current.key ? "active" : ""}`} onClick={() => setActive(tab.key)}>{tab.label}</button>
                </li>
              ))}
            </ul>
            <div className="profile-tab-body" role="tabpanel">{current.render()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

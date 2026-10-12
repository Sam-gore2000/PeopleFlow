import { ADMIN_OVERVIEW_SECTIONS, OVERVIEW_SECTIONS } from "../profile.config.js";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString([], { day: "2-digit", month: "short", year: "numeric" });
}

function displayValue(profile, item) {
  const raw = profile[item.key] || (item.fallbackKey ? profile[item.fallbackKey] : "");
  const value = item.format === "date" ? formatDate(raw) : raw;
  return value && value !== "NA" ? String(value) : "";
}

// Password row: passwords are stored encrypted one-way, so only the change date can be shown.
function PasswordInfo({ profile, onChangePassword }) {
  const changed = profile.password_changed_at ? formatDate(profile.password_changed_at) : "";
  return (
    <section>
      <h6 className="profile-section-title">Security</h6>
      <div className="profile-info-grid">
        <div className="profile-info">
          <div className="profile-info-icon"><i className="bi bi-shield-lock" /></div>
          <div className="profile-info-text">
            <span>Password</span>
            <strong className="profile-password-dots">••••••••</strong>
            <small className="profile-password-meta">{changed ? `Last changed ${changed}` : "Not changed in HRMS yet"}</small>
          </div>
          {onChangePassword && <button type="button" className="btn btn-outline-secondary btn-sm profile-password-change" onClick={onChangePassword}>Change</button>}
        </div>
      </div>
      <p className="profile-password-note"><i className="bi bi-info-circle" /> For your security, passwords are stored encrypted and can't be displayed - not even to HR. You can set a new one any time.</p>
    </section>
  );
}

// Overview tab: About + grouped icon cards (+ password info on your own profile).
export function ProfileOverview({ profile, onChangePassword }) {
  const sections = profile.role === "admin" ? ADMIN_OVERVIEW_SECTIONS : OVERVIEW_SECTIONS;
  return (
    <div className="profile-overview">
      {profile.role !== "admin" && (
        <section>
          <h6 className="profile-section-title">About</h6>
          <p className={`profile-about ${profile.about ? "" : "is-empty"}`}>{profile.about || "Nothing added yet."}</p>
        </section>
      )}
      {sections.map((section) => (
        <section key={section.title}>
          <h6 className="profile-section-title">{section.title}</h6>
          <div className="profile-info-grid">
            {section.items.map((item) => {
              const value = displayValue(profile, item);
              return (
                <div className="profile-info" key={item.key}>
                  <div className="profile-info-icon"><i className={`bi ${item.icon}`} /></div>
                  <div className="profile-info-text">
                    <span>{item.label}</span>
                    <strong className={value ? "" : "is-empty"}>{value || "Not added"}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
      {onChangePassword && <PasswordInfo profile={profile} onChangePassword={onChangePassword} />}
    </div>
  );
}

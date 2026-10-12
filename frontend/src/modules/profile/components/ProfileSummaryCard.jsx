import { SOCIAL_LINKS } from "../profile.config.js";
import { ProfileAvatar } from "./ProfileAvatar.jsx";

function socialHref(value) {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value.replace(/^\/+/, "")}`;
}

// Left card: photo, name, position, Employee ID, online status and social links.
export function ProfileSummaryCard({ profile, onPhotoChange, uploading = false }) {
  const isOnline = String(profile.status || "").toLowerCase() === "online";
  const isAdmin = profile.role === "admin";
  return (
    <div className="card profile-summary">
      <div className="card-body">
        <div className="profile-avatar-wrap">
          <ProfileAvatar name={profile.fname} photo={profile.profile_pic} />
          {onPhotoChange && (
            <label className={`profile-photo-btn ${uploading ? "is-busy" : ""}`} title="Change photo">
              <i className={`bi ${uploading ? "bi-arrow-repeat spin" : "bi-camera"}`} />
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={uploading} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) onPhotoChange(file); }} />
            </label>
          )}
        </div>
        <h3 className="profile-name">{profile.fname || profile.username}</h3>
        <p className="profile-position">{profile.position || "-"}</p>
        <div className="profile-chips">
          {!isAdmin && <span className="profile-chip"><span className={`status-dot ${isOnline ? "online" : ""}`} />{isOnline ? "Online" : "Offline"}</span>}
          <span className="profile-chip"><i className="bi bi-person-vcard" />{profile.empid || profile.username}</span>
        </div>
        {!isAdmin && (
          <div className="profile-socials">
            {SOCIAL_LINKS.map((social) => {
              const href = socialHref(profile[social.key]);
              return href ? (
                <a key={social.key} href={href} target="_blank" rel="noopener noreferrer" title={social.label} aria-label={social.label}><i className={`bi ${social.icon}`} /></a>
              ) : (
                <span key={social.key} className="is-empty" title={`${social.label}: not added`} aria-label={`${social.label} not added`}><i className={`bi ${social.icon}`} /></span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

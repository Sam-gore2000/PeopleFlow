import { useEffect, useState } from "react";
import { assetUrl } from "../../../services/api.js";

function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] || "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase() || "?";
}

// Profile photo, or the person's initials when there is no photo (or it fails to load).
export function ProfileAvatar({ name, photo, size = 120 }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photo]);
  const src = assetUrl(photo);
  return (
    <div className="profile-avatar" style={{ width: size, height: size, fontSize: size * 0.34 }}>
      {src && !failed ? <img src={src} alt={name || "Profile photo"} onError={() => setFailed(true)} /> : <span>{initials(name)}</span>}
    </div>
  );
}

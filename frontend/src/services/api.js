export const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

// Files served by the backend (e.g. "/uploads/profile/x.jpg") live next to the API, not the frontend.
export function assetUrl(path) {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  const origin = API_BASE.replace(/\/api\/?$/, "");
  return `${origin}${path.startsWith("/") ? path : `/uploads/${path}`}`;
}

export function getToken() {
  return localStorage.getItem("hrms_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("hrms_token", token);
  else localStorage.removeItem("hrms_token");
}

function errorMessage(payload) {
  if (payload.message) return payload.message;
  if (typeof payload.detail === "string") return payload.detail;
  if (payload.detail) return JSON.stringify(payload.detail);
  return "Request failed";
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (!(options.body instanceof FormData)) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...options,
    headers,
    body: options.body instanceof FormData ? options.body : options.body ? JSON.stringify(options.body) : undefined
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(errorMessage(payload));
  return payload;
}

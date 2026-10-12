import { api } from "./api.js";

function queryString(params) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params || {})) {
    if (value !== undefined && value !== null && value !== "") search.set(key, value);
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

// Client for the generic /api/resources/:resource CRUD endpoints.
// list(resource, { q, page, limit, year, ... }) - a plain string is treated as the search text.
export const resourceApi = {
  list: (resource, params = {}) => api(`/resources/${resource}${queryString(typeof params === "string" ? { q: params } : params)}`),
  create: (resource, body) => api(`/resources/${resource}`, { method: "POST", body }),
  update: (resource, id, body) => api(`/resources/${resource}/${id}`, { method: "PUT", body }),
  remove: (resource, id) => api(`/resources/${resource}/${id}`, { method: "DELETE" }),
  setStatus: (resource, id, status) => api(`/resources/${resource}/${id}/status`, { method: "PATCH", body: { status } })
};

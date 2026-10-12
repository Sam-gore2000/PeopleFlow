import { api } from "../../services/api.js";

export const profileApi = {
  async load() {
    const result = await api("/auth/profile");
    return result.data || {};
  },
  update: (body) => api("/auth/profile", { method: "PUT", body }),
  changePassword: (body) => api("/auth/password", { method: "PUT", body }),
  uploadPhoto(file) {
    const body = new FormData();
    body.append("photo", file);
    return api("/auth/profile/photo", { method: "POST", body });
  }
};

import { api } from "../../services/api.js";

// Forgot password: email a code -> check the code -> set a new password.
export const passwordResetApi = {
  requestCode: (username) => api("/auth/forgot/request", { method: "POST", body: { username } }),
  verifyCode: (username, otp) => api("/auth/forgot/verify", { method: "POST", body: { username, otp } }),
  resetPassword: (resetToken, password, confirmPassword) => api("/auth/forgot/reset", { method: "POST", body: { resetToken, password, confirmPassword } })
};

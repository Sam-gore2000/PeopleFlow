import * as authService from "../services/authService.js";
import * as passwordResetService from "../services/passwordResetService.js";
import * as profileService from "../services/profileService.js";
import { clearAuthCookie, setAuthCookie } from "../utils/authCookie.js";
import { handleRequest } from "../utils/handleRequest.js";

export const login = handleRequest(async (req, res) => {
  const { token, user, remember } = await authService.login(req.body);
  setAuthCookie(res, token, remember);
  return { token, user };
});

export const me = handleRequest((req) => ({ user: req.user }));

export const logout = handleRequest(async (req, res) => {
  const result = await authService.logout(req.user);
  clearAuthCookie(res);
  return result;
});

export const forgotRequest = handleRequest((req) => passwordResetService.requestCode(req.body));
export const forgotVerify = handleRequest((req) => passwordResetService.verifyCode(req.body));
export const forgotReset = handleRequest((req) => passwordResetService.resetPassword(req.body));
export const getProfile = handleRequest((req) => profileService.getProfile(req.user));
export const updateProfile = handleRequest((req) => profileService.updateProfile(req.user, req.body));
export const uploadPhoto = handleRequest((req) => profileService.updatePhoto(req.user, req.file));
export const changePassword = handleRequest((req) => profileService.changePassword(req.user, req.body));

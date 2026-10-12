import express from "express";
import * as authController from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { uploadProfilePhoto } from "../middleware/upload.js";
import { rateLimit } from "../middleware/rateLimit.js";

// At most 20 forgot-password calls per 15 minutes from one address.
const forgotLimiter = rateLimit({ windowMs: 15 * 60_000, max: 20, message: "Too many attempts. Please wait a few minutes and try again." });

const router = express.Router();

router.post("/login", authController.login);
router.get("/me", requireAuth, authController.me);
router.post("/logout", requireAuth, authController.logout);
// Forgot password: email a code -> check the code -> set a new password.
router.post("/forgot/request", forgotLimiter, authController.forgotRequest);
router.post("/forgot/verify", forgotLimiter, authController.forgotVerify);
router.post("/forgot/reset", forgotLimiter, authController.forgotReset);
router.get("/profile", requireAuth, authController.getProfile);
router.put("/profile", requireAuth, authController.updateProfile);
router.post("/profile/photo", requireAuth, uploadProfilePhoto, authController.uploadPhoto);
router.put("/password", requireAuth, authController.changePassword);

export default router;

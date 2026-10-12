import express from "express";
import { env } from "../config/env.js";
import { mailConfigured } from "../services/mailer.js";
import { requireAuth } from "../middleware/auth.js";
import { roleModules } from "../roles/index.js";
import attendanceRoutes from "./attendance.js";
import authRoutes from "./auth.js";
import dashboardRoutes from "./dashboard.js";
import resourceRoutes from "./resources.js";

// Bump when the API changes, so /api/health shows which build is answering.
export const API_VERSION = "2026.10.12-docker-release";

const router = express.Router();

export const mountedRoutes = ["/api/auth", "/api/dashboard", "/api/attendance", "/api/resources"];

router.get("/health", (req, res) =>
  res.json({ ok: true, service: "hrms-api", version: API_VERSION, mode: req.app.locals.dataMode, timezone: env.timezone, mail_configured: mailConfigured(), routes: mountedRoutes })
);
router.use("/auth", authRoutes);
router.use("/dashboard", requireAuth, dashboardRoutes);
router.use("/attendance", requireAuth, attendanceRoutes);
router.use("/resources", requireAuth, resourceRoutes);

// Role-specific APIs: /api/admin, /api/manager, /api/employee
for (const { basePath, routes } of Object.values(roleModules)) {
  router.use(basePath, requireAuth, routes);
  mountedRoutes.push(`/api${basePath}`);
}

export default router;

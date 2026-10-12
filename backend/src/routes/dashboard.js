import express from "express";
import * as dashboardController from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/", dashboardController.dashboard);
router.get("/notifications", dashboardController.notifications);

export default router;

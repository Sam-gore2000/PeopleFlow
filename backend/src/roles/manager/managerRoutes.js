import express from "express";
import { requireManager } from "../../middleware/roles.js";
import * as managerController from "./managerController.js";

const router = express.Router();

router.use(requireManager);
router.get("/team", managerController.team);
router.get("/approvals", managerController.approvals);

export default router;

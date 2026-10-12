import express from "express";
import { requireAdmin } from "../../middleware/roles.js";
import * as adminController from "./adminController.js";

const router = express.Router();

router.use(requireAdmin);
router.get("/overview", adminController.overview);
router.get("/directory", adminController.directory);
router.get("/employees/:empid/profile", adminController.employeeProfile);

export default router;

import express from "express";
import { requireEmployee } from "../../middleware/roles.js";
import * as employeeController from "./employeeController.js";

const router = express.Router();

router.use(requireEmployee);
router.get("/home", employeeController.home);

export default router;

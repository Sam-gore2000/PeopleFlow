import express from "express";
import * as attendanceController from "../controllers/attendanceController.js";
import { requireAdmin, requireManager } from "../middleware/roles.js";

// Mounted at /api/attendance behind requireAuth. Punch and break actions work for every role.
const router = express.Router();

router.get("/status", attendanceController.status);
router.get("/today", attendanceController.today);
router.post("/punch-in", attendanceController.punchIn);
router.post("/punch-out", attendanceController.punchOut);
router.post("/toggle", attendanceController.toggle);

router.get("/breaks/today", attendanceController.breaksToday);
router.post("/breaks/start", attendanceController.startBreak);
router.post("/breaks/stop", attendanceController.stopBreak);
router.post("/breaks/toggle", attendanceController.toggleBreak);

router.get("/calendar", attendanceController.calendar);
router.get("/leave-balance", attendanceController.leaveBalanceFor); // ?emp_id=
router.post("/leave-balance/adjust", requireAdmin, attendanceController.adjustLeave);
router.post("/leave-balance/opening", requireAdmin, attendanceController.openingLeave);
router.delete("/leave-balance/adjustments/:id", requireAdmin, attendanceController.removeLeaveAdjustment); // ?month=YYYY-MM&emp_id= (admin: anyone, manager: own team)
// Regularization: employees/managers request (scope=mine), managers/admins decide (scope=team).
router.get("/regularizations", attendanceController.listRegularizations); // ?scope=mine|team&status=0|1|2&page=
router.post("/regularizations", attendanceController.createRegularization);
router.patch("/regularizations/:id/decision", requireManager, attendanceController.decideRegularization);
router.delete("/regularizations/:id", attendanceController.cancelRegularization);

router.get("/report", attendanceController.report);
// Break & work report: admin sees everyone, a manager sees their team (and themselves).
router.get("/report/monthly", requireManager, attendanceController.monthlyReport);

export default router;

import express from "express";
import * as resourceController from "../controllers/resourceController.js";

const router = express.Router();

router.get("/meta", resourceController.meta);
router.get("/:resource", resourceController.list);
router.get("/:resource/:id", resourceController.get);
router.post("/:resource", resourceController.create);
router.put("/:resource/:id", resourceController.update);
router.patch("/:resource/:id/status", resourceController.updateStatus);
router.delete("/:resource/:id", resourceController.remove);

export default router;

import { Router } from "express";
import { getTableQRCodes } from "../controllers/tableController.js";
import { requireAdmin } from "../middleware/authMiddleware.js";
const router = Router();
router.get("/qr", requireAdmin, getTableQRCodes);
export default router;

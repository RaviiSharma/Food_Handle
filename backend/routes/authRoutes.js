import express from "express";

import {
  getSetupStatus,
  setupAdmin,
  loginAdmin,
} from "../controllers/authController.js";

const router = express.Router();

// Check whether first-time admin setup is required
router.get("/setup-status", getSetupStatus);

// Create first admin account
router.post("/setup", setupAdmin);

// Admin login
router.post("/login", loginAdmin);

export default router;
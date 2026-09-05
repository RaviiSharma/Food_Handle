import { Router } from "express";

import {
  getMenu,
  getAllMenu,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/menuController.js";

import { requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// ======================================================
// CUSTOMER
// ======================================================

// Get only available menu items
router.get("/", getMenu);

// ======================================================
// ADMIN
// ======================================================

// Get all menu items
router.get("/admin/all", requireAdmin, getAllMenu);

// Create food item
router.post("/", requireAdmin, createItem);

// Update food item
router.put("/:id", requireAdmin, updateItem);

// Delete food item
router.delete("/:id", requireAdmin, deleteItem);

export default router;

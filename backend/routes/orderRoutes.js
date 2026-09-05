import { Router } from "express";

import {
  createOrder,
  getOrders,
  getOrder,
  updateOrderStatus,
  deleteOrder,
} from "../controllers/orderController.js";

import {
  requireAdmin,
} from "../middleware/authMiddleware.js";

const router = Router();

// ======================================================
// CUSTOMER
// ======================================================

// Customer creates order
router.post(
  "/",
  createOrder
);

// ======================================================
// ADMIN
// ======================================================

// Get all orders
router.get(
  "/",
  requireAdmin,
  getOrders
);

// Get single order
router.get(
  "/:id",
  requireAdmin,
  getOrder
);

// Update order status
router.patch(
  "/:id/status",
  requireAdmin,
  updateOrderStatus
);

// Delete order
router.delete(
  "/:id",
  requireAdmin,
  deleteOrder
);

export default router;
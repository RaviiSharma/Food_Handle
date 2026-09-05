import mongoose from "mongoose";
import Order from "../models/Order.js";
import MenuItem from "../models/MenuItem.js";


// ======================================================
// CONSTANTS
// ======================================================

const MAX_QUANTITY = 50;
const MAX_CART_ITEMS = 50;
const MIN_TABLE_NUMBER = 1;
const MAX_TABLE_NUMBER = 10;

const ALLOWED_STATUSES = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];


// ======================================================
// HELPERS
// ======================================================

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validationError(res, message, field = null) {
  return res.status(400).json({
    success: false,
    message,
    ...(field && { field }),
  });
}


// ======================================================
// CREATE ORDER
// POST /api/orders
// ======================================================

export async function createOrder(req, res) {
  try {
    const {
      tableNumber,
      items,
    } = req.body || {};


    // ==================================================
    // TABLE NUMBER
    // ==================================================

    if (
      tableNumber === undefined ||
      tableNumber === null ||
      tableNumber === ""
    ) {
      return validationError(
        res,
        "Table number is required.",
        "tableNumber"
      );
    }


    // Strict number validation
    if (typeof tableNumber !== "number") {
      return validationError(
        res,
        "Table number must be a number.",
        "tableNumber"
      );
    }


    if (!Number.isInteger(tableNumber)) {
      return validationError(
        res,
        "Table number must be a whole number.",
        "tableNumber"
      );
    }


    if (
      tableNumber < MIN_TABLE_NUMBER ||
      tableNumber > MAX_TABLE_NUMBER
    ) {
      return validationError(
        res,
        `Table number must be between ${MIN_TABLE_NUMBER} and ${MAX_TABLE_NUMBER}.`,
        "tableNumber"
      );
    }


    // ==================================================
    // ITEMS
    // ==================================================

    if (!Array.isArray(items)) {
      return validationError(
        res,
        "Order items must be an array.",
        "items"
      );
    }


    if (items.length === 0) {
      return validationError(
        res,
        "Your cart is empty.",
        "items"
      );
    }


    if (items.length > MAX_CART_ITEMS) {
      return validationError(
        res,
        `You can order a maximum of ${MAX_CART_ITEMS} different items.`,
        "items"
      );
    }


    // ==================================================
    // VALIDATE EACH ITEM
    // ==================================================

    const menuItemIds = new Set();


    for (const item of items) {

      if (
        !item ||
        typeof item !== "object" ||
        Array.isArray(item)
      ) {
        return validationError(
          res,
          "Invalid item found in your cart.",
          "items"
        );
      }


      // ----------------------------------------------
      // MENU ITEM ID
      // ----------------------------------------------

      if (!item.menuItem) {
        return validationError(
          res,
          "Menu item ID is required.",
          "menuItem"
        );
      }


      if (!isValidObjectId(item.menuItem)) {
        return validationError(
          res,
          "Invalid menu item ID.",
          "menuItem"
        );
      }


      // ----------------------------------------------
      // DUPLICATE ITEM
      // ----------------------------------------------

      const id = String(item.menuItem);

      if (menuItemIds.has(id)) {
        return validationError(
          res,
          "Duplicate item found in your cart.",
          "items"
        );
      }

      menuItemIds.add(id);


      // ----------------------------------------------
      // QUANTITY
      // ----------------------------------------------

      if (typeof item.quantity !== "number") {
        return validationError(
          res,
          "Quantity must be a number.",
          "quantity"
        );
      }


      if (!Number.isInteger(item.quantity)) {
        return validationError(
          res,
          "Quantity must be a whole number.",
          "quantity"
        );
      }


      if (
        item.quantity < 1 ||
        item.quantity > MAX_QUANTITY
      ) {
        return validationError(
          res,
          `Quantity must be between 1 and ${MAX_QUANTITY}.`,
          "quantity"
        );
      }
    }


    // ==================================================
    // FETCH REAL MENU ITEMS
    // ==================================================

    const dbItems = await MenuItem.find({
      _id: {
        $in: [...menuItemIds],
      },
      available: true,
    });


    const menuMap = new Map(
      dbItems.map((item) => [
        String(item._id),
        item,
      ])
    );


    // ==================================================
    // NORMALIZE ORDER
    // ==================================================

    const normalizedItems = [];


    for (const input of items) {

      const dbItem = menuMap.get(
        String(input.menuItem)
      );


      if (!dbItem) {
        return validationError(
          res,
          "One or more selected food items are no longer available."
        );
      }


      normalizedItems.push({
        menuItem: dbItem._id,
        name: dbItem.name,
        price: dbItem.price,
        quantity: input.quantity,
      });
    }


    // ==================================================
    // TOTAL
    // ==================================================

    const totalAmount =
      normalizedItems.reduce(
        (sum, item) =>
          sum +
          item.price *
            item.quantity,
        0
      );


    if (
      !Number.isFinite(totalAmount) ||
      totalAmount < 0
    ) {
      return validationError(
        res,
        "Unable to calculate order total."
      );
    }


    // ==================================================
    // CREATE ORDER
    // ==================================================

    const order = await Order.create({
      tableNumber,
      items: normalizedItems,
      totalAmount,
    });


    return res.status(201).json({
      success: true,
      message: `Order placed successfully for Table ${tableNumber}.`,
      data: order,
    });

  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);


    if (
      error instanceof mongoose.Error.ValidationError
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order data. Please check your order details.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "Unable to place your order right now. Please try again later.",
    });
  }
}


// ======================================================
// GET ALL ORDERS
// GET /api/orders
// ======================================================

export async function getOrders(req, res) {
  try {

    const orders = await Order.find()
      .sort({
        createdAt: -1,
      });


    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });

  } catch (error) {
    console.error("GET ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        "Unable to load orders right now. Please try again later.",
    });
  }
}


// ======================================================
// GET SINGLE ORDER
// GET /api/orders/:id
// ======================================================

export async function getOrder(req, res) {
  try {

    const { id } = req.params;


    if (!isValidObjectId(id)) {
      return validationError(
        res,
        "Invalid order ID."
      );
    }


    const order =
      await Order.findById(id);


    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }


    return res.status(200).json({
      success: true,
      data: order,
    });

  } catch (error) {
    console.error("GET ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        "Unable to load the order right now. Please try again later.",
    });
  }
}


// ======================================================
// UPDATE ORDER STATUS
// PATCH /api/orders/:id/status
// ======================================================

export async function updateOrderStatus(req, res) {
  try {

    const { id } = req.params;
    const { status } = req.body || {};


    // ----------------------------------------------
    // ID
    // ----------------------------------------------

    if (!isValidObjectId(id)) {
      return validationError(
        res,
        "Invalid order ID."
      );
    }


    // ----------------------------------------------
    // STATUS TYPE
    // ----------------------------------------------

    if (typeof status !== "string") {
      return validationError(
        res,
        "Order status must be a string.",
        "status"
      );
    }


    // ----------------------------------------------
    // STATUS VALUE
    // ----------------------------------------------

    if (!ALLOWED_STATUSES.includes(status)) {
      return validationError(
        res,
        `Invalid order status. Allowed values are: ${ALLOWED_STATUSES.join(", ")}.`,
        "status"
      );
    }


    // ----------------------------------------------
    // UPDATE
    // ----------------------------------------------

    const order =
      await Order.findByIdAndUpdate(
        id,
        {
          status,
        },
        {
          new: true,
          runValidators: true,
        }
      );


    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }


    return res.status(200).json({
      success: true,
      message:
        "Order status updated successfully.",
      data: order,
    });

  } catch (error) {
    console.error(
      "UPDATE ORDER STATUS ERROR:",
      error
    );


    if (
      error instanceof mongoose.Error.ValidationError
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid order status.",
      });
    }


    return res.status(500).json({
      success: false,
      message:
        "Unable to update order status right now. Please try again later.",
    });
  }
}


// ======================================================
// DELETE ORDER
// DELETE /api/orders/:id
// ======================================================

export async function deleteOrder(req, res) {
  try {

    const { id } = req.params;


    if (!isValidObjectId(id)) {
      return validationError(
        res,
        "Invalid order ID."
      );
    }


    const order =
      await Order.findByIdAndDelete(id);


    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }


    return res.status(200).json({
      success: true,
      message: "Order deleted successfully.",
    });

  } catch (error) {
    console.error("DELETE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete the order right now. Please try again later.",
    });
  }
}
import mongoose from "mongoose";
import MenuItem from "../models/MenuItem.js";

// ======================================================
// CONSTANTS
// ======================================================

const MAX_NAME_LENGTH = 100;
const MAX_CATEGORY_LENGTH = 50;
const MAX_DESCRIPTION_LENGTH = 500;
const MAX_IMAGE_LENGTH = 2000;
const MAX_PRICE = 100000;

const ALLOWED_CATEGORIES = [
  "Egg",
  "Chicken",
  "Paneer",
  "Mushroom",
  "Chinese",
  "South Indian",
  "Pizza & Burger",
  "Snacks",
  "Ice Cream",
  "Drinks",
];

// ======================================================
// HELPERS
// ======================================================

function isNonEmptyString(value) {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function isValidPrice(value) {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAX_PRICE
  );
}

function isValidImage(value) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return true;
  }

  if (typeof value !== "string") {
    return false;
  }

  if (value.length > MAX_IMAGE_LENGTH) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validationError(
  res,
  message,
  field = null,
) {
  return res.status(400).json({
    success: false,
    message,
    ...(field && { field }),
  });
}

// ======================================================
// GET AVAILABLE MENU
// GET /api/menu
// ======================================================

export async function getMenu(req, res) {
  try {
    const items = await MenuItem.find(
      { available: true },
      {
        name: 1,
        category: 1,
        price: 1,
        description: 1,
        image: 1,
        available: 1,
      },
    )
      .sort({
        category: 1,
        name: 1,
      })
      .lean();

    // Prevent stale customer menu cache
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate",
    );

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("GET MENU ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        "Unable to load the menu right now. Please try again later.",
    });
  }
}

// ======================================================
// GET ALL MENU - ADMIN
// GET /api/menu/admin/all
// ======================================================

export async function getAllMenu(req, res) {
  try {
    const items = await MenuItem.find(
      {},
      {
        name: 1,
        category: 1,
        price: 1,
        description: 1,
        image: 1,
        available: 1,
      },
    )
      .sort({
        category: 1,
        name: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error(
      "GET ADMIN MENU ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load the admin menu right now. Please try again later.",
    });
  }
}

// ======================================================
// CREATE MENU ITEM
// POST /api/menu
// ======================================================

export async function createItem(req, res) {
  try {
    const {
      name,
      category,
      price,
      description,
      image,
      available,
    } = req.body || {};

    if (!isNonEmptyString(name)) {
      return validationError(
        res,
        "Food name is required.",
        "name",
      );
    }

    if (
      name.trim().length > MAX_NAME_LENGTH
    ) {
      return validationError(
        res,
        `Food name cannot exceed ${MAX_NAME_LENGTH} characters.`,
        "name",
      );
    }

    if (!isNonEmptyString(category)) {
      return validationError(
        res,
        "Food category is required.",
        "category",
      );
    }

    if (
      category.trim().length >
      MAX_CATEGORY_LENGTH
    ) {
      return validationError(
        res,
        `Category cannot exceed ${MAX_CATEGORY_LENGTH} characters.`,
        "category",
      );
    }

    if (
      !ALLOWED_CATEGORIES.includes(
        category.trim(),
      )
    ) {
      return validationError(
        res,
        `Invalid category. Allowed categories are: ${ALLOWED_CATEGORIES.join(", ")}.`,
        "category",
      );
    }

    if (typeof price !== "number") {
      return validationError(
        res,
        "Price must be a number. Example: 60.",
        "price",
      );
    }

    if (!Number.isFinite(price)) {
      return validationError(
        res,
        "Price must be a valid number.",
        "price",
      );
    }

    if (price < 0) {
      return validationError(
        res,
        "Price cannot be negative.",
        "price",
      );
    }

    if (price > MAX_PRICE) {
      return validationError(
        res,
        `Price cannot exceed ₹${MAX_PRICE}.`,
        "price",
      );
    }

    if (
      description !== undefined &&
      description !== null &&
      typeof description !== "string"
    ) {
      return validationError(
        res,
        "Description must be a string.",
        "description",
      );
    }

    if (
      typeof description === "string" &&
      description.length >
        MAX_DESCRIPTION_LENGTH
    ) {
      return validationError(
        res,
        `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
        "description",
      );
    }

    if (!isValidImage(image)) {
      return validationError(
        res,
        "Image must be a valid HTTP or HTTPS URL.",
        "image",
      );
    }

    if (
      available !== undefined &&
      typeof available !== "boolean"
    ) {
      return validationError(
        res,
        "Available must be true or false.",
        "available",
      );
    }

    const item = await MenuItem.create({
      name: name.trim(),
      category: category.trim(),
      price,
      description:
        typeof description === "string"
          ? description.trim()
          : "",
      image: image || "",
      available:
        available !== undefined
          ? available
          : true,
    });

    return res.status(201).json({
      success: true,
      message:
        "Food item created successfully.",
      data: item,
    });
  } catch (error) {
    console.error(
      "CREATE MENU ITEM ERROR:",
      error,
    );

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "A food item with the same details already exists.",
      });
    }

    if (
      error instanceof
      mongoose.Error.ValidationError
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid food item data. Please check all fields.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create the food item right now. Please try again later.",
    });
  }
}

// ======================================================
// UPDATE MENU ITEM
// PUT /api/menu/:id
// ======================================================

export async function updateItem(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return validationError(
        res,
        "Invalid food item ID.",
      );
    }

    const {
      name,
      category,
      price,
      description,
      image,
      available,
    } = req.body || {};

    if (
      Object.keys(req.body || {}).length === 0
    ) {
      return validationError(
        res,
        "At least one field is required to update the food item.",
      );
    }

    if (name !== undefined) {
      if (!isNonEmptyString(name)) {
        return validationError(
          res,
          "Food name cannot be empty.",
          "name",
        );
      }

      if (
        name.trim().length >
        MAX_NAME_LENGTH
      ) {
        return validationError(
          res,
          `Food name cannot exceed ${MAX_NAME_LENGTH} characters.`,
          "name",
        );
      }
    }

    if (category !== undefined) {
      if (!isNonEmptyString(category)) {
        return validationError(
          res,
          "Category cannot be empty.",
          "category",
        );
      }

      if (
        category.trim().length >
        MAX_CATEGORY_LENGTH
      ) {
        return validationError(
          res,
          `Category cannot exceed ${MAX_CATEGORY_LENGTH} characters.`,
          "category",
        );
      }

      if (
        !ALLOWED_CATEGORIES.includes(
          category.trim(),
        )
      ) {
        return validationError(
          res,
          `Invalid category. Allowed categories are: ${ALLOWED_CATEGORIES.join(", ")}.`,
          "category",
        );
      }
    }

    if (price !== undefined) {
      if (!isValidPrice(price)) {
        return validationError(
          res,
          "Price must be a valid number between ₹0 and ₹100000.",
          "price",
        );
      }
    }

    if (
      description !== undefined &&
      typeof description !== "string"
    ) {
      return validationError(
        res,
        "Description must be a string.",
        "description",
      );
    }

    if (
      typeof description === "string" &&
      description.length >
        MAX_DESCRIPTION_LENGTH
    ) {
      return validationError(
        res,
        `Description cannot exceed ${MAX_DESCRIPTION_LENGTH} characters.`,
        "description",
      );
    }

    if (
      image !== undefined &&
      !isValidImage(image)
    ) {
      return validationError(
        res,
        "Image must be a valid HTTP or HTTPS URL.",
        "image",
      );
    }

    if (
      available !== undefined &&
      typeof available !== "boolean"
    ) {
      return validationError(
        res,
        "Available must be true or false.",
        "available",
      );
    }

    const updateData = {};

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (category !== undefined) {
      updateData.category =
        category.trim();
    }

    if (price !== undefined) {
      updateData.price = price;
    }

    if (description !== undefined) {
      updateData.description =
        description.trim();
    }

    if (image !== undefined) {
      updateData.image = image;
    }

    if (available !== undefined) {
      updateData.available = available;
    }

    const item =
      await MenuItem.findByIdAndUpdate(
        id,
        updateData,
        {
          new: true,
          runValidators: true,
        },
      );

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Food item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Food item updated successfully.",
      data: item,
    });
  } catch (error) {
    console.error(
      "UPDATE MENU ITEM ERROR:",
      error,
    );

    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Another food item with the same details already exists.",
      });
    }

    if (
      error instanceof
      mongoose.Error.ValidationError
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid food item data. Please check all fields.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to update the food item right now. Please try again later.",
    });
  }
}

// ======================================================
// DELETE MENU ITEM
// DELETE /api/menu/:id
// ======================================================

export async function deleteItem(req, res) {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return validationError(
        res,
        "Invalid food item ID.",
      );
    }

    const item =
      await MenuItem.findByIdAndDelete(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message:
          "Food item not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Food item deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE MENU ITEM ERROR:",
      error,
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to delete the food item right now. Please try again later.",
    });
  }
}
import "dotenv/config";

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// ======================================================
// ADMIN MODEL
// ======================================================
//
// We keep the model here so this auth controller can work
// with the existing project without requiring another file.
//
// Collection: admins
// ======================================================

const adminSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 50,
      lowercase: true,
    },

    passwordHash: {
      type: String,
      required: true,
      select: false,
    },

    // Used to guarantee that only one primary admin
    // can be created through the setup flow.
    setupKey: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },

    role: {
      type: String,
      default: "admin",
      enum: ["admin"],
    },
  },
  {
    timestamps: true,
  },
);

const Admin =
  mongoose.models.Admin ||
  mongoose.model("Admin", adminSchema);

// ======================================================
// CONSTANTS
// ======================================================

const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 50;

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN || "1d";

// ======================================================
// HELPERS
// ======================================================

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET is missing or too short. Use a secret with at least 32 characters.",
    );
  }

  return secret;
}

function normalizeUsername(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidUsername(username) {
  return /^[a-z0-9._-]+$/.test(username);
}

function createToken(admin) {
  return jwt.sign(
    {
      id: admin._id.toString(),
      username: admin.username,
      role: admin.role || "admin",
    },
    getJwtSecret(),
    {
      expiresIn: JWT_EXPIRES_IN,
    },
  );
}

function safeAdmin(admin) {
  return {
    id: admin._id,
    username: admin.username,
    role: admin.role || "admin",
  };
}

// ======================================================
// GET SETUP STATUS
// GET /api/auth/setup-status
// ======================================================

export async function getSetupStatus(req, res) {
  try {
    const adminExists = await Admin.exists({});

    return res.status(200).json({
      success: true,
      setupRequired: !adminExists,
    });
  } catch (error) {
    console.error("GET SETUP STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        "Unable to check admin setup status.",
    });
  }
}

// ======================================================
// FIRST ADMIN SETUP
// POST /api/auth/setup
// ======================================================

export async function setupAdmin(req, res) {
  try {
    const username = normalizeUsername(
      req.body?.username,
    );

    const password = String(
      req.body?.password || "",
    );

    const confirmPassword = String(
      req.body?.confirmPassword || "",
    );

    // --------------------------------------------------
    // BASIC VALIDATION
    // --------------------------------------------------

    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username is required.",
        field: "username",
      });
    }

    if (
      username.length < MIN_USERNAME_LENGTH ||
      username.length > MAX_USERNAME_LENGTH
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Username must be between 3 and 50 characters.",
        field: "username",
      });
    }

    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        message:
          "Username can contain only letters, numbers, dot, underscore and hyphen.",
        field: "username",
      });
    }

    if (!password) {
      return res.status(400).json({
        success: false,
        message: "Password is required.",
        field: "password",
      });
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 8 characters.",
        field: "password",
      });
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return res.status(400).json({
        success: false,
        message:
          "Password cannot exceed 128 characters.",
        field: "password",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match.",
        field: "confirmPassword",
      });
    }

    // --------------------------------------------------
    // ONLY ONE ADMIN
    // --------------------------------------------------

    const existingAdmin = await Admin.findOne({})
      .select("_id")
      .lean();

    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        message:
          "Admin setup has already been completed. Please login.",
        setupRequired: false,
      });
    }

    // --------------------------------------------------
    // CHECK USERNAME
    // --------------------------------------------------

    const usernameExists = await Admin.findOne({
      username,
    })
      .select("_id")
      .lean();

    if (usernameExists) {
      return res.status(409).json({
        success: false,
        message: "This username is already in use.",
        field: "username",
      });
    }

    // --------------------------------------------------
    // HASH PASSWORD
    // --------------------------------------------------

    const passwordHash = await bcrypt.hash(
      password,
      12,
    );

    // --------------------------------------------------
    // CREATE PRIMARY ADMIN
    // --------------------------------------------------

    const admin = await Admin.create({
      username,
      passwordHash,
      setupKey: "primary-admin",
      role: "admin",
    });

    // --------------------------------------------------
    // LOGIN IMMEDIATELY AFTER SETUP
    // --------------------------------------------------

    const token = createToken(admin);

    return res.status(201).json({
      success: true,
      message: "Admin account created successfully.",
      token,
      admin: safeAdmin(admin),
    });
  } catch (error) {
    console.error("ADMIN SETUP ERROR:", error);

    // Unique username/setupKey race-condition protection
    if (error?.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "Admin setup has already been completed. Please login.",
        setupRequired: false,
      });
    }

    if (
      error.message?.includes("JWT_SECRET")
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Server authentication configuration is incomplete.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to create admin account. Please try again.",
    });
  }
}

// ======================================================
// ADMIN LOGIN
// POST /api/auth/login
// ======================================================

export async function loginAdmin(req, res) {
  try {
    const username = normalizeUsername(
      req.body?.username,
    );

    const password = String(
      req.body?.password || "",
    );

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message:
          "Username and password are required.",
      });
    }

    // --------------------------------------------------
    // FIND ADMIN
    // --------------------------------------------------

    const admin = await Admin.findOne({
      username,
    }).select("+passwordHash");

    // Same response for username/password failure
    // to avoid revealing which usernames exist.
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // --------------------------------------------------
    // PASSWORD CHECK
    // --------------------------------------------------

    const passwordMatches =
      await bcrypt.compare(
        password,
        admin.passwordHash,
      );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid username or password.",
      });
    }

    // --------------------------------------------------
    // CREATE JWT
    // --------------------------------------------------

    const token = createToken(admin);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      admin: safeAdmin(admin),
    });
  } catch (error) {
    console.error("ADMIN LOGIN ERROR:", error);

    if (
      error.message?.includes("JWT_SECRET")
    ) {
      return res.status(500).json({
        success: false,
        message:
          "Server authentication configuration is incomplete.",
      });
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to login right now. Please try again.",
    });
  }
}

// ======================================================
// SEED ADMIN
//
// server.js already calls this function.
//
// IMPORTANT:
// We DO NOT automatically create an admin here.
// The first admin must be created from /admin/setup.
// ======================================================

export async function seedAdmin() {
  try {
    const adminExists = await Admin.exists({});

    if (adminExists) {
      console.log("Admin account already configured.");
    } else {
      console.log(
        "No admin account found. Complete setup at /admin/setup",
      );
    }
  } catch (error) {
    console.error(
      "Admin setup status check failed:",
      error.message,
    );
  }
}
import "dotenv/config";

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";

import { seedAdmin } from "./controllers/authController.js";

const app = express();

// ======================================================
// CORS
// ======================================================

const allowedOrigins = (
  process.env.CLIENT_URL ||
  "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error(
        `CORS blocked origin: ${origin}`,
      );

      return callback(
        new Error("Not allowed by CORS"),
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  }),
);

// ======================================================
// BODY PARSER
// ======================================================

app.use(
  express.json({
    limit: "1mb",
  }),
);

// ======================================================
// HEALTH CHECK
// ======================================================

app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "Food Center API",
  });
});

// ======================================================
// API ROUTES
// ======================================================

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/tables", tableRoutes);

// ======================================================
// 404
// ======================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

// ======================================================
// ERROR HANDLER
// ======================================================

app.use((err, req, res, next) => {
  console.error(
    "Server error:",
    err.message,
  );

  if (
    err.message ===
    "Not allowed by CORS"
  ) {
    return res.status(403).json({
      success: false,
      message:
        "Request blocked by server security policy.",
    });
  }

  if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    err.type === "entity.parse.failed"
  ) {
    return res.status(400).json({
      success: false,
      message:
        "Invalid JSON request.",
    });
  }

  return res.status(500).json({
    success: false,
    message:
      "Internal server error. Please try again.",
  });
});

// ======================================================
// SERVER + DATABASE
// ======================================================

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI,
    );

    console.log("MongoDB connected");

    await seedAdmin();

    app.listen(PORT, () => {
      console.log(
        `API running on port ${PORT}`,
      );

      console.log(
        "Allowed frontend origins:",
        allowedOrigins,
      );
    });
  } catch (error) {
    console.error(
      "MongoDB connection failed:",
      error.message,
    );

    process.exit(1);
  }
}

startServer();
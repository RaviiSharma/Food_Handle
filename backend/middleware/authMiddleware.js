import jwt from "jsonwebtoken";

export function requireAdmin(req, res, next) {
  try {
    const authorization =
      req.headers.authorization;

    // Authorization header missing
    if (!authorization) {
      return res.status(401).json({
        message: "Admin login required.",
      });
    }

    // Wrong authorization format
    if (
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        message: "Invalid authorization format.",
      });
    }

    const token =
      authorization.slice(7).trim();

    // Empty token
    if (!token) {
      return res.status(401).json({
        message: "Admin login required.",
      });
    }

    // JWT secret missing
    if (!process.env.JWT_SECRET) {
      console.error(
        "JWT_SECRET is not configured."
      );

      return res.status(500).json({
        message:
          "Authentication service is not configured.",
      });
    }

    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Token payload invalid
    if (!payload || typeof payload !== "object") {
      return res.status(401).json({
        message: "Invalid authentication token.",
      });
    }

    // Admin role required
    if (payload.role !== "admin") {
      return res.status(403).json({
        message:
          "Access denied. Admin permission required.",
      });
    }

    // Attach admin information
    req.admin = payload;

    next();
  } catch (error) {
    console.error(
      "Admin authentication error:",
      error.message
    );

    if (
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        message:
          "Your admin session has expired. Please login again.",
      });
    }

    if (
      error.name === "JsonWebTokenError"
    ) {
      return res.status(401).json({
        message:
          "Invalid admin authentication token.",
      });
    }

    return res.status(401).json({
      message:
        "Authentication failed. Please login again.",
    });
  }
}
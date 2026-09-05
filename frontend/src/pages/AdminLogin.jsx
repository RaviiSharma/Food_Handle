import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api.js";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");

  const [error, setError] = useState("");

  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();

    setError("");

    if (!email.trim()) {
      setError("Email address is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
      });

      if (!response.data?.token) {
        setError("Login failed. Authentication token was not received.");
        return;
      }

      localStorage.setItem("adminToken", response.data.token);

      navigate("/admin/orders", { replace: true });
    } catch (error) {
      console.error("Admin login error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to login. Please check your credentials.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <Link to="/" className="brand">
          🍽️ Food Center
        </Link>

        <h1>Admin Login</h1>

        <p>Sign in to manage your restaurant.</p>

        <label>Email</label>

        <input
          type="email"
          placeholder="admin@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>Password</label>

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <div className="error-box">{error}</div>}

        <button className="primary-btn full" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <Link to="/" className="back-link">
          ← Back to website
        </Link>
      </form>
    </div>
  );
}

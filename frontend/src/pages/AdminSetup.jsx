import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api.js";

export default function AdminSetup() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [checking, setChecking] = useState(true);
  const [creating, setCreating] = useState(false);

  const [error, setError] = useState("");

  // ======================================================
  // CHECK WHETHER SETUP IS STILL REQUIRED
  // ======================================================

  useEffect(() => {
    let mounted = true;

    async function checkSetup() {
      try {
        const response = await api.get(
          "/auth/setup-status",
        );

        if (!mounted) return;

        const setupRequired =
          response.data?.setupRequired === true;

        if (!setupRequired) {
          navigate("/admin/login", {
            replace: true,
          });

          return;
        }
      } catch (error) {
        console.error(
          "Setup status error:",
          error,
        );

        if (!mounted) return;

        setError(
          error.response?.data?.message ||
            "Unable to connect to the server.",
        );
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    checkSetup();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  // ======================================================
  // CREATE ADMIN
  // ======================================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (creating) return;

    setError("");

    const cleanUsername = username
      .trim()
      .toLowerCase();

    // --------------------------------------------------
    // FRONTEND VALIDATION
    // --------------------------------------------------

    if (!cleanUsername) {
      setError("Username is required.");
      return;
    }

    if (cleanUsername.length < 3) {
      setError(
        "Username must contain at least 3 characters.",
      );
      return;
    }

    if (cleanUsername.length > 50) {
      setError(
        "Username cannot exceed 50 characters.",
      );
      return;
    }

    if (!/^[a-z0-9._-]+$/.test(cleanUsername)) {
      setError(
        "Username can contain only letters, numbers, dot, underscore and hyphen.",
      );
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password.length < 8) {
      setError(
        "Password must contain at least 8 characters.",
      );
      return;
    }

    if (password.length > 128) {
      setError(
        "Password cannot exceed 128 characters.",
      );
      return;
    }

    if (!confirmPassword) {
      setError(
        "Please confirm your password.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // --------------------------------------------------
    // API
    // --------------------------------------------------

    try {
      setCreating(true);

      const response = await api.post(
        "/auth/setup",
        {
          username: cleanUsername,
          password,
          confirmPassword,
        },
      );

      const token = response.data?.token;

      if (!token) {
        throw new Error(
          "Authentication token was not received.",
        );
      }

      // ------------------------------------------------
      // SAVE TOKEN
      // ------------------------------------------------

      localStorage.setItem(
        "adminToken",
        token,
      );

      const admin = response.data?.admin;

      if (admin) {
        localStorage.setItem(
          "adminUser",
          JSON.stringify(admin),
        );
      }

      // ------------------------------------------------
      // GO TO DASHBOARD
      // ------------------------------------------------

      navigate("/admin/orders", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Admin setup error:",
        error,
      );

      setError(
        error.response?.data?.message ||
          "Unable to create admin account. Please try again.",
      );
    } finally {
      setCreating(false);
    }
  }

  // ======================================================
  // CHECKING
  // ======================================================

  if (checking) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.logo}>🍽️</div>

          <h1 style={styles.title}>
            Food Center
          </h1>

          <p style={styles.subtitle}>
            Checking setup status...
          </p>

          <div style={styles.loader} />
        </div>
      </div>
    );
  }

  // ======================================================
  // PAGE
  // ======================================================

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* BRAND */}

        <div style={styles.logo}>🍽️</div>

        <h1 style={styles.title}>
          Food Center
        </h1>

        <p style={styles.subtitle}>
          First-time Admin Setup
        </p>

        <div style={styles.divider} />

        <h2 style={styles.heading}>
          Create Admin Account
        </h2>

        <p style={styles.description}>
          This account will be used to manage
          your restaurant menu, orders and table
          QR codes.
        </p>

        {/* SECURITY NOTICE */}

        <div style={styles.notice}>
          <span>🔐</span>

          <div>
            <strong style={styles.noticeTitle}>
              One-time setup
            </strong>

            <p style={styles.noticeText}>
              After this account is created,
              public admin signup will be
              disabled.
            </p>
          </div>
        </div>

        {/* ERROR */}

        {error && (
          <div style={styles.error}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* FORM */}

        <form
          onSubmit={handleSubmit}
          style={styles.form}
        >
          {/* USERNAME */}

          <div style={styles.field}>
            <label style={styles.label}>
              Admin Username
            </label>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                setUsername(event.target.value)
              }
              placeholder="e.g. admin"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck="false"
              disabled={creating}
              maxLength={50}
              style={styles.input}
            />

            <small style={styles.help}>
              3–50 characters. Letters, numbers,
              dot, underscore and hyphen only.
            </small>
          </div>

          {/* PASSWORD */}

          <div style={styles.field}>
            <label style={styles.label}>
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              disabled={creating}
              maxLength={128}
              style={styles.input}
            />
          </div>

          {/* CONFIRM PASSWORD */}

          <div style={styles.field}>
            <label style={styles.label}>
              Confirm Password
            </label>

            <input
              type="password"
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value,
                )
              }
              placeholder="Re-enter password"
              autoComplete="new-password"
              disabled={creating}
              maxLength={128}
              style={styles.input}
            />
          </div>

          {/* BUTTON */}

          <button
            type="submit"
            disabled={creating}
            style={{
              ...styles.button,
              opacity: creating ? 0.65 : 1,
            }}
          >
            {creating
              ? "Creating Account..."
              : "Create Admin Account"}
          </button>
        </form>

        <Link
          to="/admin/login"
          style={styles.backLink}
        >
          Already have an admin account? Login
        </Link>
      </div>
    </div>
  );
}

// ======================================================
// STYLES
// ======================================================

const styles = {
  page: {
    minHeight: "100vh",
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    boxSizing: "border-box",
    background:
      "linear-gradient(135deg, #f7f7f8 0%, #ececef 100%)",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: "460px",
    background: "#ffffff",
    border: "1px solid #e7e7ea",
    borderRadius: "18px",
    padding: "36px",
    boxSizing: "border-box",
    boxShadow:
      "0 18px 50px rgba(0, 0, 0, 0.08)",
  },

  logo: {
    width: "56px",
    height: "56px",
    margin: "0 auto 14px",
    borderRadius: "15px",
    display: "grid",
    placeItems: "center",
    background: "#111113",
    color: "#ffffff",
    fontSize: "27px",
  },

  title: {
    margin: 0,
    textAlign: "center",
    color: "#111113",
    fontSize: "26px",
    fontWeight: 800,
    letterSpacing: "-0.6px",
  },

  subtitle: {
    margin: "5px 0 0",
    textAlign: "center",
    color: "#777780",
    fontSize: "13px",
  },

  divider: {
    height: "1px",
    background: "#eeeeef",
    margin: "26px 0",
  },

  heading: {
    margin: 0,
    color: "#18181b",
    fontSize: "21px",
    fontWeight: 750,
  },

  description: {
    margin: "6px 0 19px",
    color: "#777780",
    fontSize: "13px",
    lineHeight: 1.55,
  },

  notice: {
    display: "flex",
    gap: "10px",
    alignItems: "flex-start",
    padding: "12px 13px",
    marginBottom: "17px",
    borderRadius: "10px",
    border: "1px solid #e4e4e7",
    background: "#f8f8f9",
    color: "#303038",
  },

  noticeTitle: {
    display: "block",
    fontSize: "12px",
    marginBottom: "3px",
  },

  noticeText: {
    margin: 0,
    color: "#707078",
    fontSize: "11px",
    lineHeight: 1.45,
  },

  error: {
    display: "flex",
    gap: "9px",
    alignItems: "flex-start",
    padding: "12px 13px",
    marginBottom: "17px",
    borderRadius: "10px",
    border: "1px solid #fecaca",
    background: "#fff1f2",
    color: "#991b1b",
    fontSize: "13px",
    lineHeight: 1.45,
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "17px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  label: {
    fontSize: "13px",
    fontWeight: 700,
    color: "#303038",
  },

  input: {
    width: "100%",
    minHeight: "46px",
    padding: "0 13px",
    boxSizing: "border-box",
    border: "1px solid #dcdce1",
    borderRadius: "9px",
    outline: "none",
    background: "#ffffff",
    color: "#18181b",
    fontSize: "14px",
  },

  help: {
    color: "#85858d",
    fontSize: "11px",
    lineHeight: 1.4,
  },

  button: {
    width: "100%",
    minHeight: "47px",
    border: 0,
    borderRadius: "9px",
    background: "#111113",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 750,
    cursor: "pointer",
    marginTop: "3px",
  },

  backLink: {
    display: "block",
    marginTop: "22px",
    textAlign: "center",
    color: "#66666e",
    fontSize: "13px",
    textDecoration: "none",
  },

  loader: {
    width: "22px",
    height: "22px",
    margin: "22px auto 0",
    border: "3px solid #e5e5e7",
    borderTopColor: "#111113",
    borderRadius: "50%",
  },
};
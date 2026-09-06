import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import "./styles.css";

import HomePage from "./pages/HomePage.jsx";
import MenuPage from "./pages/MenuPage.jsx";
import OrderPage from "./pages/OrderPage.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import AdminSetup from "./pages/AdminSetup.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

import { CartProvider } from "./context/CartContext.jsx";
import api from "./api.js";


// ======================================================
// ADMIN ENTRY
// ======================================================

function AdminEntry() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAdminAccess() {
      try {
        // ----------------------------------------------
        // 1. Already logged in?
        // ----------------------------------------------

        const token = localStorage.getItem("adminToken");

        if (token) {
          navigate("/admin/orders", {
            replace: true,
          });

          return;
        }

        // ----------------------------------------------
        // 2. Check first-time setup
        // ----------------------------------------------

        const response = await api.get(
          "/auth/setup-status"
        );

        if (!mounted) return;

        const setupRequired =
          response.data?.setupRequired === true;

        if (setupRequired) {
          navigate("/admin/setup", {
            replace: true,
          });

          return;
        }

        // ----------------------------------------------
        // 3. Admin already exists
        // ----------------------------------------------

        navigate("/admin/login", {
          replace: true,
        });
      } catch (error) {
        console.error(
          "Admin entry error:",
          error
        );

        if (!mounted) return;

        // If API is unavailable, send to login
        navigate("/admin/login", {
          replace: true,
        });
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkAdminAccess();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "Inter, system-ui, sans-serif",
          background: "#f7f7f8",
          color: "#111113",
        }}
      >
        Checking admin access...
      </div>
    );
  }

  return null;
}


// ======================================================
// PROTECTED ADMIN
// ======================================================

function ProtectedAdmin() {
  const token =
    localStorage.getItem("adminToken");

  if (!token) {
    return (
      <Navigate
        to="/admin/login"
        replace
      />
    );
  }

  return <AdminDashboard />;
}


// ======================================================
// APP
// ======================================================

function App() {
  return (
    <Routes>

      {/* ==================================================
          ROOT → ADMIN ENTRY
      ================================================== */}

      <Route
        path="/"
        element={<AdminEntry />}
      />

      {/* ==================================================
          CUSTOMER ROUTES
      ================================================== */}

      <Route
        path="/menu"
        element={<MenuPage />}
      />

      <Route
        path="/order"
        element={<OrderPage />}
      />

      {/* ==================================================
          ADMIN AUTH
      ================================================== */}

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />

      <Route
        path="/admin/setup"
        element={<AdminSetup />}
      />

      {/* ==================================================
          ADMIN ROOT
      ================================================== */}

      <Route
        path="/admin"
        element={
          <Navigate
            to="/admin/orders"
            replace
          />
        }
      />

      {/* ==================================================
          PROTECTED ADMIN
      ================================================== */}

      <Route
        path="/admin/*"
        element={<ProtectedAdmin />}
      />

      {/* ==================================================
          FALLBACK
      ================================================== */}

      <Route
        path="*"
        element={
          <Navigate
            to="/"
            replace
          />
        }
      />

    </Routes>
  );
}


// ======================================================
// ROOT
// ======================================================

createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <BrowserRouter>
      <CartProvider>
        <App />
      </CartProvider>
    </BrowserRouter>
  </React.StrictMode>
);
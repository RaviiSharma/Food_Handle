import React from "react";
import { createRoot } from "react-dom/client";

import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import "./styles.css";

import HomePage from "./pages/HomePage.jsx";
import MenuPage from "./pages/MenuPage.jsx";
import OrderPage from "./pages/OrderPage.jsx";

import AdminLogin from "./pages/AdminLogin.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

import { CartProvider } from "./context/CartContext.jsx";


// ======================================================
// PROTECTED ADMIN ROUTE
// ======================================================

function ProtectedAdmin() {
  const token = localStorage.getItem("adminToken");

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
// APPLICATION
// ======================================================

function App() {
  return (
    <Routes>

      {/* ==================================================
          CUSTOMER
         ================================================== */}

      <Route
        path="/"
        element={<HomePage />}
      />

      <Route
        path="/menu"
        element={<MenuPage />}
      />

      <Route
        path="/order"
        element={<OrderPage />}
      />


      {/* ==================================================
          ADMIN LOGIN
         ================================================== */}

      <Route
        path="/admin/login"
        element={<AdminLogin />}
      />


      {/* ==================================================
          ADMIN
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

      <Route
        path="/admin/*"
        element={<ProtectedAdmin />}
      />


      {/* ==================================================
          404
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
// RENDER
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
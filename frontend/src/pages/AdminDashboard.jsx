import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import api from "../api.js";

// ======================================================
// CONSTANTS
// ======================================================

const EMPTY_FORM = {
  name: "",
  category: "Egg",
  price: "",
  description: "",
  image: "",
  available: true,
};

const ORDER_STATUSES = [
  "new",
  "accepted",
  "preparing",
  "ready",
  "completed",
  "cancelled",
];

const CATEGORIES = [
  "Egg",
  "Chicken",
  "Paneer",
  "Mushroom",
  "Chinese",
  "South Indian",
  "Ice Cream",
  "Fast Food",
  "Snacks",
  "Drinks",
];

// ======================================================
// MAIN ADMIN DASHBOARD
// ======================================================

export default function AdminDashboard() {
  const location = useLocation();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --------------------------------------------------
  // AUTH
  // --------------------------------------------------

  function logout() {
    localStorage.removeItem("adminToken");
    navigate("/admin/login", { replace: true });
  }

  // --------------------------------------------------
  // LOAD ADMIN DATA
  // --------------------------------------------------

  async function loadMenu() {
    try {
      const response = await api.get("/menu/admin/all");

      const data = response.data;

      setItems(Array.isArray(data) ? data : data?.data || []);

      return true;
    } catch (error) {
      console.error("Menu loading error:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("adminToken");

        navigate("/admin/login", {
          replace: true,
        });

        return false;
      }

      throw error;
    }
  }

  async function loadOrders() {
    try {
      const response = await api.get("/orders");

      const data = response.data;

      setOrders(Array.isArray(data) ? data : data?.data || []);

      return true;
    } catch (error) {
      console.error("Orders loading error:", error);

      if (error.response?.status === 401 || error.response?.status === 403) {
        localStorage.removeItem("adminToken");

        navigate("/admin/login", {
          replace: true,
        });

        return false;
      }

      throw error;
    }
  }

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([loadMenu(), loadOrders()]);
    } catch (error) {
      console.error("Dashboard loading error:", error);

      setError("Unable to load dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // Initial dashboard load
    loadDashboard();

    // Automatically check for new orders every 5 seconds
    const orderRefreshInterval = setInterval(() => {
      loadOrders();
    }, 5000);

    // Cleanup when dashboard unmounts
    return () => {
      clearInterval(orderRefreshInterval);
    };
  }, []);
  // --------------------------------------------------
  // CLOSE MOBILE SIDEBAR ON ROUTE CHANGE
  // --------------------------------------------------

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // --------------------------------------------------
  // NEW ORDERS
  // --------------------------------------------------

  const newOrdersCount = useMemo(() => {
    return orders.filter((order) => order.status === "new").length;
  }, [orders]);

  // --------------------------------------------------
  // CURRENT SECTION
  // --------------------------------------------------

  function isActive(path) {
    return location.pathname === path;
  }

  // --------------------------------------------------
  // LOADING
  // --------------------------------------------------

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="admin-spinner" />
        <h3>Loading dashboard...</h3>
        <p>Please wait.</p>
      </div>
    );
  }

  return (
    <div className="admin-layout">
      {/* ==============================================
          MOBILE OVERLAY
         ============================================== */}

      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ==============================================
          SIDEBAR
         ============================================== */}

      <aside className={`admin-sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="admin-brand">
          <div className="brand-icon">🍽️</div>

          <div>
            <strong>Food Center</strong>
            <span>Admin Panel</span>
          </div>

          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
          >
            ×
          </button>
        </div>

        {/* NAVIGATION */}

        <nav className="admin-sidebar-nav">
          <Link
            to="/admin/orders"
            className={
              isActive("/admin/orders")
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
          >
            <span>📦</span>

            <span>Orders</span>

            {newOrdersCount > 0 && (
              <b className="order-badge">{newOrdersCount}</b>
            )}
          </Link>

          <Link
            to="/admin/menu"
            className={
              isActive("/admin/menu")
                ? "admin-nav-item active"
                : "admin-nav-item"
            }
          >
            <span>🍔</span>
            <span>Menu Management</span>
          </Link>

          <Link
            to="/admin/qr"
            className={
              isActive("/admin/qr") ? "admin-nav-item active" : "admin-nav-item"
            }
          >
            <span>📱</span>
            <span>Table QR Codes</span>
          </Link>
        </nav>

        {/* SIDEBAR BOTTOM */}

        <div className="admin-sidebar-bottom">
          <Link to="/" className="admin-nav-item">
            <span>🏠</span>
            <span>View Website</span>
          </Link>

          <button className="admin-nav-item logout-nav" onClick={logout}>
            <span>🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ==============================================
          MAIN
         ============================================== */}

      <main className="admin-main">
        {/* ============================================
            TOPBAR
           ============================================ */}

        <header className="admin-topbar">
          <button
            className="mobile-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            ☰
          </button>

          <div>
            <h1>
              {isActive("/admin/orders") && "Orders"}

              {isActive("/admin/menu") && "Menu Management"}

              {isActive("/admin/qr") && "Table QR Codes"}
            </h1>

            <p>Manage your Food Center</p>
          </div>

          <div className="admin-top-actions">
            <button
              className="refresh-btn"
              onClick={loadDashboard}
              title="Refresh"
            >
              ↻
            </button>

            <button className="top-logout" onClick={logout}>
              Logout
            </button>
          </div>
        </header>

        {/* ============================================
            ERROR
           ============================================ */}

        {error && (
          <div className="admin-error">
            <span>⚠️</span>
            <p>{error}</p>

            <button onClick={() => setError("")}>×</button>
          </div>
        )}

        {/* ============================================
            CONTENT
           ============================================ */}

        <div className="admin-content">
          {location.pathname === "/admin/orders" && (
            <OrdersSection
              orders={orders}
              setOrders={setOrders}
              setError={setError}
            />
          )}

          {location.pathname === "/admin/menu" && (
            <MenuSection
              items={items}
              setItems={setItems}
              setError={setError}
            />
          )}

          {location.pathname === "/admin/qr" && (
            <QRCodeSection setError={setError} />
          )}
        </div>
      </main>
    </div>
  );
}

// ======================================================
// ORDERS SECTION
// ======================================================

function OrdersSection({ orders, setOrders, setError }) {
  const [filter, setFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    if (filter === "all") {
      return orders;
    }

    return orders.filter((order) => order.status === filter);
  }, [orders, filter]);

  async function updateStatus(orderId, status) {
    try {
      setError("");

      const response = await api.patch(`/orders/${orderId}/status`, { status });

      const updatedOrder = response.data?.data || response.data;

      if (updatedOrder?._id) {
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order._id === orderId ? updatedOrder : order,
          ),
        );
      } else {
        // Fallback if backend response
        // doesn't contain updated order
        setOrders((currentOrders) =>
          currentOrders.map((order) =>
            order._id === orderId
              ? {
                  ...order,
                  status,
                }
              : order,
          ),
        );
      }
    } catch (error) {
      console.error("Order status error:", error);

      setError(
        error.response?.data?.message || "Unable to update order status.",
      );
    }
  }

  async function deleteOrder(orderId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this order?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.delete(`/orders/${orderId}`);

      // Remove immediately from UI
      setOrders((currentOrders) =>
        currentOrders.filter((order) => order._id !== orderId),
      );
    } catch (error) {
      console.error("Delete order error:", error);

      setError(error.response?.data?.message || "Unable to delete order.");
    }
  }

  return (
    <section>
      {/* ==========================================
          ORDER STATS
         ========================================== */}

      <div className="stats-grid">
        <div className="stat-card">
          <span>📦</span>
          <div>
            <small>Total Orders</small>
            <strong>{orders.length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <span>🔔</span>
          <div>
            <small>New Orders</small>
            <strong>{orders.filter((o) => o.status === "new").length}</strong>
          </div>
        </div>

        <div className="stat-card">
          <span>🍳</span>
          <div>
            <small>Preparing</small>
            <strong>
              {orders.filter((o) => o.status === "preparing").length}
            </strong>
          </div>
        </div>

        <div className="stat-card">
          <span>✅</span>
          <div>
            <small>Completed</small>
            <strong>
              {orders.filter((o) => o.status === "completed").length}
            </strong>
          </div>
        </div>
      </div>

      {/* ==========================================
          FILTER
         ========================================== */}

      <div className="section-toolbar">
        <div>
          <h2>Customer Orders</h2>
          <p>Manage incoming restaurant orders.</p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Orders</option>

          {ORDER_STATUSES.map((status) => (
            <option key={status} value={status}>
              {capitalize(status)}
            </option>
          ))}
        </select>
      </div>

      {/* ==========================================
          EMPTY
         ========================================== */}

      {filteredOrders.length === 0 ? (
        <div className="admin-empty">
          <div>📦</div>

          <h3>No orders found</h3>

          <p>Customer orders will appear here.</p>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map((order) => (
            <article className="admin-order-card" key={order._id}>
              <div className="order-card-header">
                <div>
                  <span className="order-number">
                    #{order._id.slice(-6).toUpperCase()}
                  </span>

                  <span className="order-date">
                    {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="order-table">
                  🪑{" "}
                  {order.tableNumber
                    ? `Table ${order.tableNumber}`
                    : "No Table"}
                </div>
              </div>

              <div className="order-items">
                {order.items?.map((item, index) => (
                  <div className="admin-order-item" key={index}>
                    <div>
                      <strong>{item.name}</strong>

                      <span>
                        ₹{item.price} × {item.quantity}
                      </span>
                    </div>

                    <strong>₹{item.price * item.quantity}</strong>
                  </div>
                ))}
              </div>

              <div className="order-card-footer">
                <div>
                  <span>Total</span>

                  <strong>₹{order.totalAmount}</strong>
                </div>

                <div className="order-actions">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    className={`status-select status-${order.status}`}
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {capitalize(status)}
                      </option>
                    ))}
                  </select>

                  <button
                    className="delete-order-btn"
                    onClick={() => deleteOrder(order._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// ======================================================
// MENU SECTION
// ======================================================

function MenuSection({ items, setItems, setError }) {
  const [form, setForm] = useState(EMPTY_FORM);

  const [editing, setEditing] = useState(null);

  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const filteredItems = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) {
      return items;
    }

    return items.filter(
      (item) =>
        item.name?.toLowerCase().includes(value) ||
        item.category?.toLowerCase().includes(value),
    );
  }, [items, search]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditing(null);
  }

  function startEdit(item) {
    setEditing(item._id);

    setForm({
      name: item.name || "",
      category: item.category || "Egg",
      price: item.price?.toString() || "",
      description: item.description || "",
      image: item.image || "",
      available: item.available !== false,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function saveItem(e) {
    e.preventDefault();

    setError("");

    const name = form.name.trim();
    const category = form.category.trim();
    const price = Number(form.price);
    const description = form.description.trim();
    const image = form.image.trim();

    // ================================
    // VALIDATION
    // ================================

    if (!name) {
      setError("Food name is required.");
      return;
    }

    if (name.length < 2) {
      setError("Food name must contain at least 2 characters.");
      return;
    }

    if (name.length > 100) {
      setError("Food name cannot exceed 100 characters.");
      return;
    }

    if (!category) {
      setError("Food category is required.");
      return;
    }

    if (form.price === "" || !Number.isFinite(price)) {
      setError("Price must be a valid number.");
      return;
    }

    if (price <= 0) {
      setError("Price must be greater than ₹0.");
      return;
    }

    if (price > 100000) {
      setError("Price cannot exceed ₹100000.");
      return;
    }

    if (description.length > 500) {
      setError("Description cannot exceed 500 characters.");
      return;
    }

    if (image.length > 2000) {
      setError("Image URL is too long.");
      return;
    }

    const payload = {
      name,
      category,
      price,
      description,
      image,
      available: Boolean(form.available),
    };

    try {
      setSaving(true);

      if (editing) {
        // ================================
        // UPDATE
        // ================================
        const response = await api.put(`/menu/${editing}`, payload);

        const updatedItem = response.data?.data || response.data;

        setItems((currentItems) =>
          currentItems.map((item) =>
            item._id === editing ? updatedItem : item,
          ),
        );
      } else {
        // ================================
        // CREATE
        // ================================
        const response = await api.post("/menu", payload);

        const newItem = response.data?.data || response.data;

        setItems((currentItems) => [newItem, ...currentItems]);
      }

      resetForm();
    } catch (error) {
      console.error("Save menu item error:", error);

      setError(
        error.response?.data?.message ||
          "Unable to save food item. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this food item?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      console.log("Deleting menu item:", id);

      // DELETE FROM DATABASE
      await api.delete(`/menu/${id}`);

      console.log("Menu item deleted successfully:", id);

      // REMOVE FROM ADMIN UI IMMEDIATELY
      setItems((currentItems) =>
        currentItems.filter((item) => item._id !== id),
      );

      // If currently editing this item, reset form
      if (editing === id) {
        resetForm();
      }
    } catch (error) {
      console.error("Delete menu item error:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("adminToken");
        navigate("/admin/login", { replace: true });
        return;
      }

      setError(
        error.response?.data?.message ||
          "Unable to delete food item. Please try again.",
      );
    }
  }

  return (
    <section>
      {/* ==========================================
          FORM
         ========================================== */}

      <div className="menu-management-header">
        <div>
          <h2>{editing ? "Edit Food Item" : "Add New Food"}</h2>

          <p>Create and manage your restaurant menu.</p>
        </div>
      </div>

      <form className="food-form-card" onSubmit={saveItem}>
        <div className="form-grid">
          {/* NAME */}

          <div className="form-field">
            <label>Food Name *</label>

            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Egg Roll"
              maxLength={100}
            />
          </div>

          {/* CATEGORY */}

          <div className="form-field">
            <label>Category *</label>

            <select
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* PRICE */}

          <div className="form-field">
            <label>Price (₹) *</label>

            <input
              name="price"
              type="number"
              min="1"
              max="100000"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              placeholder="e.g. 120"
            />
          </div>

          {/* IMAGE */}

          <div className="form-field">
            <label>Image URL</label>

            <input
              name="image"
              type="url"
              value={form.image}
              onChange={handleChange}
              placeholder="https://example.com/food.jpg"
            />
          </div>

          {/* DESCRIPTION */}

          <div className="form-field full">
            <label>Description</label>

            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Short description of the food..."
              maxLength={500}
              rows={3}
            />

            <small>{form.description.length}/500</small>
          </div>

          {/* AVAILABLE */}

          <label className="availability-toggle">
            <input
              type="checkbox"
              name="available"
              checked={form.available}
              onChange={handleChange}
            />

            <span>Available for customers</span>
          </label>
        </div>

        <div className="form-actions">
          <button type="submit" className="primary-admin-btn" disabled={saving}>
            {saving ? "Saving..." : editing ? "Update Food" : "Create Food"}
          </button>

          {editing && (
            <button
              type="button"
              className="secondary-admin-btn"
              onClick={resetForm}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* ==========================================
          MENU LIST
         ========================================== */}

      <div className="menu-list-header">
        <div>
          <h2>Menu Items</h2>

          <span>{items.length} items</span>
        </div>

        <input
          className="menu-search"
          type="search"
          placeholder="Search food..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredItems.length === 0 ? (
        <div className="admin-empty">
          <div>🍔</div>

          <h3>No food items found</h3>

          <p>Add your first food item above.</p>
        </div>
      ) : (
        <div className="admin-menu-list">
          {filteredItems.map((item) => (
            <article className="admin-menu-card" key={item._id}>
              <div className="menu-item-preview">
                {item.image ? (
                  <img src={item.image} alt={item.name} />
                ) : (
                  <span>🍽️</span>
                )}
              </div>

              <div className="menu-item-info">
                <div>
                  <span className="menu-category">{item.category}</span>

                  <h3>{item.name}</h3>

                  <p>{item.description || "Freshly prepared."}</p>
                </div>

                <strong className="menu-price">₹{item.price}</strong>
              </div>

              <div className="menu-item-actions">
                <span
                  className={
                    item.available
                      ? "availability available"
                      : "availability unavailable"
                  }
                >
                  {item.available ? "Available" : "Hidden"}
                </span>

                <button className="edit-btn" onClick={() => startEdit(item)}>
                  Edit
                </button>

                <button
                  className="delete-btn"
                  onClick={() => deleteItem(item._id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

// ======================================================
// QR SECTION
// ======================================================

function QRCodeSection({ setError }) {
  const [count, setCount] = useState("10");

  const [qrCodes, setQrCodes] = useState([]);

  const [generating, setGenerating] = useState(false);

  async function generateQR() {
    setError("");

    const number = Number(count);

    // -----------------------------------------------
    // VALIDATION
    // -----------------------------------------------

    if (count === "" || !Number.isInteger(number)) {
      setError("Please enter a valid number of tables.");
      return;
    }

    if (number < 1) {
      setError("Number of tables must be at least 1.");
      return;
    }

    if (number > 500) {
      setError("You can generate a maximum of 500 table QR codes at once.");
      return;
    }

    try {
      setGenerating(true);

      const response = await api.get(`/tables/qr?count=${number}`);

      const data = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];

      setQrCodes(data);
    } catch (error) {
      console.error("QR generation error:", error);

      setError(
        error.response?.data?.message || "Unable to generate table QR codes.",
      );
    } finally {
      setGenerating(false);
    }
  }

  function downloadQR(dataUrl, tableNumber) {
    if (!dataUrl) {
      setError(`QR image for Table ${tableNumber} is unavailable.`);
      return;
    }

    const link = document.createElement("a");

    link.href = dataUrl;

    link.download = `food-center-table-${tableNumber}.png`;

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  }

  function printQR() {
    if (!qrCodes.length) {
      setError("Generate QR codes before printing.");
      return;
    }

    window.print();
  }

  return (
    <section>
      {/* ==========================================
          QR HEADER
         ========================================== */}

      <div className="qr-header">
        <div>
          <h2>Table QR Codes</h2>

          <p>Generate QR codes for any number of restaurant tables.</p>
        </div>
      </div>

      {/* ==========================================
          GENERATOR
         ========================================== */}

      <div className="qr-generator">
        <div className="qr-generator-info">
          <div className="qr-icon">📱</div>

          <div>
            <h3>Generate Table QR Codes</h3>

            <p>
              Each QR code opens the menu with its table number automatically.
            </p>
          </div>
        </div>

        <div className="qr-generator-form">
          <label>Number of Tables</label>

          <input
            type="number"
            min="1"
            max="500"
            value={count}
            onChange={(e) => setCount(e.target.value)}
            placeholder="e.g. 20"
          />

          <button
            className="primary-admin-btn"
            onClick={generateQR}
            disabled={generating}
          >
            {generating ? "Generating..." : "Generate QR Codes"}
          </button>

          <button
            className="secondary-admin-btn"
            onClick={printQR}
            disabled={!qrCodes.length}
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* ==========================================
          QR RESULT
         ========================================== */}

      {qrCodes.length > 0 && (
        <div className="qr-result">
          <div className="qr-result-header">
            <div>
              <h2>Generated QR Codes</h2>

              <p>{qrCodes.length} table QR codes generated.</p>
            </div>

            <button className="secondary-admin-btn" onClick={printQR}>
              🖨️ Print All
            </button>
          </div>

          <div className="qr-grid">
            {qrCodes.map((qr) => (
              <article className="qr-admin-card" key={qr.tableNumber}>
                <div className="qr-table-title">Table {qr.tableNumber}</div>

                <div className="qr-image-wrapper">
                  {qr.dataUrl ? (
                    <img
                      src={qr.dataUrl}
                      alt={`QR Code Table ${qr.tableNumber}`}
                    />
                  ) : (
                    <div className="qr-missing">QR unavailable</div>
                  )}
                </div>

                <p className="qr-url">
                  /menu?table=
                  {qr.tableNumber}
                </p>

                <button
                  className="primary-admin-btn qr-download"
                  onClick={() => downloadQR(qr.dataUrl, qr.tableNumber)}
                >
                  ↓ Download QR
                </button>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ======================================================
// HELPERS
// ======================================================

function capitalize(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

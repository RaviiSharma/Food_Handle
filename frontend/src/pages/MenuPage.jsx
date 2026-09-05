import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import api from "../api.js";
import { useCart } from "../context/CartContext.jsx";

export default function MenuPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const qrTable = searchParams.get("table");
  const categoryFromUrl = searchParams.get("category");

  const {
    cartItems,
    totalItems,
    addItem,
    decreaseItem,
    setTableNumber,
  } = useCart();

  const [menu, setMenu] = useState([]);
  const [category, setCategory] = useState(categoryFromUrl || "All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // QR TABLE
  // ==========================================

  useEffect(() => {
    if (qrTable) {
      setTableNumber(qrTable);
    }
  }, [qrTable, setTableNumber]);

  // ==========================================
  // SYNC CATEGORY WITH URL
  // ==========================================

  useEffect(() => {
    setCategory(categoryFromUrl || "All");
  }, [categoryFromUrl]);

  // ==========================================
  // LOAD MENU
  // Refresh automatically every 5 seconds
  // ==========================================

  useEffect(() => {
    let mounted = true;

    async function loadMenu(showLoader = false) {
      try {
        if (showLoader) {
          setLoading(true);
        }

        const response = await api.get("/menu");

        const data = Array.isArray(response.data)
          ? response.data
          : response.data?.data || [];

        if (mounted) {
          setMenu(data);
          setError("");
        }
      } catch (error) {
        console.error("Menu loading error:", error);

        if (mounted) {
          setError(
            error.response?.data?.message ||
              "Unable to load menu. Please try again.",
          );
        }
      } finally {
        if (mounted && showLoader) {
          setLoading(false);
        }
      }
    }

    loadMenu(true);

    const interval = setInterval(() => {
      loadMenu(false);
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // ==========================================
  // CATEGORIES
  // ==========================================

  const categories = useMemo(() => {
    const uniqueCategories = [
      ...new Set(
        menu
          .map((item) => item.category?.trim())
          .filter(Boolean),
      ),
    ];

    return ["All", ...uniqueCategories];
  }, [menu]);

  // ==========================================
  // CHANGE CATEGORY
  // ==========================================

  function handleCategoryChange(selectedCategory) {
    setCategory(selectedCategory);

    const params = {};

    if (qrTable) {
      params.table = qrTable;
    }

    if (selectedCategory !== "All") {
      params.category = selectedCategory;
    }

    setSearchParams(params);
  }

  // ==========================================
  // FILTER MENU
  // ==========================================

  const visibleItems = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return menu.filter((item) => {
      const categoryMatch =
        category === "All" ||
        item.category === category;

      const searchMatch =
        !searchValue ||
        item.name?.toLowerCase().includes(searchValue) ||
        item.description?.toLowerCase().includes(searchValue);

      return categoryMatch && searchMatch;
    });
  }, [menu, category, search]);

  // ==========================================
  // CART QUANTITY MAP
  // Faster than find() for every food card
  // ==========================================

  const cartQuantityMap = useMemo(() => {
    const map = new Map();

    for (const item of cartItems) {
      map.set(item._id, item.quantity);
    }

    return map;
  }, [cartItems]);

  function getQuantity(id) {
    return cartQuantityMap.get(id) || 0;
  }

  // ==========================================
  // IMAGE FALLBACK
  // ==========================================

  function handleImageError(event) {
    event.currentTarget.style.display = "none";

    const parent = event.currentTarget.parentElement;

    if (parent && !parent.querySelector(".image-fallback")) {
      const fallback = document.createElement("span");

      fallback.className = "image-fallback";
      fallback.textContent = "🍽️";

      parent.appendChild(fallback);
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="loading-page">
        <div className="loader" />
        <p>Loading menu...</p>
      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="site">
      {/* HEADER */}

      <header className="topbar">
        <Link to="/" className="brand">
          🍽️ Food Center
        </Link>

        <nav>
          <Link to="/menu" className="nav-active">
            Menu
          </Link>

          <Link to="/order">
            My Order
          </Link>
        </nav>
      </header>

      {/* MENU HEADER */}

      <section className="menu-header">
        <div>
          <span className="eyebrow">Our Menu</span>

          <h1>Fresh • Tasty • Affordable</h1>

          {qrTable && (
            <div className="table-badge">
              🪑 Table {qrTable}
            </div>
          )}
        </div>

        <Link to="/order" className="cart-button">
          🛒 Cart

          {totalItems > 0 && (
            <span>{totalItems}</span>
          )}
        </Link>
      </section>

      {/* MAIN */}

      <main className="menu-container">
        {/* SEARCH */}

        <div className="search-box">
          <span className="search-icon">🔍</span>

          <input
            type="search"
            placeholder="Search food..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />

          {search && (
            <button
              type="button"
              className="clear-search"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>

        {/* CATEGORIES */}

        <div className="category-bar">
          {categories.map((item) => (
            <button
              type="button"
              key={item}
              className={
                category === item
                  ? "category-active"
                  : ""
              }
              onClick={() =>
                handleCategoryChange(item)
              }
            >
              {item}
            </button>
          ))}
        </div>

        {/* ERROR */}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* RESULT INFO */}

        {!error && (
          <div className="menu-result-info">
            <div>
              <strong>
                {category === "All"
                  ? "All Items"
                  : category}
              </strong>

              <span>
                {visibleItems.length}{" "}
                {visibleItems.length === 1
                  ? "item"
                  : "items"}
              </span>
            </div>

            {search && (
              <span>
                Search: "{search}"
              </span>
            )}
          </div>
        )}

        {/* EMPTY */}

        {visibleItems.length === 0 ? (
          <div className="empty-state">
            <div>🍽️</div>

            <h3>No food found</h3>

            <p>
              {search
                ? `No food found for "${search}".`
                : `No items available in ${category}.`}
            </p>

            {(search || category !== "All") && (
              <button
                type="button"
                className="primary-btn"
                onClick={() => {
                  setSearch("");
                  handleCategoryChange("All");
                }}
              >
                View All Food
              </button>
            )}
          </div>
        ) : (
          <div className="food-grid">
            {visibleItems.map((item) => {
              const quantity = getQuantity(
                item._id,
              );

              return (
                <article
                  className="food-card"
                  key={item._id}
                >
                  {/* IMAGE */}

                  <div className="food-image">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        onError={handleImageError}
                      />
                    ) : (
                      <span>🍽️</span>
                    )}
                  </div>

                  {/* CONTENT */}

                  <div className="food-content">
                    <small>
                      {item.category}
                    </small>

                    <h3>{item.name}</h3>

                    <p>
                      {item.description ||
                        "Freshly prepared."}
                    </p>

                    <div className="food-bottom">
                      <strong>
                        ₹{item.price}
                      </strong>

                      {quantity === 0 ? (
                        <button
                          type="button"
                          className="add-btn"
                          onClick={() =>
                            addItem(item)
                          }
                        >
                          + Add
                        </button>
                      ) : (
                        <div className="quantity">
                          <button
                            type="button"
                            onClick={() =>
                              decreaseItem(item)
                            }
                            aria-label={`Decrease ${item.name}`}
                          >
                            −
                          </button>

                          <span>
                            {quantity}
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              addItem(item)
                            }
                            aria-label={`Increase ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* FLOATING CART */}

      {totalItems > 0 && (
        <Link
          to="/order"
          className="floating-cart"
        >
          <span>
            🛒 {totalItems}{" "}
            {totalItems === 1
              ? "item"
              : "items"}
          </span>

          <strong>
            View Order →
          </strong>
        </Link>
      )}
    </div>
  );
}
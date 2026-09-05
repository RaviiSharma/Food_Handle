import React, { useEffect } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

const categories = [
  {
    name: "Egg Special",
    value: "Egg",
    icon: "🍳",
  },
  {
    name: "Chicken",
    value: "Chicken",
    icon: "🍗",
  },
  {
    name: "Paneer",
    value: "Paneer",
    icon: "🧀",
  },
  {
    name: "Chinese",
    value: "Chinese",
    icon: "🍜",
  },
  {
    name: "South Indian",
    value: "South Indian",
    icon: "🥞",
  },
  {
    name: "Ice Cream",
    value: "Ice Cream",
    icon: "🍨",
  },
];

export default function HomePage() {
  const navigate = useNavigate();

  useEffect(() => {
    const token =
      localStorage.getItem("adminToken");

    if (token) {
      navigate("/admin/orders", {
        replace: true,
      });
    }
  }, [navigate]);

  return (
    <div className="site">
      {/* =========================================
          HEADER
      ========================================= */}

      <header className="topbar">
        <Link
          to="/"
          className="brand"
        >
          🍽️ Food Center
        </Link>

        <nav>
          <Link to="/menu">
            Menu
          </Link>

          <Link to="/order">
            My Order
          </Link>
        </nav>
      </header>

      {/* =========================================
          HERO
      ========================================= */}

      <main className="home">
        <section className="home-hero">
          <div className="home-hero-content">
            <span className="eyebrow">
              Welcome to Food Center
            </span>

            <h1>
              Fresh food.
              <br />
              Great taste.
            </h1>

            <p>
              Delicious fast food, South Indian,
              Chinese, snacks, desserts and more.
            </p>

            <Link
              to="/menu"
              className="primary-btn"
            >
              View Full Menu →
            </Link>
          </div>

          <div className="hero-food">
            🍕
          </div>
        </section>

        {/* =========================================
            CATEGORIES
        ========================================= */}

        <section className="home-section">
          <div className="home-section-heading">
            <div>
              <span className="eyebrow">
                Explore Menu
              </span>

              <h2>
                What are you craving?
              </h2>
            </div>

            <Link
              to="/menu"
              className="view-all-link"
            >
              View All →
            </Link>
          </div>

          <div className="category-preview">
            {categories.map((category) => (
              <Link
                key={category.value}
                to={`/menu?category=${encodeURIComponent(
                  category.value
                )}`}
                className="category-card"
              >
                <span className="category-icon">
                  {category.icon}
                </span>

                <strong>
                  {category.name}
                </strong>

                <span className="category-arrow">
                  →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* =========================================
          FOOTER
      ========================================= */}

      <footer>
        © {new Date().getFullYear()} Food Center
      </footer>
    </div>
  );
}
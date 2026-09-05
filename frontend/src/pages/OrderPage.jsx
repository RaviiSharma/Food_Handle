import React, { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../api.js";
import { useCart } from "../context/CartContext.jsx";

export default function OrderPage() {
  const navigate = useNavigate();

  const {
    cartItems,
    totalAmount,
    tableNumber,
    setTableNumber,
    addItem,
    decreaseItem,
    removeItem,
    clearCart,
  } = useCart();

  const [placing, setPlacing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  async function placeOrder() {
    setError("");
    setSuccess("");

    if (cartItems.length === 0) {
      setError(
        "Your cart is empty."
      );
      return;
    }

    let parsedTable = null;

    if (tableNumber !== "") {

      const number =
        Number(tableNumber);

      if (
        !Number.isInteger(number) ||
        number < 1 ||
        number > 10
      ) {
        setError(
          "Table number must be between 1 and 10."
        );
        return;
      }

      parsedTable = number;
    }

    try {
      setPlacing(true);

      const orderData = {
        tableNumber: parsedTable,

        items: cartItems.map(
          (item) => ({
            menuItem: item._id,
            quantity: item.quantity,
          })
        ),
      };

      const response =
        await api.post(
          "/orders",
          orderData
        );

      clearCart();

      setSuccess(
        response.data?.message ||
          "Order placed successfully."
      );

    } catch (error) {

      console.error(
        "Place order error:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Unable to place order. Please try again."
      );

    } finally {
      setPlacing(false);
    }
  }

  if (success) {
    return (
      <div className="success-page">

        <div className="success-card">

          <div className="success-icon">
            ✓
          </div>

          <h1>
            Order Confirmed!
          </h1>

          <p>
            {success}
          </p>

          {tableNumber && (
            <strong>
              Table {tableNumber}
            </strong>
          )}

          <Link
            to="/menu"
            className="primary-btn"
          >
            Order More Food
          </Link>

        </div>

      </div>
    );
  }

  return (
    <div className="site">

      <header className="topbar">

        <Link
          to="/"
          className="brand"
        >
          🍽️ Food Center
        </Link>

        <Link
          to="/menu"
          className="back-link"
        >
          ← Back to Menu
        </Link>

      </header>

      <main className="order-page">

        <div className="order-heading">

          <span className="eyebrow">
            Checkout
          </span>

          <h1>
            Your Order
          </h1>

        </div>

        {/* TABLE */}

        <section className="checkout-card">

          <h3>
            Table Information
          </h3>

          <p>
            Scanned from QR? Your table number
            is already selected.
          </p>

          <label>
            Table Number
          </label>

          <input
            type="number"
            min="1"
            max="10"
            placeholder="Optional — e.g. 8"
            value={tableNumber}
            onChange={(e) =>
              setTableNumber(
                e.target.value
              )
            }
          />

          <small>
            You can place an order without a
            table number too.
          </small>

        </section>

        {/* ITEMS */}

        <section className="checkout-card">

          <h3>
            Selected Items
          </h3>

          {cartItems.length === 0 ? (

            <div className="empty-order">

              <div>
                🛒
              </div>

              <h3>
                Your cart is empty
              </h3>

              <Link
                to="/menu"
                className="primary-btn"
              >
                Browse Menu
              </Link>

            </div>

          ) : (

            <>
              {cartItems.map((item) => (

                <div
                  className="order-item"
                  key={item._id}
                >

                  <div>

                    <strong>
                      {item.name}
                    </strong>

                    <span>
                      ₹{item.price} each
                    </span>

                  </div>

                  <div className="order-controls">

                    <button
                      onClick={() =>
                        decreaseItem(item)
                      }
                    >
                      −
                    </button>

                    <span>
                      {item.quantity}
                    </span>

                    <button
                      onClick={() =>
                        addItem(item)
                      }
                    >
                      +
                    </button>

                    <strong>
                      ₹
                      {item.price *
                        item.quantity}
                    </strong>

                    <button
                      className="remove-btn"
                      onClick={() =>
                        removeItem(
                          item._id
                        )
                      }
                    >
                      ×
                    </button>

                  </div>

                </div>

              ))}

              <div className="order-total">

                <span>
                  Total
                </span>

                <strong>
                  ₹{totalAmount}
                </strong>

              </div>

            </>
          )}

        </section>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {cartItems.length > 0 && (
          <button
            className="place-order-btn"
            disabled={placing}
            onClick={placeOrder}
          >
            {placing
              ? "Placing Order..."
              : `Place Order • ₹${totalAmount}`}
          </button>
        )}

      </main>

    </div>
  );
}
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("foodCenterCart");

      return saved
        ? JSON.parse(saved)
        : {};
    } catch {
      return {};
    }
  });

  const [tableNumber, setTableNumber] =
    useState(() => {
      return localStorage.getItem(
        "foodCenterTable"
      ) || "";
    });

  useEffect(() => {
    localStorage.setItem(
      "foodCenterCart",
      JSON.stringify(cart)
    );
  }, [cart]);

  useEffect(() => {
    if (tableNumber) {
      localStorage.setItem(
        "foodCenterTable",
        tableNumber
      );
    } else {
      localStorage.removeItem(
        "foodCenterTable"
      );
    }
  }, [tableNumber]);

  function addItem(item) {
    setCart((current) => ({
      ...current,

      [item._id]: {
        ...item,
        quantity:
          (current[item._id]?.quantity || 0) + 1,
      },
    }));
  }

  function decreaseItem(item) {
    setCart((current) => {
      const next = { ...current };

      const quantity =
        (next[item._id]?.quantity || 0) - 1;

      if (quantity <= 0) {
        delete next[item._id];
      } else {
        next[item._id] = {
          ...next[item._id],
          quantity,
        };
      }

      return next;
    });
  }

  function removeItem(id) {
    setCart((current) => {
      const next = { ...current };

      delete next[id];

      return next;
    });
  }

  function clearCart() {
    setCart({});
  }

  const cartItems = Object.values(cart);

  const totalItems = cartItems.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalAmount = cartItems.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        cartItems,
        totalItems,
        totalAmount,
        tableNumber,
        setTableNumber,
        addItem,
        decreaseItem,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}
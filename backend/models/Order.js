import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
  name: String,
  price: Number,
  quantity: { type: Number, min: 1 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  tableNumber: { type: Number, default: null },
  items: { type: [orderItemSchema], required: true },
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ["new", "accepted", "preparing", "ready", "completed", "cancelled"],
    default: "new"
  }
}, { timestamps: true });

export default mongoose.model("Order", orderSchema);

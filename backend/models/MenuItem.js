import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  available: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("MenuItem", menuItemSchema);

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  const exists = await User.findOne({ email });
  if (!exists) {
    const passwordHash = await bcrypt.hash(password, 12);
    await User.create({ email, passwordHash, role: "admin" });
    console.log("Admin created:", email);
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });
    if (!user || !(await bcrypt.compare(password || "", user.passwordHash)))
      return res.status(401).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, admin: { email: user.email, role: user.role } });
  } catch {
    res.status(500).json({ message: "Login failed" });
  }
}

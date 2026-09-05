// seed.js

import "dotenv/config";
import mongoose from "mongoose";
import MenuItem from "./models/MenuItem.js";
import seedMenu from "./data/SeedMenu.js";

await mongoose.connect(process.env.MONGODB_URI);

console.log("MongoDB connected");

await MenuItem.deleteMany({});

await MenuItem.insertMany(seedMenu);

console.log(`Inserted ${seedMenu.length} menu items`);

await mongoose.disconnect();

console.log("Seed completed");
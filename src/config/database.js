import mongoose from "mongoose";
import dns from "node:dns/promises";
import config from "./config.js";

dns.setServers(["1.1.1.1"]);

async function connectDB() {
  try {
    await mongoose.connect(config.MONGO_URI);
    console.log("MongoDB connected successfully");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit process with failure
  }
}

export default connectDB;

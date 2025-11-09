// ------------------------------
// Load environment variables
// ------------------------------
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Properly resolve current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Load env.local reliably, even when running from parent directory
dotenv.config({ path: path.join(__dirname, "env.local") });

// Debug check — confirm env variables loaded
console.log("✅ Loaded from env:", process.env.CORS_ORIGIN, process.env.PORT);

// ------------------------------
// Imports
// ------------------------------
import connectDB from "./db/index.js";
import { app } from "./app.js";
import os from "os";
import express from "express";

// ------------------------------
// Serve Frontend (optional for deployment)
// ------------------------------
const frontendBP = path.join(__dirname, "../Frontend/dist");
app.use(express.static(frontendBP));

// ------------------------------
// Utility: Get local IP address
// ------------------------------
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "127.0.0.1"; // fallback
}

// ------------------------------
// Start server after DB connects
// ------------------------------
connectDB()
  .then(() => {
    app.on("error", (error) => {
      console.log("❌ Server error:", error);
      throw error;
    });

    const port = process.env.PORT || 8000;

    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
      const ip = getLocalIpAddress();
      console.log(`🌐 Access backend at: http://${ip}:${port}/`);
    });
  })
  .catch((err) => {
    console.log("❌ MongoDB connection failed !!!", err);
  });

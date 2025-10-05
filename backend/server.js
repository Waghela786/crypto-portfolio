// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";

// --- 0️⃣ Load Environment Variables ---
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// --- 1️⃣ Global Middleware ---

// Enable CORS for all routes and methods
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse JSON requests
app.use(express.json());

// Simple request logger
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip} Origin: ${
      req.headers.origin || "-"
    }`
  );
  next();
});

// --- 2️⃣ Diagnostic Endpoints ---
app.get("/api/ping", (req, res) => {
  res.json({
    ok: true,
    time: Date.now(),
    env: process.env.NODE_ENV || "development",
  });
});

app.get("/api/debug", (req, res) => {
  res.json({
    ip: req.ip,
    headers: {
      host: req.headers.host,
      origin: req.headers.origin,
      authorization: !!req.headers.authorization,
      userAgent: req.headers["user-agent"],
    },
  });
});

// --- 3️⃣ Import Routes ---
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/userRoutes.js";
import walletRoutes from "./routes/walletRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js"; // ✅ Correct ES module import

// --- 4️⃣ Register Routes ---
// Auth routes (register/login)
app.use("/api/users", authRoutes);

// User-related routes (/me, etc.)
app.use("/api/users", userRoutes);

// Wallet routes
app.use("/api/wallets", walletRoutes);

// Transaction routes
app.use("/api/transactions", transactionRoutes);

// --- 5️⃣ Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// --- 6️⃣ MongoDB Connection + Server Startup ---
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    app.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 Server running on port ${PORT} (bound to 0.0.0.0)`)
    );
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1); // Exit if DB connection fails
  }
};

startServer();

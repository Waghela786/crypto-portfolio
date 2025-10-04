// server.js
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

// Apply CORS early so all endpoints (including diagnostics) receive proper headers
app.use(cors({ origin: true, methods: ["GET","POST","PUT","DELETE","OPTIONS"], allowedHeaders: ["Content-Type","Authorization"] }));
app.options("*", cors()); // handle preflight
app.use(express.json());

// Simple request logger to help debug mobile requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ip:${req.ip} origin:${req.headers.origin || "-"}`);
  next();
});

// Diagnostic endpoints (use from mobile browser to confirm reachability)
app.get("/api/ping", (req, res) => {
  res.json({ ok: true, time: Date.now(), env: process.env.NODE_ENV || "dev" });
});

app.get("/api/debug", (req, res) => {
  // returns small debug payload to inspect headers/origin from mobile
  res.json({
    ip: req.ip,
    headers: {
      host: req.headers.host,
      origin: req.headers.origin,
      authorization: !!req.headers.authorization,
      userAgent: req.headers["user-agent"]
    }
  });
});

// Routes
// Mount auth routes (register/login/forgot/reset) and userRoutes (me, other user endpoints)
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/userRoutes");
const walletRoutes = require("./routes/walletRoutes");

// Mount auth routes first so authentication endpoints use the more secure implementations
app.use("/api/users", authRoutes);
// Mount other user routes (contains /me and other protected endpoints)
app.use("/api/users", userRoutes);
app.use("/api/wallets", walletRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected"))
.catch((err) => console.log("MongoDB connection error:", err));

// Start server (single declaration) - bind to 0.0.0.0 so other devices can reach it
const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT} (bound to 0.0.0.0)`));


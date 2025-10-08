import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";
import fs from "fs";
import path from "path";

// --- 0️⃣ Load Environment Variables ---
dotenv.config();
// Avoid logging secrets in production
if (!process.env.JWT_SECRET) {
  console.warn("⚠️ Warning: JWT_SECRET is not set");
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// --- 1️⃣ Global Middleware ---
// CORS: allow configured CLIENT_URL plus local dev ports
const allowedOrigins = [process.env.CLIENT_URL, "http://localhost:3000", "http://localhost:3001"].filter(Boolean);
app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (e.g., curl, mobile apps)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
      console.warn("Blocked CORS request from origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
// Accept JSON bodies; allow `null` values (strict:false) so clients sending null won't crash the parser
// Capture raw body for diagnostics and accept JSON bodies; allow `null` values (strict:false)
app.use(express.json({
  strict: false,
  verify: (req, res, buf, encoding) => {
    try {
      req.rawBody = buf.toString(encoding || "utf8");
    } catch (e) {
      req.rawBody = "";
    }
  },
}));

// Graceful handler for malformed JSON (body-parser SyntaxError)
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    const raw = req && req.rawBody ? req.rawBody : "<no raw body>";
    const truncated = typeof raw === "string" && raw.length > 1000 ? raw.slice(0, 1000) + "...(truncated)" : raw;
    console.warn("❌ Invalid JSON received:", err.message, "path:", req.originalUrl, "method:", req.method, "rawBody:", truncated);
    return res.status(400).json({ success: false, message: "Invalid JSON payload" });
  }
  return next(err);
});

// Simple request logger
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip} Origin: ${
      req.headers.origin || "-"
    }`
  );
  next();
});

// CoinGecko proxy endpoint with cached fallback
app.get("/api/proxy/coins/list", async (req, res) => {
  const cacheDir = path.join(process.cwd(), "data");
  const cacheFile = path.join(cacheDir, "coins-cache.json");
  try {
    const response = await axios.get("https://api.coingecko.com/api/v3/coins/list", { timeout: 15000 });
    const data = response.data;
    // persist cache for offline/temporary-failure use
    try {
      await fs.promises.mkdir(cacheDir, { recursive: true });
      await fs.promises.writeFile(cacheFile, JSON.stringify(data));
      console.debug("CoinGecko proxy: cache written to", cacheFile);
    } catch (writeErr) {
      console.warn("CoinGecko proxy: failed to write cache", writeErr && writeErr.message ? writeErr.message : writeErr);
    }
    return res.json(data);
  } catch (error) {
    console.error("CoinGecko proxy error:", error && error.message ? error.message : error);
    // Attempt to return cached copy if available
    try {
      const cached = await fs.promises.readFile(cacheFile, "utf8");
      const parsed = JSON.parse(cached);
      console.warn("CoinGecko proxy: returning cached coins list due to fetch error");
      return res.json(parsed);
    } catch (cacheErr) {
      console.error("CoinGecko proxy: cache read failed:", cacheErr && cacheErr.message ? cacheErr.message : cacheErr);
      return res.status(500).json({ error: "Failed to fetch coins and no cache available", details: error && error.message ? error.message : String(error) });
    }
  }
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
import bankRoutes from "./routes/bankRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import coinRoutes from "./routes/coinRoutes.js";
import debugRoutes from "./routes/debugRoutes.js";

// --- 4️⃣ Register Routes ---
app.use("/api/coins", coinRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/users", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallets", walletRoutes);
app.use("/api/wallets", bankRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/debug", debugRoutes);

// --- 5️⃣ Error Handling Middleware ---
app.use((err, req, res, next) => {
  console.error("❌ Error:", err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// --- 6️⃣ Socket.IO Setup ---
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true },
});

// Map to store connected users: userId -> Set(socket.id)
const connectedUsers = new Map();

// Socket auth middleware: expect client to send { auth: { token } } during handshake
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(); // allow anonymous connections (optional)

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    return next();
  } catch (err) {
    console.warn("Socket auth failed:", err.message);
    return next();
  }
});

io.on("connection", (socket) => {
  console.log("🔔 User connected:", socket.id, "userId:", socket.userId || "(unknown)");

  // If socket was authenticated and has userId, add to the set
  if (socket.userId) {
    const uid = String(socket.userId);
    const set = connectedUsers.get(uid) || new Set();
    set.add(socket.id);
    connectedUsers.set(uid, set);
    console.log("👤 Socket mapped to user:", uid, Array.from(set));
  }

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id, "userId:", socket.userId || "(unknown)");
    // Remove disconnected socket from all sets
    connectedUsers.forEach((set, key) => {
      if (set.has(socket.id)) {
        set.delete(socket.id);
        if (set.size === 0) connectedUsers.delete(key);
        else connectedUsers.set(key, set);
      }
    });
  });
});

// Make io accessible in routes
app.set("io", io);
app.set("connectedUsers", connectedUsers);

// --- 7️⃣ MongoDB Connection + Server Startup ---
const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");

    server.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 Server running on port ${PORT} (bound to 0.0.0.0)`)
    );
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  }
};

startServer();

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
if (!process.env.JWT_SECRET) {
  console.warn("⚠️ Warning: JWT_SECRET is not set");
}

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// --- 1️⃣ Global Middleware ---
const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:3000",
  "http://localhost:3001",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      console.warn("Blocked CORS request from origin:", origin);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(
  express.json({
    strict: false,
    verify: (req, res, buf, encoding) => {
      try {
        req.rawBody = buf.toString(encoding || "utf8");
      } catch (e) {
        req.rawBody = "";
      }
    },
  })
);

// JSON parse error handling
app.use((err, req, res, next) => {
  if (err && err.type === "entity.parse.failed") {
    const raw = req?.rawBody || "<no raw body>";
    const truncated =
      typeof raw === "string" && raw.length > 1000
        ? raw.slice(0, 1000) + "...(truncated)"
        : raw;
    console.warn(
      "❌ Invalid JSON received:",
      err.message,
      "path:",
      req.originalUrl,
      "method:",
      req.method,
      "rawBody:",
      truncated
    );
    return res.status(400).json({ success: false, message: "Invalid JSON payload" });
  }
  return next(err);
});

// Logging middleware
app.use((req, res, next) => {
  console.log(
    `[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip} Origin: ${req.headers.origin || "-"}`
  );
  next();
});

// --- CoinGecko proxy endpoint (cached fallback) ---
app.get("/api/proxy/coins/list", async (req, res) => {
  const cacheDir = path.join(process.cwd(), "data");
  const cacheFile = path.join(cacheDir, "coins-cache.json");

  try {
    const response = await axios.get("https://api.coingecko.com/api/v3/coins/list", { timeout: 15000 });
    const data = response.data;
    try {
      await fs.promises.mkdir(cacheDir, { recursive: true });
      await fs.promises.writeFile(cacheFile, JSON.stringify(data));
    } catch (writeErr) {
      console.warn("CoinGecko cache write failed:", writeErr.message);
    }
    return res.json(data);
  } catch (fetchErr) {
    console.warn("CoinGecko fetch failed, returning cached data if available");
    try {
      const cached = await fs.promises.readFile(cacheFile, "utf8");
      return res.json(JSON.parse(cached));
    } catch (cacheErr) {
      return res.status(500).json({ error: "Failed to fetch coins and no cache available" });
    }
  }
});

// --- Diagnostic Endpoints ---
app.get("/api/ping", (req, res) => res.json({ ok: true, time: Date.now() }));
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
  res.status(err.status || 500).json({ success: false, message: err.message || "Internal Server Error" });
});

// --- 6️⃣ Socket.IO Setup ---
const io = new Server(server, { cors: { origin: allowedOrigins, methods: ["GET", "POST"], credentials: true } });
const connectedUsers = new Map();

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next();
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
  if (socket.userId) {
    const uid = String(socket.userId);
    const set = connectedUsers.get(uid) || new Set();
    set.add(socket.id);
    connectedUsers.set(uid, set);
  }
  socket.on("disconnect", () => {
    connectedUsers.forEach((set, key) => {
      if (set.has(socket.id)) {
        set.delete(socket.id);
        if (set.size === 0) connectedUsers.delete(key);
      }
    });
  });
});

app.set("io", io);
app.set("connectedUsers", connectedUsers);

// --- 7️⃣ MongoDB Connection + Server Startup ---
const startServer = async () => {
  try {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI not set in environment");
    console.log("🔗 Connecting to MongoDB...");

    // Connect to MongoDB Atlas (password with special characters is URL-encoded)
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    server.listen(PORT, "0.0.0.0", () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
};

startServer();

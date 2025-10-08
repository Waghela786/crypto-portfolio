// backend/routes/transactionRoutes.js
import express from "express";
import Transaction from "../models/transactionModel.js";
import User from "../models/userModel.js";
import Wallet from "../models/walletModel.js";
import Notification from "../models/notificationModel.js"; // ✅ Added
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ==============================
// Verify recipient exists
// ==============================
router.post("/verify-user", protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ ok: false, message: "Unauthorized" });

    let { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, message: "Email is required" });

    email = email.trim().toLowerCase();
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ ok: false, message: "Recipient does not exist on the app" });

    res.json({ ok: true, message: "User exists" });
  } catch (err) {
    console.error("Error in /verify-user:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

// ==============================
// Send coin
// ==============================
router.post("/send", protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const io = req.app.get("io"); // ✅ get Socket.IO instance
    const connectedUsers = req.app.get("connectedUsers"); // ✅ map of online users

    let { coin, amount, toEmail } = req.body;
    if (!coin || !amount || !toEmail)
      return res.status(400).json({ message: "All fields are required" });

    amount = parseFloat(amount);
    toEmail = toEmail.trim().toLowerCase();

    if (toEmail === req.user.email.toLowerCase())
      return res.status(400).json({ message: "You cannot send coins to yourself" });

    const recipient = await User.findOne({ email: toEmail });
    if (!recipient) return res.status(404).json({ message: "Recipient does not exist on the app" });

    const senderWallet = await Wallet.findOne({ user: req.user._id, coin });
    if (!senderWallet || senderWallet.amount < amount)
      return res.status(400).json({ message: "Insufficient balance" });

    senderWallet.amount -= amount;
    await senderWallet.save();

    let recipientWallet = await Wallet.findOne({ user: recipient._id, coin });
    if (!recipientWallet) {
      recipientWallet = new Wallet({ user: recipient._id, coin, amount });
    } else {
      recipientWallet.amount += amount;
    }
    await recipientWallet.save();

    const transaction = new Transaction({
      from: req.user._id,
      fromEmail: req.user.email,
      to: recipient._id,
      toEmail: recipient.email,
      coin,
      amount,
    });
    await transaction.save();

    // ✅ Create notification for recipient
    const notification = await Notification.create({
      user: recipient._id,
      sender: req.user._id,
      fromEmail: req.user.email,
      toEmail: recipient.email,
      type: "coin",
      message: `${req.user.name || req.user.email} sent you ${amount} ${coin}`,
    });

    // --- Debug logging: show notification and connected socket ids ---
    try {
      console.log("🔔 Created notification:", {
        id: notification._id?.toString(),
        user: notification.user?.toString(),
        sender: notification.sender?.toString(),
        fromEmail: notification.fromEmail,
        toEmail: notification.toEmail,
        message: notification.message,
      });

      const recipientSockets = connectedUsers.get(recipient._id.toString());
      const senderSockets = connectedUsers.get(req.user._id.toString());
      console.log("🔎 Socket map lookup:", {
        recipientId: recipient._id.toString(),
        recipientSockets: recipientSockets ? Array.from(recipientSockets) : null,
        senderId: req.user._id.toString(),
        senderSockets: senderSockets ? Array.from(senderSockets) : null,
        connectedUsersCount: connectedUsers.size,
      });

      if (recipientSockets && recipientSockets.size > 0 && io) {
        // Emit to all sockets for the recipient
        recipientSockets.forEach((sockId) => {
          try {
            // Safety: skip if sockId belongs to senderSockets (rare)
            if (senderSockets && senderSockets.has(sockId)) {
              console.warn("⚠️ Skipping emit to socket that belongs to sender", { sockId });
              return;
            }

            // Extra safety: verify the socket's authenticated userId (if available on socket)
            const sock = io.sockets.sockets.get(sockId);
            const socketUserId = sock && sock.userId ? String(sock.userId) : null;
            const shouldEmit = (!socketUserId || String(socketUserId) === String(recipient._id)) && !(senderSockets && senderSockets.has(sockId));
            console.log("[EMIT DEBUG] attempt", { sockId, socketUserId, recipientId: String(recipient._id), senderId: String(req.user._id), shouldEmit });
            if (!shouldEmit) {
              console.warn("⚠️ Not emitting to socket (fails checks)", { sockId, socketUserId, recipientId: recipient._id, senderId: req.user._id });
              return;
            }

            io.to(sockId).emit("newNotification", notification);
            console.log(`📢 Notification emitted to socket ${sockId} for user ${recipient._id}`);
          } catch (emitErr) {
            console.error("Error emitting to socket", sockId, emitErr);
          }
        });
      } else {
        console.log(`⚠️ Recipient ${recipient._id} not connected — skipping real-time emit`);
      }
    } catch (logErr) {
      console.error("Error logging / emitting notification:", logErr);
    }

    res.json({ message: "✅ Transaction successful!" });
  } catch (err) {
    console.error("Error in /send:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// Batch send: send multiple coins in one request
// Accepts { items: [{ toEmail, coin, amount }] }
// Responds with results per item
// ==============================
router.post("/send-batch", protect, async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    const io = req.app.get("io");
    const connectedUsers = req.app.get("connectedUsers");

    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "items array required" });

    const results = [];

    for (const it of items) {
      const { toEmail, coin, amount } = it || {};
      if (!toEmail || !coin || !amount || isNaN(amount) || Number(amount) <= 0) {
        results.push({ toEmail: toEmail || null, coin: coin || null, status: "error", message: "Invalid item" });
        continue;
      }

      // Basic validations
      if (toEmail.trim().toLowerCase() === req.user.email.toLowerCase()) {
        results.push({ toEmail, coin, status: "error", message: "Cannot send to yourself" });
        continue;
      }

      const recipient = await User.findOne({ email: toEmail.trim().toLowerCase() });
      if (!recipient) {
        results.push({ toEmail, coin, status: "error", message: "Recipient not found" });
        continue;
      }

      const senderWallet = await Wallet.findOne({ user: req.user._id, coin });
      if (!senderWallet || senderWallet.amount < Number(amount)) {
        results.push({ toEmail, coin, status: "error", message: "Insufficient balance" });
        continue;
      }

      // Perform transfer
      try {
        senderWallet.amount -= Number(amount);
        await senderWallet.save();

        let recipientWallet = await Wallet.findOne({ user: recipient._id, coin });
        if (!recipientWallet) recipientWallet = new Wallet({ user: recipient._id, coin, amount: Number(amount) });
        else recipientWallet.amount += Number(amount);
        await recipientWallet.save();

        const transaction = new Transaction({
          from: req.user._id,
          fromEmail: req.user.email,
          to: recipient._id,
          toEmail: recipient.email,
          coin,
          amount: Number(amount),
        });
        await transaction.save();

        const notification = await Notification.create({
          user: recipient._id,
          sender: req.user._id,
          fromEmail: req.user.email,
          toEmail: recipient.email,
          type: "coin",
          message: `${req.user.name || req.user.email} sent you ${amount} ${coin}`,
        });

        // Emit notification to recipient sockets (same logic as single-send)
        try {
          const recipientSockets = connectedUsers.get(recipient._id.toString());
          const senderSockets = connectedUsers.get(req.user._id.toString());
          if (recipientSockets && recipientSockets.size > 0 && io) {
            recipientSockets.forEach((sockId) => {
              try {
                if (senderSockets && senderSockets.has(sockId)) return;
                const sock = io.sockets.sockets.get(sockId);
                const socketUserId = sock && sock.userId ? String(sock.userId) : null;
                const shouldEmit = (!socketUserId || String(socketUserId) === String(recipient._id)) && !(senderSockets && senderSockets.has(sockId));
                if (!shouldEmit) return;
                io.to(sockId).emit("newNotification", notification);
              } catch (emitErr) {
                console.error("Error emitting batch notification to socket", sockId, emitErr);
              }
            });
          }
        } catch (emitLogErr) {
          console.error("Error handling emit for batch item:", emitLogErr);
        }

        results.push({ toEmail, coin, status: "ok", amount: recipientWallet.amount });
      } catch (opErr) {
        console.error("Error processing batch item:", opErr);
        results.push({ toEmail, coin, status: "error", message: "Server error" });
      }
    }

    return res.json({ message: `Processed ${results.length} items`, results });
  } catch (err) {
    console.error("Batch send error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ==============================
// Get received transactions
// ==============================
router.get("/received", protect, async (req, res) => {
  try {
    const received = await Transaction.find({ to: req.user._id }).sort({ createdAt: -1 });
    res.json(received);
  } catch (err) {
    console.error("Error fetching received transactions:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

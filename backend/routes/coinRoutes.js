// backend/routes/coinRoutes.js
import express from "express";
import User from "../models/userModel.js";
import Notification from "../models/notificationModel.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------------------------
// Send coins from sender to recipient
// ---------------------------
router.post("/send", protect, async (req, res) => {
  try {
    const senderId = req.user._id;
    const { recipientEmail, amount } = req.body;

    if (!recipientEmail || !amount) {
      return res.status(400).json({ message: "Recipient email and amount are required" });
    }

    // Normalize email
    const normalizedEmail = recipientEmail.trim().toLowerCase();

    // Find recipient
    const recipient = await User.findOne({ email: normalizedEmail });
    if (!recipient) return res.status(404).json({ message: "Recipient not found" });

    // Find sender
    const sender = await User.findById(senderId);
    if (!sender) return res.status(404).json({ message: "Sender not found" });

    // Initialize coins if not present
    if (typeof sender.coins !== "number") sender.coins = 0;
    if (typeof recipient.coins !== "number") recipient.coins = 0;

    // Check sender balance
    if (sender.coins < amount) return res.status(400).json({ message: "Insufficient balance" });

    // Update balances
    sender.coins -= amount;
    recipient.coins += amount;

    await sender.save();
    await recipient.save();

    console.log("✅ Coins transferred:", { sender: sender.email, recipient: recipient.email, amount });

    // Create notification for recipient
    try {
      const notification = await Notification.create({
        user: recipient._id,
        sender: sender._id,
        type: "coin",
        message: `You received ${amount} coins from ${sender.name}!`,
      });
      console.log("🔔 Notification created:", notification);

      // If using Socket.IO
      const io = req.app.get("io");
      const connectedUsers = req.app.get("connectedUsers");
      const recipientSockets = connectedUsers.get(recipient._id.toString());
      const senderSockets = connectedUsers.get(sender._id.toString());
      console.log("🔎 Socket map lookup (coinRoutes):", {
        recipientId: recipient._id.toString(),
        recipientSockets: recipientSockets ? Array.from(recipientSockets) : null,
        senderId: sender._id.toString(),
        senderSockets: senderSockets ? Array.from(senderSockets) : null,
        connectedUsersCount: connectedUsers.size,
      });
      if (io && recipientSockets && recipientSockets.size > 0) {
        recipientSockets.forEach((sockId) => {
          try {
            const sock = io.sockets.sockets.get(sockId);
            const socketUserId = sock && sock.userId ? String(sock.userId) : null;
            const shouldEmit = (!socketUserId || String(socketUserId) === String(recipient._id)) && !(senderSockets && senderSockets.has(sockId));
            console.log("[EMIT DEBUG coinRoutes] attempt", { sockId, socketUserId, recipientId: String(recipient._id), senderId: String(sender._id), shouldEmit });
            if (!shouldEmit) {
              console.warn("⚠️ Not emitting to socket (fails checks)", { sockId, socketUserId, recipientId: recipient._id, senderId: sender._id });
              return;
            }
            io.to(sockId).emit("newNotification", notification);
            console.log("💬 Notification sent via Socket.IO to", sockId);
          } catch (err) {
            console.error("Error emitting to socket", sockId, err);
          }
        });
      } else {
        console.log(`⚠️ Recipient ${recipient._id} not connected — skipping real-time emit`);
      }
    } catch (notifErr) {
      console.error("❌ Error creating notification:", notifErr);
    }

    return res.json({ message: "Coins sent successfully" });
  } catch (err) {
    console.error("❌ Error sending coins:", err);
    return res.status(500).json({ message: err.message });
  }
});

export default router;

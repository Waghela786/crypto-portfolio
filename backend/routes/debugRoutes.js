import express from "express";
import Notification from "../models/notificationModel.js";

const router = express.Router();

// Return the connectedUsers mapping (userId -> [socketIds])
router.get("/connected-users", (req, res) => {
  try {
    const connectedUsers = req.app.get("connectedUsers");
    if (!connectedUsers) return res.json({ ok: true, users: [] });

    const result = Array.from(connectedUsers.entries()).map(([userId, set]) => ({
      userId,
      sockets: Array.from(set || []),
    }));

    res.json({ ok: true, users: result });
  } catch (err) {
    console.error("Error in /api/debug/connected-users:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Return a socketId -> userId map for all currently connected sockets
router.get("/sockets", (req, res) => {
  try {
    const io = req.app.get("io");
    if (!io) return res.json({ ok: true, sockets: [] });

    const sockets = [];
    io.sockets.sockets.forEach((socket, id) => {
      sockets.push({ socketId: id, userId: socket.userId || null });
    });

    res.json({ ok: true, sockets });
  } catch (err) {
    console.error("Error in /api/debug/sockets:", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

// Dev-only: create & emit a test notification to a userId
router.post("/test-notification", async (req, res) => {
  try {
    const { userId, message } = req.body;
    if (!userId || !message) return res.status(400).json({ ok: false, message: "userId and message required" });

    const notification = await Notification.create({ user: userId, message, type: "test", isRead: false });

    const io = req.app.get("io");
    const connectedUsers = req.app.get("connectedUsers");
    const recipientSockets = connectedUsers.get(String(userId));
    const senderSockets = null; // no sender in this test

    // log for debugging
    console.log("[debug/test-notification] created", { notificationId: notification._id?.toString(), userId });
    console.log("[debug/test-notification] recipientSockets", recipientSockets ? Array.from(recipientSockets) : null);

    if (io && recipientSockets && recipientSockets.size > 0) {
      recipientSockets.forEach((sockId) => {
        try {
          const sock = io.sockets.sockets.get(sockId);
          if (sock && sock.userId && String(sock.userId) !== String(userId)) {
            console.warn("[debug/test-notification] socket userId mismatch; skipping", { sockId, socketUserId: sock.userId, userId });
            return;
          }
          io.to(sockId).emit("newNotification", notification);
          console.log("[debug/test-notification] emitted to", sockId);
        } catch (err) {
          console.error("[debug/test-notification] emit error", err);
        }
      });
    } else {
      console.log("[debug/test-notification] recipient not connected");
    }

    res.json({ ok: true, notification });
  } catch (err) {
    console.error("[debug/test-notification] error", err);
    res.status(500).json({ ok: false, message: "Server error" });
  }
});

export default router;

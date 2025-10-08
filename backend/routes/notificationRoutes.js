// notificationRoutes.js
import express from "express";
import Notification from "../models/notificationModel.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get all notifications for logged-in user
router.get("/", protect, async (req, res) => {
  try {
    let notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();

    // Optionally create a default notification if none exist
    if (!notifications || notifications.length === 0) {
      const defaultNotification = new Notification({
        user: req.user._id,
        message: "No notifications yet. Check back later!",
        isRead: true,
      });
      await defaultNotification.save();
      notifications = [defaultNotification];
    }

    res.json(notifications);
  } catch (err) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark a notification as read
router.put("/:id/read", protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ message: "Notification not found" });

    notification.isRead = true;
    await notification.save();
    res.json(notification);
  } catch (err) {
    console.error("Error marking notification as read:", err);
    res.status(500).json({ message: err.message });
  }
});

export default router;

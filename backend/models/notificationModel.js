import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // recipient
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // sender of coins (optional)
    fromEmail: { type: String }, // sender email (optional, useful for clarity)
    toEmail: { type: String }, // recipient email (optional)
    type: { type: String, enum: ["coin"], required: true }, // type of notification
    message: { type: String, required: true },
    link: { type: String, default: null }, // optional link for redirection
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ✅ Prevent OverwriteModelError
const Notification =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);

export default Notification;

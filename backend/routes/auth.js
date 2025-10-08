// backend/routes/auth.js
import express from "express";
import crypto from "crypto";
import User from "../models/userModel.js";
import sendEmail from "../utils/sendEmail.js";

const router = express.Router();

// --- Register ---
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "⚠️ Please provide all fields" });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "❌ User already exists" });

    // Create user (password will be hashed automatically by pre-save hook)
    const user = await User.create({ name, email, password });

    // Generate JWT token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      message: "✅ User registered successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Register error:", err);

    // --- Friendly validation message ---
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);

      // Customize password message if applicable
      const passwordError = err.errors.password
        ? "❌ Password must be at least 6 characters"
        : null;

      return res
        .status(400)
        .json({ message: passwordError || messages[0] });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// --- Login ---
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: "⚠️ Please enter both email and password" });

    // Case-insensitive lookup to avoid failures when user types different case
    const rawEmail = email.trim();
    const user = await User.findOne({ email: { $regex: `^${rawEmail}$`, $options: "i" } }).select(
      "+password"
    );
    if (!user) {
      console.log("Auth login: user not found for email:", rawEmail);
      return res.status(401).json({ message: "❌ Invalid credentials" });
    }

    if (!user.password) {
      return res.status(500).json({ message: "Server error: password not set" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "❌ Invalid credentials" });

    const token = user.getSignedJwtToken();

    res.status(200).json({
      message: "✅ Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Forgot Password ---
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) return res.status(400).json({ message: "⚠️ Please enter email" });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "❌ User not found" });

    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    try {
      await sendEmail(user.email, "Password Reset", `Click to reset: ${resetUrl}`);
      res.json({ message: "✅ Reset link sent to email" });
    } catch (err) {
      console.error("sendEmail error:", err);
      res.status(200).json({
        message:
          "Reset link generated (email failed to send). Check server logs or use resetUrl.",
        resetUrl,
      });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// --- Reset Password ---
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password)
      return res.status(400).json({ message: "⚠️ Please provide a new password" });

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ message: "❌ Invalid or expired token" });

    user.password = password; // pre-save hook will hash it
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    res.json({ message: "✅ Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

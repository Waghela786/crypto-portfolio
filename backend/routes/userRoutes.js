import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/userModel.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------------------------
// Register a new user (case-insensitive email)
// ---------------------------
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    console.log("Register request received:", { name, email });

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const rawEmail = email.trim();

    // Use case-insensitive regex to check if user exists
    const userExists = await User.findOne({ email: { $regex: `^${rawEmail}$`, $options: "i" } });
    console.log("Check if user exists:", userExists);

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user = await User.create({ name, email: rawEmail.toLowerCase(), password });
    const token = user.getSignedJwtToken();

    console.log("User registered successfully:", user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Error in /register:", err);
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------
// Login user (case-insensitive email)
// ---------------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Login request received:", { email });

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password required" });
    }

    const rawEmail = email.trim();

    // Case-insensitive lookup
    const user = await User.findOne({ email: { $regex: `^${rawEmail}$`, $options: "i" } }).select("+password");

    if (!user) {
      console.log("User not found for login:", rawEmail);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log("Password mismatch for user:", rawEmail);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = user.getSignedJwtToken();
    console.log("Login successful for user:", rawEmail);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Error in /login:", err);
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------
// Get current logged-in user
// ---------------------------
router.get("/me", protect, async (req, res) => {
  console.log("Fetching current user:", req.user._id);
  res.json(req.user);
});

// ---------------------------
// Find user by email (case-insensitive)
// ---------------------------
router.post("/find-user", async (req, res) => {
  try {
    let { email } = req.body;

    if (!email) {
      console.log("No email provided in request body");
      return res.status(400).json({ message: "Email is required" });
    }

    const rawEmail = email.trim();
    console.log("Looking for recipient with email:", rawEmail);

    console.log("DB connection ready state:", mongoose.connection.readyState); // 1 = connected

    // Case-insensitive lookup
    const user = await User.findOne({ email: { $regex: `^${rawEmail}$`, $options: "i" } }).lean();
    console.log("Recipient found:", user);

    if (!user) {
      console.log("User not found, sending 404");
      return res.status(404).json({ message: "Recipient does not exist" });
    }

    console.log("User exists, sending response");
    return res.json({ user });
  } catch (err) {
    console.error("Error in /find-user:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;

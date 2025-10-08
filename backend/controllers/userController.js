const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// --- Utility: Generate JWT Token ---
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// --- @desc    Register new user ---
// --- @route   POST /api/users/register ---
// --- @access  Public ---
const registerUser = asyncHandler(async (req, res) => {
  let { name, email, password } = req.body;

  // Trim inputs & normalize email
  name = name?.trim();
  email = email?.trim().toLowerCase();
  password = password?.trim();

  if (!name || !email || !password) {
    return res.status(400).json({ message: "⚠️ Please provide all fields" });
  }

  // Check if user exists
  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({ message: "❌ User already exists" });
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user in DB
  const user = await User.create({
    name,
    email,
    password: hashedPassword,
  });

  if (!user) {
    return res.status(400).json({ message: "❌ Invalid user data" });
  }

  // Success: return user info + JWT
  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  });
});

// --- @desc    Login user ---
// --- @route   POST /api/users/login ---
// --- @access  Public ---
const loginUser = asyncHandler(async (req, res) => {
  let { email, password } = req.body;

  // Trim inputs & normalize email
  email = email?.trim().toLowerCase();
  password = password?.trim();

  if (!email || !password) {
    return res.status(400).json({ message: "⚠️ Please enter both email and password" });
  }

  // Find user
  const user = await User.findOne({ email });
  if (!user || !user.password) {
    return res.status(401).json({ message: "❌ Invalid email or password" });
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "❌ Invalid email or password" });
  }

  // Success: send user info + JWT
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    token: generateToken(user._id),
  });
});

module.exports = { registerUser, loginUser };

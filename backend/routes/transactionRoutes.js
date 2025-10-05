// backend/routes/transactionRoutes.js
const express = require("express");
const router = express.Router();
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");
const Wallet = require("../models/walletModel");
const { protect } = require("../middleware/authMiddleware");

// Verify recipient exists
router.post("/verify-user", protect, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ ok: false });

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) return res.json({ ok: false });

  res.json({ ok: true });
});

// Send coin
router.post("/send", protect, async (req, res) => {
  const { coin, amount, toEmail } = req.body;
  const senderId = req.user._id;

  if (!coin || !amount || !toEmail) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (toEmail.toLowerCase() === req.user.email.toLowerCase()) {
    return res.status(400).json({ message: "You cannot send to yourself" });
  }

  // Find recipient
  const recipient = await User.findOne({ email: toEmail.toLowerCase() });
  if (!recipient) return res.status(404).json({ message: "Recipient not found" });

  // Check sender balance
  const senderWallet = await Wallet.findOne({ user: senderId, coin });
  if (!senderWallet || senderWallet.amount < amount) {
    return res.status(400).json({ message: "Insufficient balance" });
  }

  // Deduct sender
  senderWallet.amount -= amount;
  await senderWallet.save();

  // Add to recipient
  let recipientWallet = await Wallet.findOne({ user: recipient._id, coin });
  if (!recipientWallet) {
    recipientWallet = new Wallet({ user: recipient._id, coin, amount });
  } else {
    recipientWallet.amount += amount;
  }
  await recipientWallet.save();

  // Save transaction
  const transaction = new Transaction({
    from: senderId,
    fromEmail: req.user.email,
    to: recipient._id,
    toEmail: recipient.email,
    coin,
    amount,
  });
  await transaction.save();

  res.json({ message: "Transaction successful" });
});

// Get received transactions
router.get("/received", protect, async (req, res) => {
  const received = await Transaction.find({ to: req.user._id }).sort({ createdAt: -1 });
  res.json(received);
});

module.exports = router;

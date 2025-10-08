// backend/routes/walletRoutes.js
import express from "express";
import Wallet from "../models/walletModel.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// ---------------------------
// Get all wallets for logged-in user
// ---------------------------
router.get("/", protect, async (req, res) => {
  try {
    const wallets = await Wallet.find({ user: req.user._id });
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------
// Add a wallet/holding
// ---------------------------
router.post("/", protect, async (req, res) => {
  const { coin, amount, valueUSD } = req.body;
  try {
    const wallet = await Wallet.create({
      user: req.user._id,
      coin,
      amount,
      valueUSD,
    });
    res.status(201).json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------
// Delete a wallet by ID
// ---------------------------
router.delete("/:id", protect, async (req, res) => {
  try {
    const wallet = await Wallet.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.json({ message: "Wallet deleted successfully" });
  } catch (err) {
    console.error("Delete error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ---------------------------
// Send coins from logged-in user to another user
// ---------------------------
router.post("/send", protect, async (req, res) => {
  try {
    const { toAddress, amount } = req.body;
    if (!toAddress || !amount)
      return res.status(400).json({ message: "Missing fields" });

    const senderWallet = await Wallet.findOne({ user: req.user._id });
    const receiverWallet = await Wallet.findOne({ address: toAddress });

    if (!senderWallet)
      return res.status(404).json({ message: "Sender wallet not found" });
    if (!receiverWallet)
      return res.status(404).json({ message: "Receiver not found" });
    if (senderWallet.balance < amount)
      return res.status(400).json({ message: "Insufficient balance" });

    // Perform transaction
    senderWallet.balance -= amount;
    receiverWallet.balance += amount;

    await senderWallet.save();
    await receiverWallet.save();

    res.json({ success: true, message: `Sent ${amount} coins to ${toAddress}` });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------------------------
// Receive coins (dummy route — for showing in UI only)
// ---------------------------
router.post("/receive", protect, async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    res.json({
      message: "Your wallet address to receive coins",
      address: wallet.address,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;

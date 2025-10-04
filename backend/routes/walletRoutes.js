const express = require("express");
const router = express.Router();
const Wallet = require("../models/walletModel");
const { protect } = require("../middleware/authMiddleware");

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
      user: req.user._id, // Ensure user can only delete their own wallet
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

module.exports = router;

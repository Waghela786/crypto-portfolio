import express from "express";
import Wallet from "../models/walletModel.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// POST /wallets/bank-add: Add coins to logged-in user's wallet
router.post("/bank-add", protect, async (req, res) => {
  try {
    const { coin, amount } = req.body;
    if (!coin || !amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Coin and valid amount required" });
    }
    const userId = req.user._id;
    let wallet = await Wallet.findOne({ user: userId, coin });
    if (!wallet) {
      wallet = new Wallet({ user: userId, coin, amount });
    } else {
      wallet.amount += parseFloat(amount);
    }
    await wallet.save();
    res.json({ message: `✅ Added ${amount} ${coin} to your wallet!`, wallet });
  } catch (err) {
    console.error("Bank add error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /wallets/bank-add-batch: Add multiple coins at once (items: [{ coin, amount }])
router.post("/bank-add-batch", protect, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "items array required" });
    }

    const userId = req.user._id;
    const results = [];

    for (const it of items) {
      const { coin, amount } = it || {};
      if (!coin || !amount || isNaN(amount) || Number(amount) <= 0) {
        results.push({ coin: coin || null, status: "error", message: "Invalid coin or amount" });
        continue;
      }
      // Find or create wallet entry
      let wallet = await Wallet.findOne({ user: userId, coin });
      if (!wallet) {
        wallet = new Wallet({ user: userId, coin, amount: Number(amount) });
      } else {
        wallet.amount += Number(amount);
      }
      await wallet.save();
      results.push({ coin, status: "ok", amount: wallet.amount, walletId: wallet._id });
    }

    return res.json({ message: `Processed ${results.length} items`, results });
  } catch (err) {
    console.error("Bank batch add error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;


const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  walletId: { type: mongoose.Schema.Types.ObjectId, ref: "Wallet", required: true },
  cryptoSymbol: { type: String, required: true },
  type: { type: String, enum: ["BUY", "SELL"], required: true },
  amount: { type: Number, required: true },        // crypto units
  price: { type: Number, required: true },         // price per unit at tx time (USD)
  totalValue: { type: Number, required: true },    // amount * price (USD)
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transaction", transactionSchema);

const mongoose = require("mongoose");

const holdingSchema = new mongoose.Schema({
  cryptoSymbol: { type: String, required: true },
  amount: { type: Number, default: 0 }
}, { _id: false });

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  walletName: { type: String, required: true },
  holdings: [holdingSchema], // array of {cryptoSymbol, amount}
  balance: { type: Number, default: 0 }, // total invested (USD) or running fiat balance
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Wallet", walletSchema);

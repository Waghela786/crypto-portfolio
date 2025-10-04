const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  coin: { type: String, required: true }, // e.g., Bitcoin
  amount: { type: Number, required: true }, // amount owned
  valueUSD: { type: Number }, // optional: current value in USD
});

module.exports = mongoose.model("Wallet", walletSchema);

// backend/models/transactionModel.js
const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coin: { type: String, required: true },
    amount: { type: Number, required: true },
    type: { type: String, enum: ["sent", "received"], required: true }, // sent or received
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // optional for sent transactions
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);

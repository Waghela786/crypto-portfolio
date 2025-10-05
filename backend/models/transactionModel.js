const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    fromEmail: { type: String, required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toEmail: { type: String, required: true },
    coin: { type: String, required: true },
    amount: { type: Number, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);

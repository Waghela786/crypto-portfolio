// backend/models/transactionModel.js
import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
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

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction;

// backend/models/walletModel.js
import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    coin: { type: String, required: true },
    amount: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

const Wallet = mongoose.model("Wallet", walletSchema);

export default Wallet;

import Transaction from "../models/Transaction.js";
import Wallet from "../models/Wallet.js";
import Notification from "../models/notificationModel.js"; // ✅ new import
import axios from "axios";

const symbolToId = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  ADA: "cardano",
  SOL: "solana"
};

export const addTransaction = async (req, res) => {
  try {
    const { walletId, cryptoSymbol, type, amount, price } = req.body;
    const totalValue = Number(amount) * Number(price);

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });
    if (String(wallet.userId) !== req.user.id) return res.status(403).json({ msg: "Access denied" });

    const tx = await Transaction.create({
      walletId,
      cryptoSymbol,
      type,
      amount,
      price,
      totalValue,
    });

    // Update holdings
    const idx = wallet.holdings.findIndex(
      (h) => h.cryptoSymbol.toUpperCase() === cryptoSymbol.toUpperCase()
    );
    if (idx > -1) {
      wallet.holdings[idx].amount =
        Number(wallet.holdings[idx].amount) +
        (type === "BUY" ? Number(amount) : -Number(amount));
    } else {
      wallet.holdings.push({
        cryptoSymbol: cryptoSymbol.toUpperCase(),
        amount: type === "BUY" ? Number(amount) : -Number(amount),
      });
    }

    // Update balance
    wallet.balance =
      (wallet.balance || 0) +
      (type === "BUY" ? totalValue : -totalValue);

    await wallet.save();

    // ✅ Create Notification for this transaction
    const message =
      type === "BUY"
        ? `You bought ${amount} ${cryptoSymbol}`
        : `You sold ${amount} ${cryptoSymbol}`;

    await Notification.create({
      user: req.user._id,
      message,
      link: `/transactions/${wallet._id}`, // redirect to transaction page
      isRead: false,
    });

    res.json({ tx, wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

export const getTransactionsByWallet = async (req, res) => {
  try {
    const walletId = req.params.walletId;
    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });
    if (String(wallet.userId) !== req.user.id)
      return res.status(403).json({ msg: "Access denied" });

    const txs = await Transaction.find({ walletId }).sort({ date: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getWalletPortfolio = async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });
    if (String(wallet.userId) !== req.user.id)
      return res.status(403).json({ msg: "Access denied" });

    const holdings = wallet.holdings.filter((h) => Number(h.amount) !== 0);
    if (holdings.length === 0)
      return res.json({ holdings: [], totalValueUSD: 0 });

    const ids = holdings
      .map((h) => symbolToId[h.cryptoSymbol.toUpperCase()])
      .filter(Boolean)
      .join(",");

    const resp = await axios.get(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`
    );
    const priceData = resp.data;

    const resultHoldings = holdings.map((h) => {
      const id = symbolToId[h.cryptoSymbol.toUpperCase()];
      const priceUSD = id && priceData[id] ? priceData[id].usd : null;
      const valueUSD = priceUSD != null ? Number(h.amount) * priceUSD : null;
      return {
        cryptoSymbol: h.cryptoSymbol,
        amount: Number(h.amount),
        currentPriceUSD: priceUSD,
        valueUSD,
      };
    });

    const totalValueUSD = resultHoldings.reduce(
      (sum, h) => sum + (h.valueUSD || 0),
      0
    );

    res.json({ walletId: wallet._id, holdings: resultHoldings, totalValueUSD });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

const Transaction = require("../models/Transaction");
const Wallet = require("../models/Wallet");
const axios = require("axios");

// helper: symbol -> CoinGecko id (extend as needed)
const symbolToId = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  ADA: "cardano",
  SOL: "solana"
};

exports.addTransaction = async (req, res) => {
  try {
    const { walletId, cryptoSymbol, type, amount, price } = req.body;
    const totalValue = Number(amount) * Number(price);

    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });
    if (String(wallet.userId) !== req.user.id) return res.status(403).json({ msg: "Access denied" });

    const tx = await Transaction.create({ walletId, cryptoSymbol, type, amount, price, totalValue });

    // update holdings
    const idx = wallet.holdings.findIndex(h => h.cryptoSymbol.toUpperCase() === cryptoSymbol.toUpperCase());
    if (idx > -1) {
      wallet.holdings[idx].amount = Number(wallet.holdings[idx].amount) + (type === "BUY" ? Number(amount) : -Number(amount));
    } else {
      wallet.holdings.push({ cryptoSymbol: cryptoSymbol.toUpperCase(), amount: type === "BUY" ? Number(amount) : -Number(amount) });
    }

    // update balance (simple approach: BUY increases invested amount, SELL decreases)
    wallet.balance = (wallet.balance || 0) + (type === "BUY" ? totalValue : -totalValue);

    await wallet.save();

    res.json({ tx, wallet });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

exports.getTransactionsByWallet = async (req, res) => {
  try {
    const walletId = req.params.walletId;
    const wallet = await Wallet.findById(walletId);
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });
    if (String(wallet.userId) !== req.user.id) return res.status(403).json({ msg: "Access denied" });

    const txs = await Transaction.find({ walletId }).sort({ date: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getWalletPortfolio = async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ msg: "Wallet not found" });
    if (String(wallet.userId) !== req.user.id) return res.status(403).json({ msg: "Access denied" });

    // build list of symbols with positive amount
    const holdings = wallet.holdings.filter(h => Number(h.amount) !== 0);
    if (holdings.length === 0) return res.json({ holdings: [], totalValueUSD: 0 });

    const ids = holdings
      .map(h => symbolToId[h.cryptoSymbol.toUpperCase()])
      .filter(Boolean)
      .join(",");

    // fetch prices from CoinGecko
    const resp = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    const priceData = resp.data;

    // compute value per holding
    const resultHoldings = holdings.map(h => {
      const id = symbolToId[h.cryptoSymbol.toUpperCase()];
      const priceUSD = id && priceData[id] ? priceData[id].usd : null;
      const valueUSD = priceUSD != null ? Number(h.amount) * priceUSD : null;
      return {
        cryptoSymbol: h.cryptoSymbol,
        amount: Number(h.amount),
        currentPriceUSD: priceUSD,
        valueUSD
      };
    });

    const totalValueUSD = resultHoldings.reduce((sum, h) => sum + (h.valueUSD || 0), 0);

    res.json({ walletId: wallet._id, holdings: resultHoldings, totalValueUSD });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: err.message });
  }
};

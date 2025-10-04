const Wallet = require("../models/Wallet");

exports.createWallet = async (req, res) => {
  const { walletName } = req.body;
  try {
    const wallet = await Wallet.create({ userId: req.user.id, walletName });
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getWallets = async (req, res) => {
  try {
    const wallets = await Wallet.find({ userId: req.user.id });
    res.json(wallets);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

exports.getWalletById = async (req, res) => {
  try {
    const wallet = await Wallet.findById(req.params.id);
    if (!wallet) return res.status(404).json({ msg: "Not found" });
    if (String(wallet.userId) !== req.user.id) return res.status(403).json({ msg: "Access denied" });
    res.json(wallet);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

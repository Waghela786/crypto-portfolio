// src/pages/WalletPage.js
import React, { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import WalletActions from "../components/WalletActions";

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const token = localStorage.getItem("token");

  const fetchWallet = useCallback(async () => {
    try {
      const res = await API.get("/wallets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWallet(res.data[0]); // assuming first wallet for simplicity
    } catch (err) {
      console.error("Error fetching wallet:", err);
    }
  }, [token]);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-lg rounded-xl">
      <h1 className="text-2xl font-bold mb-4">My Wallet</h1>
      {wallet ? (
        <div className="text-center">
          <p>Coin: {wallet.coin}</p>
          <p>Balance: {wallet.balance ?? wallet.amount}</p>
          <p>Value USD: ${wallet.valueUSD}</p>

          {/* Send/Receive buttons */}
          <WalletActions walletAddress={wallet.address} onUpdateBalance={fetchWallet} />
        </div>
      ) : (
        <p>Loading wallet...</p>
      )}
    </div>
  );
};

export default WalletPage;

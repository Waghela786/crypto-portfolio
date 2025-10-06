// src/pages/WalletPage.js
import React, { useEffect, useState } from "react";
import axios from "axios";
import WalletActions from "../components/WalletActions";

const WalletPage = () => {
  const [wallet, setWallet] = useState(null);
  const token = localStorage.getItem("token");

  const fetchWallet = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/wallets", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWallet(res.data[0]); // assuming first wallet for simplicity
    } catch (err) {
      console.error("Error fetching wallet:", err);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

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

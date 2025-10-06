// src/components/WalletActions.js
import React, { useState } from "react";
import axios from "axios";

const WalletActions = ({ walletAddress, onUpdateBalance }) => {
  const [showSendForm, setShowSendForm] = useState(false);
  const [showReceive, setShowReceive] = useState(false);
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token"); // Assuming you use JWT

  // Send coins
  const handleSend = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(
        "http://localhost:5000/api/wallets/send",
        { toAddress, amount: Number(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(res.data.message);
      setToAddress("");
      setAmount("");
      onUpdateBalance?.(); // refresh wallet data in parent
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending coins");
    }
  };

  // Show wallet address (receive)
  const handleReceive = async () => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/wallets/receive",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage(`Your address: ${res.data.address}`);
      setShowReceive(true);
      setShowSendForm(false);
    } catch (err) {
      setMessage("Error fetching wallet address");
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 mt-6">
      <div className="flex gap-4">
        <button
          onClick={() => {
            setShowSendForm(true);
            setShowReceive(false);
            setMessage("");
          }}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          🚀 Send
        </button>
        <button
          onClick={handleReceive}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
        >
          💰 Receive
        </button>
      </div>

      {showSendForm && (
        <form
          onSubmit={handleSend}
          className="mt-4 flex flex-col gap-2 w-80 p-4 border rounded-lg"
        >
          <input
            type="text"
            placeholder="Recipient Address"
            value={toAddress}
            onChange={(e) => setToAddress(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <input
            type="number"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border p-2 rounded"
            required
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Send Coins
          </button>
        </form>
      )}

      {showReceive && message && (
        <div className="mt-4 text-center p-4 border rounded-lg bg-gray-100">
          <p>{message}</p>
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${walletAddress}`}
            alt="Wallet QR"
            className="mx-auto mt-2"
          />
        </div>
      )}

      {!showSendForm && !showReceive && message && (
        <p className="mt-2 text-green-600 font-medium">{message}</p>
      )}
    </div>
  );
};

export default WalletActions;

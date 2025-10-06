// src/pages/Transactions.js
import React, { useEffect, useState, useCallback } from "react";
import API from "../services/api";

export default function Transactions() {
  const [tab, setTab] = useState("send");
  const [wallets, setWallets] = useState([]);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [selectedCoin, setSelectedCoin] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [receivedTx, setReceivedTx] = useState([]);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");
  const userEmail = localStorage.getItem("userEmail"); // Must be set on login/signup

  // Redirect if user is not logged in
  useEffect(() => {
    if (!userEmail || !token) {
      setMessage("❌ User not logged in");
      // Optional: redirect to login page
      // window.location.href = "/login";
    }
  }, [userEmail, token]);

  const fetchWallets = useCallback(async () => {
    if (!token) return;
    try {
      const res = await API.get("/wallets", { headers: { Authorization: `Bearer ${token}` } });
      setWallets(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const fetchReceived = useCallback(async () => {
    if (!token) return;
    try {
      const res = await API.get("/transactions/received", { headers: { Authorization: `Bearer ${token}` } });
      setReceivedTx(res.data);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    fetchWallets();
    fetchReceived();
  }, [fetchWallets, fetchReceived]);

  const handleSend = async (e) => {
    e.preventDefault();

    if (!token || !userEmail) {
      setMessage("❌ User not logged in");
      return;
    }

    if (!selectedCoin || !sendAmount || !recipientEmail) {
      setMessage("❌ Please fill all fields");
      return;
    }

    // Self-transfer prevention
    if (recipientEmail.toLowerCase() === userEmail.toLowerCase()) {
      setMessage("❌ You cannot send coins to yourself!");
      return;
    }

    // Verify recipient exists
    try {
      const verifyRes = await API.post(
        "/transactions/verify-user",
        { email: recipientEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!verifyRes.data.ok) {
        setMessage("❌ Recipient does not exist on the app");
        return;
      }
    } catch (err) {
      setMessage("❌ Unable to verify recipient");
      return;
    }

    // Check balance
    const walletCoin = wallets.find((w) => w.coin === selectedCoin);
    if (!walletCoin || parseFloat(sendAmount) > parseFloat(walletCoin.amount)) {
      setMessage("❌ Insufficient coin balance");
      return;
    }

    // Send coin
    try {
      await API.post(
        "/transactions/send",
        { coin: selectedCoin, amount: parseFloat(sendAmount), toEmail: recipientEmail },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage("✅ Transaction successful!");
      setSelectedCoin("");
      setSendAmount("");
      setRecipientEmail("");
      fetchWallets();
      fetchReceived();
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to send coin. " + (err.response?.data?.message || ""));
    }
  };

  const tabButtonStyle = (active) => ({
    padding: "10px 20px",
    backgroundColor: active ? "#4caf50" : "#ccc",
    color: active ? "white" : "#333",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  });

  const inputStyle = { padding: "10px", borderRadius: "5px", border: "1px solid #ccc" };

  return (
    <div style={{ padding: "30px", maxWidth: "900px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>💸 Transactions</h2>

      {message && (
        <p
          style={{
            textAlign: "center",
            color: message.startsWith("❌") ? "red" : "green",
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px", gap: "10px" }}>
        <button onClick={() => setTab("send")} style={tabButtonStyle(tab === "send")}>Send</button>
        <button onClick={() => setTab("received")} style={tabButtonStyle(tab === "received")}>Received</button>
      </div>

      {/* Send Form */}
      {tab === "send" && (
        <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <select value={selectedCoin} onChange={(e) => setSelectedCoin(e.target.value)} required style={inputStyle}>
            <option value="">Select Coin</option>
            {wallets.map((w) => (
              <option key={w.coin} value={w.coin}>
                {w.coin} (Balance: {w.amount})
              </option>
            ))}
          </select>

          <input
            type="number"
            placeholder="Amount"
            value={sendAmount}
            onChange={(e) => setSendAmount(e.target.value)}
            required
            style={inputStyle}
          />

          <input
            type="email"
            placeholder="Recipient Email"
            value={recipientEmail}
            onChange={(e) => setRecipientEmail(e.target.value)}
            required
            style={inputStyle}
          />

          {/* Disable send button if recipient is self */}
          <button
            type="submit"
            disabled={recipientEmail.toLowerCase() === userEmail?.toLowerCase()}
            style={{
              ...inputStyle,
              backgroundColor: recipientEmail.toLowerCase() === userEmail?.toLowerCase() ? "#ccc" : "#4caf50",
              color: "white",
              fontWeight: "bold",
              cursor: recipientEmail.toLowerCase() === userEmail?.toLowerCase() ? "not-allowed" : "pointer",
              border: "none",
            }}
          >
            Send Coin
          </button>
        </form>
      )}

      {/* Received Transactions */}
      {tab === "received" && (
        <div>
          {receivedTx.length === 0 ? (
            <p style={{ textAlign: "center" }}>No received transactions yet</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {receivedTx.map((tx) => (
                <li key={tx._id} style={{ padding: "10px", borderBottom: "1px solid #ccc" }}>
                  <strong>{tx.fromEmail}</strong> sent you <strong>{tx.amount}</strong> {tx.coin}
                  <br />
                  <small>{new Date(tx.createdAt).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

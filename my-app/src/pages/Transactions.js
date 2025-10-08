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
  const userEmail = localStorage.getItem("userEmail");

  // Redirect if user is not logged in
  useEffect(() => {
    if (!userEmail || !token) {
      setMessage("❌ User not logged in");
    }
  }, [userEmail, token]);

  // Fetch wallets
  const fetchWallets = useCallback(async () => {
    if (!token) return;
    try {
      const res = await API.get("/wallets", { headers: { Authorization: `Bearer ${token}` } });
      setWallets(res.data);
    } catch (err) {
      console.error("❌ Wallet fetch error:", err.response?.data || err.message);
    }
  }, [token]);

  // Fetch received transactions
  const fetchReceived = useCallback(async () => {
    if (!token) return;
    try {
      const res = await API.get("/transactions/received", { headers: { Authorization: `Bearer ${token}` } });
      setReceivedTx(res.data);
    } catch (err) {
      console.error("❌ Received fetch error:", err.response?.data || err.message);
    }
  }, [token]);

  useEffect(() => {
    fetchWallets();
    fetchReceived();
  }, [fetchWallets, fetchReceived]);

  // ============================
  // Debug function: Verify recipient
  // ============================
  const verifyRecipient = async (email) => {
    try {
      console.log("🔹 Verifying recipient:", email);
      console.log("🔹 Using token:", token);

      const res = await API.post(
        "/transactions/verify-user",
        { email },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("🔹 Backend response:", res.data);
      return res.data.ok;
    } catch (err) {
      console.error("❌ Error verifying recipient:", err.response?.data || err.message);
      return false;
    }
  };

  // ============================
  // Handle send coin
  // ============================
  const handleSend = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!token || !userEmail) {
      setMessage("❌ User not logged in");
      return;
    }

    if (!selectedCoin || !sendAmount || !recipientEmail) {
      setMessage("❌ Please fill all fields");
      return;
    }

    if (recipientEmail.toLowerCase() === userEmail.toLowerCase()) {
      setMessage("❌ You cannot send coins to yourself!");
      return;
    }

    // Verify recipient
    const recipientExists = await verifyRecipient(recipientEmail.trim());
    if (!recipientExists) {
      setMessage("❌ Recipient does not exist on the app");
      return;
    }

    // Check sender balance
    const walletCoin = wallets.find((w) => w.coin === selectedCoin);
    if (!walletCoin || parseFloat(sendAmount) > parseFloat(walletCoin.amount)) {
      setMessage("❌ Insufficient coin balance");
      return;
    }

    // Send coin
    try {
      const res = await API.post(
        "/transactions/send",
        { coin: selectedCoin, amount: parseFloat(sendAmount), toEmail: recipientEmail.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("🔹 Send response:", res.data);
      setMessage("✅ Transaction successful!");
      setSelectedCoin("");
      setSendAmount("");
      setRecipientEmail("");
      fetchWallets();
      fetchReceived();
    } catch (err) {
      console.error("❌ Send coin error:", err.response?.data || err.message);
      setMessage("❌ Failed to send coin. " + (err.response?.data?.message || ""));
    }
  };

  // Batch helpers
  // (Batch-send UI removed to keep Transactions page simple)

  const tabButtonStyle = (active) => ({
    padding: "12px 24px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  });

  const inputStyle = { padding: "12px", borderRadius: "8px", border: "1px solid #ddd", width: "100%", fontSize: 16 };

  // Inline styles (keeps everything in this single file as requested)
  const styles = {
    page: { padding: "30px 16px", display: "flex", justifyContent: "center" },
    container: {
      width: "100%",
      maxWidth: "1000px",
      background: "#fff",
      borderRadius: "8px",
      boxShadow: "0 6px 18px rgba(9, 30, 66, 0.08)",
      padding: 24,
    },
    header: { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 20 },
    alertSuccess: { padding: "8px 12px", borderRadius: 6, fontWeight: 600, background: "#e9f7ee", color: "#05682a" },
    alertError: { padding: "8px 12px", borderRadius: 6, fontWeight: 600, background: "#ffe9e9", color: "#b00020" },
  main: { display: "grid", gridTemplateColumns: "420px 1fr", gap: 28 },
  aside: { borderRight: "1px solid #f0f0f0", paddingRight: 20 },
    tabs: { display: "flex", gap: 8, marginBottom: 16 },
  tabActive: { background: "#4caf50", color: "white", fontWeight: 700, padding: "12px 22px" },
  tabInactive: { background: "#f3f3f3", color: "#333", padding: "12px 22px" },
  label: { display: "block", marginBottom: 14, fontSize: 15 },
  actions: { marginTop: 16 },
  btnPrimary: { padding: "12px 18px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer", background: "#4caf50", color: "#fff", fontSize: 16 },
  btnDisabled: { padding: "12px 18px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "not-allowed", background: "#ccc", color: "#fff", fontSize: 16 },
    content: { paddingLeft: 8 },
    empty: { color: "#666", textAlign: "center", padding: "40px 0" },
    list: { listStyle: "none", padding: 0, margin: 0 },
    item: { padding: "14px 18px", borderRadius: 10, background: "linear-gradient(180deg, #ffffff 0%, #fbfbfb 100%)", boxShadow: "0 1px 0 rgba(0,0,0,0.03)", marginBottom: 12, display: "flex", alignItems: "center" },
    itemMain: { display: "flex", gap: 16, alignItems: "center" },
    icon: { fontSize: 32, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f9fb", borderRadius: 8 },
    title: { fontSize: 16 },
    time: { color: "#666", fontSize: 13, marginTop: 6 },
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <h2 style={{ margin: 0 }}>💸 Transactions</h2>
          {message && (
            <div style={message.startsWith("❌") ? styles.alertError : styles.alertSuccess}>{message}</div>
          )}
        </header>

        <div style={styles.main}>
          <aside style={styles.aside}>
            <div style={styles.tabs}>
              <button
                onClick={() => setTab("send")}
                style={{ ...(tab === "send" ? styles.tabActive : styles.tabInactive), ...tabButtonStyle(tab === "send") }}
              >
                Send
              </button>
              <button
                onClick={() => setTab("received")}
                style={{ ...(tab === "received" ? styles.tabActive : styles.tabInactive), ...tabButtonStyle(tab === "received") }}
              >
                Received
              </button>
            </div>

            {tab === "send" && (
              <form onSubmit={handleSend}>
                <label style={styles.label}>
                  Coin
                  <select value={selectedCoin} onChange={(e) => setSelectedCoin(e.target.value)} required style={inputStyle}>
                    <option value="">Select Coin</option>
                    {wallets.map((w) => (
                      <option key={w.coin} value={w.coin}>
                        {w.coin} (Balance: {w.amount})
                      </option>
                    ))}
                  </select>
                </label>

                <label style={styles.label}>
                  Amount
                  <input
                    type="number"
                    placeholder="Amount"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </label>

                <label style={styles.label}>
                  Recipient Email
                  <input
                    type="email"
                    placeholder="Recipient Email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </label>

                <div style={styles.actions}>
                  <button
                    type="submit"
                    disabled={recipientEmail.toLowerCase() === userEmail?.toLowerCase()}
                    style={recipientEmail.toLowerCase() === userEmail?.toLowerCase() ? styles.btnDisabled : styles.btnPrimary}
                  >
                    Send Coin
                  </button>
                </div>
              </form>
            )}
          </aside>

          <section style={styles.content}>
            {tab === "received" && (
              <div>
                {receivedTx.length === 0 ? (
                  <p style={styles.empty}>No received transactions yet</p>
                ) : (
                  <ul style={styles.list}>
                    {receivedTx.map((tx) => (
                      <li key={tx._id} style={styles.item}>
                        <div style={styles.itemMain}>
                          <div style={styles.icon}>📥</div>
                          <div>
                            <div style={styles.title}><strong>{tx.fromEmail}</strong> sent you <strong>{tx.amount}</strong> {tx.coin}</div>
                            <div style={styles.time}><small>{new Date(tx.createdAt).toLocaleString()}</small></div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

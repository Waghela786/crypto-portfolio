import React, { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import axios from "axios";

// 🧭 Move symbol-to-id map outside the component (fixed)
const symbolToId = {
  BTC: "bitcoin",
  ETH: "ethereum",
  USDT: "tether",
  BNB: "binancecoin",
  ADA: "cardano",
  SOL: "solana",
};

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState("0.00");

  const token = localStorage.getItem("token");

  // ✅ Fetch user info
  const fetchUser = useCallback(async () => {
    if (!token) {
      setMessage("❌ You are not logged in");
      return;
    }
    try {
      const res = await API.get("/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch user data");
    }
  }, [token]);

  // ✅ Fetch wallets with CoinGecko data
  const fetchWallets = useCallback(async () => {
    if (!token) {
      setMessage("❌ Please login first");
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setMessage("");
      const res = await API.get("/wallets", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = Array.isArray(res.data) ? res.data : [];

      const updated = await Promise.all(
        data.map(async (w) => {
          // Case 1: simple wallet { coin, amount }
          if (w.coin && typeof w.amount !== "undefined") {
            try {
              const coinRes = await axios.get(
                `https://api.coingecko.com/api/v3/coins/${w.coin.toLowerCase()}`
              );
              const price = coinRes.data?.market_data?.current_price?.usd;
              const valueUSD = price ? (price * w.amount).toFixed(2) : "N/A";
              return { ...w, valueUSD, image: coinRes.data?.image?.thumb || null };
            } catch {
              return { ...w, valueUSD: "N/A", image: null };
            }
          }
          // Case 2: holdings array
          else if (Array.isArray(w.holdings)) {
            let sum = 0;
            const holdingsWithPrices = await Promise.all(
              w.holdings.map(async (h) => {
                const sym = (h.cryptoSymbol || "").toUpperCase();
                const id = symbolToId[sym] || (h.cryptoSymbol || "").toLowerCase();
                try {
                  const coinRes = await axios.get(
                    `https://api.coingecko.com/api/v3/coins/${id}`
                  );
                  const price = coinRes.data?.market_data?.current_price?.usd;
                  const valueUSD = price != null ? Number(h.amount) * price : null;
                  if (valueUSD) sum += valueUSD;
                  return { ...h, currentPriceUSD: price ?? null, valueUSD };
                } catch {
                  return { ...h, currentPriceUSD: null, valueUSD: null };
                }
              })
            );
            return { ...w, holdings: holdingsWithPrices, valueUSD: sum ? sum.toFixed(2) : "N/A" };
          } else {
            return { ...w, valueUSD: "N/A" };
          }
        })
      );

      const total = updated.reduce(
        (s, w) => s + (w.valueUSD === "N/A" ? 0 : Number(w.valueUSD)),
        0
      );

      setTotalValue(total.toFixed(2));
      setWallets(updated);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch wallets");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUser();
    fetchWallets();
  }, [fetchUser, fetchWallets]);

  if (loading) return <p style={{ textAlign: "center" }}>⏳ Loading dashboard...</p>;

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto" }}>
      {/* Welcome Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea, #764ba2)",
          color: "white",
          padding: "30px",
          borderRadius: "15px",
          textAlign: "center",
          marginBottom: "20px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        }}
      >
        <h1 style={{ margin: "0 0 10px" }}>Welcome to Crypto Portfolio</h1>
        <p style={{ margin: 0 }}>Website created by Ashwin Waghela</p>
      </div>

      {/* User Info */}
      <div
        style={{
          padding: "20px",
          border: "1px solid #ddd",
          borderRadius: "10px",
          marginBottom: "20px",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          textAlign: "center",
        }}
      >
        {message && <p style={{ color: "red" }}>{message}</p>}
        {user ? (
          <div>
            <p style={{ fontSize: "18px" }}>
              Welcome, <strong>{user.name}</strong>
            </p>
            <p style={{ fontSize: "16px", color: "#555" }}>Email: {user.email}</p>
          </div>
        ) : (
          <p>Loading user info...</p>
        )}
      </div>

      {/* Portfolio summary */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "10px",
          textAlign: "center",
          marginBottom: "20px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ margin: 0 }}>Total Portfolio Value: 💵 ${totalValue}</h3>
        <p style={{ margin: 8, color: "#666" }}>{wallets.length} wallet(s) tracked</p>
      </div>

      {/* Quick wallet cards (first 6) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
        }}
      >
        {wallets.length === 0 ? (
          <p style={{ textAlign: "center" }}>No wallets found</p>
        ) : (
          wallets.slice(0, 6).map((w) => (
            <div
              key={w._id || w.walletName || w.coin}
              style={{
                padding: "14px",
                borderRadius: "10px",
                background: "#fff",
                boxShadow: "0 4px 8px rgba(0,0,0,0.06)",
                textAlign: "center",
              }}
            >
              <h4 style={{ margin: "8px 0", color: "#333" }}>
                {w.coin ? w.coin.toUpperCase() : w.walletName || "Wallet"}
              </h4>
              <p style={{ margin: "6px 0" }}>
                Value:{" "}
                <strong style={{ color: "#4caf50" }}>
                  {w.valueUSD === "N/A" ? "N/A" : `$${w.valueUSD}`}
                </strong>
              </p>
              {Array.isArray(w.holdings) && (
                <p style={{ fontSize: 13, color: "#666" }}>{w.holdings.length} holdings</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

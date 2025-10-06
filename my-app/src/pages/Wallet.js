import React, { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import axios from "axios";

export default function Wallet() {
  const [wallets, setWallets] = useState([]);
  const [coinsList, setCoinsList] = useState([]);
  const [selectedCoin, setSelectedCoin] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [totalValue, setTotalValue] = useState(0);

  const token = localStorage.getItem("token");

  // ✅ Fetch wallet data + live prices
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

      const updatedWallets = await Promise.all(
        res.data.map(async (w) => {
          let valueUSD = "N/A";
          let image = null;
          try {
            const coinRes = await axios.get(
              `https://api.coingecko.com/api/v3/coins/${w.coin.toLowerCase()}`
            );
            const price = coinRes.data?.market_data?.current_price?.usd;
            image = coinRes.data?.image?.thumb || null;
            valueUSD = price ? (price * w.amount).toFixed(2) : "N/A";
          } catch {
            valueUSD = "N/A";
          }
          return { ...w, valueUSD, image };
        })
      );

      // sort by highest USD value first
      updatedWallets.sort(
        (a, b) =>
          (b.valueUSD === "N/A" ? 0 : b.valueUSD) -
          (a.valueUSD === "N/A" ? 0 : a.valueUSD)
      );

      // calculate total portfolio value
      const total = updatedWallets.reduce(
        (sum, w) => (w.valueUSD !== "N/A" ? sum + Number(w.valueUSD) : sum),
        0
      );

      setTotalValue(total.toFixed(2));
      setWallets(updatedWallets);
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to fetch wallet data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ✅ Auto-refresh every 30s
  useEffect(() => {
    fetchWallets();
    const interval = setInterval(fetchWallets, 30000);
    return () => clearInterval(interval);
  }, [fetchWallets]);

  // ✅ Fetch coins list
  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const res = await axios.get(
          "https://api.coingecko.com/api/v3/coins/list"
        );
        setCoinsList(res.data);
      } catch (err) {
        console.error("Failed to fetch coins list", err);
      }
    };
    fetchCoins();
  }, []);

  // ✅ Add coin to wallet
  const handleAdd = async (e) => {
    e.preventDefault();
    if (!selectedCoin || !amount) return;

    try {
      await API.post(
        "/wallets",
        { coin: selectedCoin, amount: Number(amount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedCoin("");
      setAmount("");
      setMessage("✅ Coin added successfully");
      fetchWallets();
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to add wallet");
    }
  };

  // ✅ Delete coin
  const handleDelete = async (id, coin) => {
    if (!window.confirm(`Are you sure you want to delete ${coin.toUpperCase()}?`)) return;

    try {
      await API.delete(`/wallets/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage(`🗑️ ${coin.toUpperCase()} deleted successfully`);
      fetchWallets();
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to delete coin");
    }
  };

  const filteredCoins = coinsList.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <p style={{ textAlign: "center" }}>⏳ Loading wallet data...</p>;

  return (
    <div style={{ padding: "30px", maxWidth: "1000px", margin: "0 auto" }}>
      <h2
        style={{
          textAlign: "center",
          marginBottom: "20px",
          color: "#2c3e50",
        }}
      >
        💰 My Crypto Wallet
      </h2>

      {message && (
        <p
          style={{
            color: message.startsWith("❌") ? "red" : "green",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {message}
        </p>
      )}

      {/* Portfolio total */}
      <div
        style={{
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "10px",
          textAlign: "center",
          marginBottom: "30px",
          boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
        }}
      >
        <h3 style={{ margin: 0 }}>Total Portfolio Value: 💵 ${totalValue}</h3>
      </div>

      {/* Add Coin Form */}
      <form
        onSubmit={handleAdd}
        style={{
          display: "flex",
          gap: "10px",
          flexWrap: "wrap",
          justifyContent: "center",
          marginBottom: "30px",
        }}
      >
        <input
          type="text"
          placeholder="Search coin..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: "10px",
            flex: "1",
            minWidth: "200px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        <select
          value={selectedCoin}
          onChange={(e) => setSelectedCoin(e.target.value)}
          required
          style={{
            padding: "10px",
            flex: "1",
            minWidth: "200px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        >
          <option value="">Select Coin</option>
          {filteredCoins.slice(0, 50).map((coin) => (
            <option key={coin.id} value={coin.id}>
              {coin.name} ({coin.symbol.toUpperCase()})
            </option>
          ))}
        </select>

        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          style={{
            padding: "10px",
            width: "120px",
            border: "1px solid #ccc",
            borderRadius: "5px",
          }}
        />

        <button
          type="submit"
          style={{
            padding: "10px 20px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ➕ Add Coin
        </button>
      </form>

      {/* Wallet Cards */}
      {wallets.length === 0 ? (
        <p style={{ textAlign: "center" }}>No coins added yet 🚀</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
          }}
        >
          {wallets.map((w) => (
            <div
              key={w._id || w.coin}
              style={{
                padding: "15px",
                borderRadius: "12px",
                backgroundColor: "#ffffff",
                textAlign: "center",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                transition: "transform 0.2s, box-shadow 0.2s",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.03)";
                e.currentTarget.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.1)";
              }}
            >
              {/* Delete Button */}
              <button
                onClick={() => handleDelete(w._id, w.coin)}
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "#e74c3c",
                  fontSize: "18px",
                  fontWeight: "bold",
                }}
                title="Delete coin"
              >
                ✖
              </button>

              {w.image && (
                <img
                  src={w.image}
                  alt={w.coin}
                  width="50"
                  height="50"
                  style={{ borderRadius: "50%" }}
                />
              )}
              <h4 style={{ margin: "10px 0", color: "#333" }}>
                {w.coin?.toUpperCase() || "N/A"}
              </h4>
              <p>Amount: <strong>{w.amount || 0}</strong></p>
              <p>
                Value (USD):{" "}
                <strong style={{ color: "#4caf50" }}>
                  {w.valueUSD === "N/A" ? "N/A" : `$${w.valueUSD}`}
                </strong>
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

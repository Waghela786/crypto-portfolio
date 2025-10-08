import React, { useState, useEffect } from "react";
import API from "../services/api";
import axios from "axios";

export default function Bank() {
  const [coin, setCoin] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [coinsList, setCoinsList] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingCoins, setLoadingCoins] = useState(true);
  const [coinsError, setCoinsError] = useState("");
  const [batch, setBatch] = useState([]); // [{ coin, amount }]
  const [batchResults, setBatchResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [coinsLoadingErrorDetails, setCoinsLoadingErrorDetails] = useState(null);

  const handleAddCoin = async (e) => {
    e.preventDefault();
    setMessage("");
    if (!coin || !amount) {
      setMessage("❌ Please select coin and enter amount");
      return;
    }
    // Add to local batch instead of sending immediately
    setBatch((prev) => {
      // If coin already in batch, sum amounts
      const existing = prev.find((p) => p.coin === coin);
      if (existing) {
        return prev.map((p) => (p.coin === coin ? { ...p, amount: Number(p.amount) + Number(amount) } : p));
      }
      return [...prev, { coin, amount: Number(amount) }];
    });
    setCoin("");
    setAmount("");
    setMessage("Added to batch — submit to save all to wallet");
  };

  const removeFromBatch = (coinId) => {
    setBatch((prev) => prev.filter((p) => p.coin !== coinId));
  };

  const updateBatchAmount = (coinId, value) => {
    // allow value as string while editing; validation happens on submit
    setBatch((prev) => prev.map((p) => (p.coin === coinId ? { ...p, amount: value } : p)));
  };

  const submitBatch = async () => {
    if (!batch.length) return setMessage("❌ Batch is empty");
    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await API.post("/wallets/bank-add-batch", { items: batch }, { headers: { Authorization: `Bearer ${token}` } });
      // Show per-item results (backend returns results array)
      const results = res.data.results || [];
      setBatchResults(results);
      setMessage(res.data.message || "✅ Batch processed");
      // Clear the batch (we assume server applied changes or reported errors per-item)
      setBatch([]);
    } catch (err) {
      console.error("Batch submit failed", err);
      setMessage(err.response?.data?.message || "❌ Failed to process batch");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchCoins = async () => {
      setLoadingCoins(true);
      setCoinsError("");
      setCoinsLoadingErrorDetails(null);
      try {
        // Try backend proxy first (less likely to be blocked by CORS / rate limits)
        console.debug("Bank: fetching coins from backend proxy /api/proxy/coins/list");
        let res;
        try {
          res = await API.get("/proxy/coins/list");
          console.debug("Bank: proxy returned", Array.isArray(res.data) ? res.data.length : typeof res.data);
        } catch (proxyErr) {
          console.debug("Bank: proxy fetch failed, falling back to CoinGecko", proxyErr.message || proxyErr);
        }

        if (!res || !res.data || !res.data.length) {
          // fallback to direct CoinGecko
          console.debug("Bank: fetching coins directly from CoinGecko");
          const direct = await axios.get("https://api.coingecko.com/api/v3/coins/list");
          res = direct;
        }

        const list = res.data || [];
        setCoinsList(list);
        // cache in localStorage as a last-resort frontend fallback
        try {
          localStorage.setItem("coinsListCache", JSON.stringify(list));
        } catch (e) {
          console.debug("Bank: failed to write coins cache to localStorage", e.message || e);
        }
      } catch (err) {
        console.error("Bank: failed to fetch coins list", err);
        setCoinsError("Failed to load coins list. Check console or try again later.");
        setCoinsLoadingErrorDetails(err && err.message ? err.message : String(err));
        // try to use localStorage cache if present
        try {
          const cached = localStorage.getItem("coinsListCache");
          if (cached) {
            setCoinsList(JSON.parse(cached));
            setCoinsError("");
          }
        } catch (cacheErr) {
          console.debug("Bank: no local cache available", cacheErr.message || cacheErr);
        }
      } finally {
        setLoadingCoins(false);
      }
    };
    fetchCoins();
  }, []);

  const retryFetchCoins = () => {
    setLoadingCoins(true);
    setCoinsError("");
    setCoinsList([]);
    // re-run the effect by calling the fetch logic again
    (async () => {
      try {
        const res = await API.get("/proxy/coins/list");
        const list = res.data || [];
        setCoinsList(list);
        localStorage.setItem("coinsListCache", JSON.stringify(list));
        setCoinsLoadingErrorDetails(null);
      } catch (err) {
        console.error("Retry fetch coins failed", err);
        setCoinsError("Retry failed");
        setCoinsLoadingErrorDetails(err && err.message ? err.message : String(err));
      } finally {
        setLoadingCoins(false);
      }
    })();
  };

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: 20, border: "1px solid #eee", borderRadius: 10 }}>
      <h2>🏦 Bank: Add Coin to Wallet</h2>
      {message && <p style={{ color: message.startsWith("❌") ? "red" : "green" }}>{message}</p>}
      <form onSubmit={handleAddCoin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <input
          type="text"
          placeholder="Search coin (name or symbol)..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: 10, borderRadius: 5, border: "1px solid #ccc" }}
        />

        {loadingCoins ? (
          <div>Loading coins...</div>
          ) : coinsError ? (
            <div style={{ color: "red" }}>
              <div>{coinsError}</div>
              {coinsLoadingErrorDetails && <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>Details: {coinsLoadingErrorDetails}</div>}
              <div style={{ marginTop: 8 }}>
                <button onClick={retryFetchCoins} style={{ padding: 8, background: "#2563eb", color: "#fff", border: "none", borderRadius: 6 }}>Retry</button>
              </div>
            </div>
        ) : (
          <select value={coin} onChange={e => setCoin(e.target.value)} required size={6} style={{ padding: 10, borderRadius: 5, minHeight: 120 }}>
            <option value="">Select Coin</option>
            {coinsList
              .filter(c => {
                if (!search) return true;
                return (
                  c.name.toLowerCase().includes(search.toLowerCase()) ||
                  (c.symbol || "").toLowerCase().includes(search.toLowerCase())
                );
              })
              .slice(0, 200)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({(c.symbol || "").toUpperCase()})
                </option>
              ))}
          </select>
        )}
        <input type="number" min="0.01" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Amount" required style={{ padding: 10, borderRadius: 5 }} />
        <div style={{ display: "flex", gap: 8 }}>
          <button type="submit" style={{ padding: 10, background: "#4caf50", color: "#fff", border: "none", borderRadius: 5, fontWeight: "bold" }}>Add to batch</button>
          <button
            type="button"
            onClick={submitBatch}
            disabled={submitting || batch.length === 0 || batch.some((b) => !b.amount || isNaN(Number(b.amount)) || Number(b.amount) <= 0)}
            style={{ padding: 10, background: submitting ? "#9ca3af" : (batch.length === 0 ? "#9ca3af" : "#2563eb"), color: "#fff", border: "none", borderRadius: 5, fontWeight: "bold", cursor: submitting || batch.length === 0 ? "not-allowed" : "pointer" }}
          >
            {submitting ? "Submitting..." : "Submit batch"}
          </button>
        </div>
      </form>

      {batch.length === 0 && <p style={{ marginTop: 8, color: "#6b7280" }}>Your batch is empty. Add coins to the batch before submitting.</p>}

      {/* Batch preview */}
      {batch.length > 0 && (
        <div style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16 }}>
          <h3>Batch ({batch.length})</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: 8 }}>Coin</th>
                <th style={{ padding: 8 }}>Amount</th>
                <th style={{ padding: 8 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {batch.map((b) => {
                const coinMeta = coinsList.find((c) => c.id === b.coin) || { name: b.coin, symbol: "" };
                return (
                  <tr key={b.coin} style={{ borderBottom: "1px solid #f3f3f3" }}>
                    <td style={{ padding: 8 }}>{coinMeta.name} {(coinMeta.symbol || "").toUpperCase()}</td>
                    <td style={{ padding: 8 }}>
                      <input
                        type="number"
                        min="0.00000001"
                        step="0.0001"
                        value={b.amount}
                        onChange={(e) => updateBatchAmount(b.coin, e.target.value)}
                        style={{ padding: 6, borderRadius: 6, width: 120 }}
                      />
                    </td>
                    <td style={{ padding: 8 }}>
                      <button onClick={() => removeFromBatch(b.coin)} style={{ background: "#ef4444", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 6 }}>Remove</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Batch submit results */}
      {batchResults && batchResults.length > 0 && (
        <div style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16 }}>
          <h3>Results</h3>
          <ul>
            {batchResults.map((r, idx) => (
              <li key={idx} style={{ marginBottom: 6 }}>
                {r.status === "ok" ? (
                  <span style={{ color: "green" }}>✅ {r.coin} updated — new total: {r.amount}</span>
                ) : (
                  <span style={{ color: "red" }}>❌ {r.coin || "(unknown)"}: {r.message || "Failed"}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

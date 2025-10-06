// src/pages/ForgotPassword.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [resetUrl, setResetUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const res = await API.post("/users/forgot-password", { email });
      const data = res.data || {};
      setMessage(data.message || "If that email exists, a reset link was sent.");
      if (data.resetUrl) setResetUrl(data.resetUrl);
      // After 2s navigate back to login (only if email was sent successfully and no resetUrl is present)
      if (!data.resetUrl) setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "50px auto", padding: 20, border: "1px solid #e6e6e6", borderRadius: 8 }}>
      <h2 style={{ marginBottom: 10 }}>Forgot Password</h2>
      {message && <p style={{ color: message.startsWith("Failed") ? "red" : "green" }}>{message}</p>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          required
          style={{ padding: 10, borderRadius: 6, border: "1px solid #ccc" }}
        />
        <button type="submit" disabled={loading} style={{ padding: 10, borderRadius: 6, background: "#667eea", color: "#fff", border: "none" }}>
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
      {resetUrl && (
        <div style={{ marginTop: 12 }}>
          <p style={{ fontSize: 14 }}>Reset link (development):</p>
          <a href={resetUrl} target="_blank" rel="noreferrer" style={{ color: "#667eea" }}>{resetUrl}</a>
        </div>
      )}
    </div>
  );
}

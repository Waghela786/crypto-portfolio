// src/pages/Login.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";

export default function Login({ onLogin }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email || !password) {
      setMessage("❌ Please fill all fields");
      return;
    }

    try {
      const res = await API.post("/users/login", { email, password });

      // Save token and email
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userEmail", res.data.email);

      if (onLogin) onLogin(res.data);

      setMessage("✅ Login successful!");

      // Redirect to transactions/dashboard
      navigate("/transactions");
    } catch (err) {
      const errorMsg = err.response?.data?.message || "❌ Login failed";
      setMessage(errorMsg);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "50px auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "10px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        textAlign: "center",
      }}
    >
      <h2>🔐 Login</h2>
      {message && (
        <p style={{ color: message.startsWith("❌") ? "red" : "green" }}>
          {message}
        </p>
      )}
      <form
        onSubmit={handleLogin}
        style={{ display: "flex", flexDirection: "column", gap: "15px" }}
      >
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{ padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
        />
        <button
          type="submit"
          style={{
            padding: "10px",
            backgroundColor: "#4caf50",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Login
        </button>
      </form>
      <div style={{ marginTop: 10 }}>
        <Link
          to="/forgot-password"
          style={{ color: "#667eea", textDecoration: "none" }}
        >
          Forgot password?
        </Link>
      </div>
    </div>
  );
}

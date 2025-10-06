// src/pages/ResetPassword.js
import React, { useState } from "react";
import { useParams } from "react-router-dom";
import API from "../services/api";

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post(`/users/reset-password/${token}`, { password });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to reset password");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto" }}>
      <h2>Reset Password</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input value={password} onChange={e => setPassword(e.target.value)} placeholder="New Password" type="password" required />
        <button type="submit">Reset Password</button>
      </form>
    </div>
  );
}

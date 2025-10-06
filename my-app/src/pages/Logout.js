import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();
  const [count, setCount] = useState(2);

  useEffect(() => {
    // Clear client auth
    localStorage.removeItem("token");
    // Simple countdown then redirect to login
    const t = setInterval(() => setCount((c) => c - 1), 1000);
    const timeout = setTimeout(() => {
      clearInterval(t);
      navigate("/login");
    }, 2000);
    return () => {
      clearTimeout(timeout);
      clearInterval(t);
    };
  }, [navigate]);

  return (
    <div style={{ maxWidth: 420, margin: "60px auto", padding: 20, textAlign: "center" }}>
      <h2>🔓 Logged out</h2>
      <p style={{ color: "#333" }}>You have been signed out. Redirecting to login in {count}...</p>
      <button
        onClick={() => navigate("/login")}
        style={{ padding: "10px 18px", borderRadius: 6, background: "#667eea", color: "#fff", border: "none", cursor: "pointer" }}
      >
        Go to Login now
      </button>
    </div>
  );
}

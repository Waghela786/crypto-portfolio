import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();
  const [count, setCount] = useState(3); // Countdown from 3

  useEffect(() => {
    // Clear all auth data
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");

    // Countdown logic
    const intervalId = setInterval(() => {
      setCount((c) => {
        if (c <= 1) {
          clearInterval(intervalId);
          navigate("/login"); // Redirect after countdown
        }
        return c - 1;
      });
    }, 1000);

    return () => clearInterval(intervalId);
  }, [navigate]);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "30px 40px",
          borderRadius: 12,
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          maxWidth: 400,
          width: "90%",
        }}
      >
        <h2>🔓 Logged out</h2>
        <p style={{ color: "#333", margin: "15px 0" }}>
          You have been signed out. Redirecting to login in {count}...
        </p>
        <button
          onClick={() => navigate("/login")}
          style={{
            padding: "10px 18px",
            borderRadius: 6,
            background: "#667eea",
            color: "#fff",
            border: "none",
            cursor: "pointer",
          }}
        >
          Go to Login now
        </button>
      </div>
    </div>
  );
}

import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 30px",
        background: "linear-gradient(90deg, #667eea, #764ba2)",
        color: "#fff",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        position: "sticky",
        top: 0,
        zIndex: 1000,
      }}
    >
      {/* Logo Section */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
        }}
        onClick={() => navigate("/dashboard")}
      >
        <img
          src="/logo192.png"
          alt="CryptoLogo"
          style={{ width: "40px", height: "40px", marginRight: "10px" }}
        />
        <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "bold" }}>
          CryptoPort
        </h2>
      </div>

      {/* Navigation Links */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          fontSize: "16px",
        }}
      >
        <Link
          to="/dashboard"
          style={{ color: "#fff", textDecoration: "none", transition: "0.2s" }}
        >
          Dashboard
        </Link>
        <Link
          to="/wallets"
          style={{ color: "#fff", textDecoration: "none", transition: "0.2s" }}
        >
          Wallet
        </Link>
        {/* ✅ New Transactions Menu */}
        <Link
          to="/transactions"
          style={{ color: "#fff", textDecoration: "none", transition: "0.2s" }}
        >
          Transactions
        </Link>
        <Link
          to="/register"
          style={{ color: "#fff", textDecoration: "none", transition: "0.2s" }}
        >
          Register
        </Link>
        <Link
          to="/login"
          style={{ color: "#fff", textDecoration: "none", transition: "0.2s" }}
        >
          Login
        </Link>

        <button
          onClick={handleLogout}
          style={{
            padding: "5px 12px",
            backgroundColor: "#ff4d4d",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            color: "#fff",
            fontWeight: "bold",
          }}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}

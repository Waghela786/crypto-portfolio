import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import API from "../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const res = await API.get("/users/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        localStorage.setItem("user", JSON.stringify(res.data)); // store for NotificationBell
      } catch (err) {
        console.error("Failed to fetch user:", err);
      }
    };
    fetchUser();
  }, [token]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
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
        style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
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

      {/* Navigation Links + Notification */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "20px",
          fontSize: "16px",
        }}
      >
        <Link to="/dashboard" style={{ color: "#fff", textDecoration: "none" }}>
          Dashboard
        </Link>
        <Link to="/wallets" style={{ color: "#fff", textDecoration: "none" }}>
          Wallet
        </Link>
        <Link to="/transactions" style={{ color: "#fff", textDecoration: "none" }}>
          Transactions
        </Link>
        <Link to="/bank" style={{ color: "#fff", textDecoration: "none" }}>
          Bank
        </Link>
        <Link to="/register" style={{ color: "#fff", textDecoration: "none" }}>
          Register
        </Link>
        <Link to="/login" style={{ color: "#fff", textDecoration: "none" }}>
          Login
        </Link>

  {/* ✅ Notification Bell */}
  {console.debug && console.debug("Navbar: render state", { user: !!user, token: !!token })}
  {user && token && <NotificationBell token={token} userId={user._id} />}

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

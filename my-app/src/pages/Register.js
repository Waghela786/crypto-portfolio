import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api"; // axios instance with baseURL

export default function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await API.post("/users/register", { name, email, password });
      console.log("Register response:", res.data);

      if (res.data) {
        // Show success message and then automatically redirect to login after a short delay
        setMessage("✅ Registered successfully! Redirecting to login...");
        setName("");
        setEmail("");
        setPassword("");
        setRegistered(true);
        setTimeout(() => navigate("/login"), 1200);
      } else {
        setMessage("❌ Unexpected response from server");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setMessage(err.response?.data?.message || "❌ Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #667eea, #764ba2)",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.2)",
          maxWidth: "400px",
          width: "100%",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: "30px", color: "#333" }}>
          📝 Register
        </h2>

        {message && (
          <p
            style={{
              color: message.startsWith("❌") ? "red" : "green",
              textAlign: "center",
              marginBottom: "15px",
            }}
          >
            {message}
          </p>
        )}

        {!registered ? (
          <>
            <form
              onSubmit={handleRegister}
              style={{ display: "flex", flexDirection: "column", gap: "15px" }}
            >
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" }}
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" }}
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ padding: "12px", borderRadius: "8px", border: "1px solid #ccc", fontSize: "16px" }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: "12px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#667eea",
                  color: "#fff",
                  fontSize: "16px",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "0.3s",
                }}
              >
                {loading ? "Registering..." : "Register"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "20px", color: "#555" }}>
              Already have an account?{" "}
              <span
                style={{ color: "#667eea", cursor: "pointer" }}
                onClick={() => navigate("/login")}
              >
                Login
              </span>
            </p>
          </>
        ) : (
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <p style={{ marginBottom: 12 }}>{message}</p>
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                border: "none",
                background: "#34d399",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              Go to login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

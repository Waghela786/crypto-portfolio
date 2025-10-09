// src/services/api.js
import axios from "axios";

// Prefer an environment-configured base URL so Render (or other hosts) can
// point the frontend to the correct backend without changing code.
// Set REACT_APP_API_BASE in your Render service (or local .env) to override.
const defaultBase = process.env.REACT_APP_API_BASE || "https://crypto-portfolio-backend-pepi.onrender.com/api";

const API = axios.create({
  baseURL: defaultBase,
});

// Optional: attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default API;

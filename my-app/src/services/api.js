import axios from "axios";

// Use REACT_APP_API_URL when set (useful for ngrok/public URLs), otherwise default to backend on same host:
// If frontend is opened from mobile at http://<your-pc-ip>:3001, this will point to http://<your-pc-ip>:5000/api
const DEFAULT_BACKEND_PORT = 5000;
const makeFallbackBase = () => {
  if (typeof window === "undefined") return `http://localhost:${DEFAULT_BACKEND_PORT}/api`;
  const { protocol, hostname } = window.location;
  // prefer the real hostname (PC IP when opened from phone). Keep localhost when developing on same machine
  const host = (hostname === "localhost" || hostname === "127.0.0.1") ? "localhost" : hostname;
  return `${protocol}//${host}:${DEFAULT_BACKEND_PORT}/api`;
};

// If REACT_APP_API_URL is set it takes precedence, otherwise use runtime fallback
const BASE_URL = (process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL.trim()) || makeFallbackBase();

// Debug: log chosen base URL so you can check mobile console (open remote debugging)
console.log("API baseURL:", BASE_URL);

const API = axios.create({
  baseURL: BASE_URL,
  // ensure long network requests from mobile have reasonable timeout if needed:
  timeout: 15000,
});

export default API;
export const fetchCoinsList = async () => {
  try {
    const res = await axios.get("https://api.coingecko.com/api/v3/coins/list");
    return res.data; // array of { id, symbol, name }
  } catch (err) {
    console.error("Error fetching coins list:", err);
    return [];
  }
};

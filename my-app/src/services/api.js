import axios from "axios";

// Create API instance for your backend
// Prefer a build-time env var (REACT_APP_API_BASE). If it's not provided,
// fall back to a runtime-friendly origin-based URL so deployed builds don't
// accidentally call localhost. When backend is on a different origin, set
// REACT_APP_API_BASE in your Render/hosting environment and rebuild.
const defaultBase =
  process.env.REACT_APP_API_BASE ||
  (typeof window !== "undefined"
    ? `${window.location.origin.replace(/\/$/, '')}/api`
    : "/api");

const API = axios.create({
  baseURL: defaultBase,
  headers: {
    "Content-Type": "application/json",
  },
});
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export const fetchCoinsList = async () => {
  try {
    const response = await API.get("/proxy/coins/list");
    return response.data;
  } catch (error) {
    console.error("Error fetching coins:", error);
    throw error;
  }
};

export default API;

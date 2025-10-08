import axios from "axios";

// Create API instance for your backend
const API = axios.create({
  baseURL: "http://localhost:5000/api",
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

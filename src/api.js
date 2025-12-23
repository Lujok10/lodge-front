import axios from "axios";

// Next.js public env var (available in the browser)
const API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  // guard for Next.js SSR
  if (typeof window !== "undefined") {
    const role = localStorage.getItem("role");
    const username = localStorage.getItem("username");
    const hotelCode = localStorage.getItem("hotelCode");

    if (role) config.headers["X-User-Role"] = role;
    if (username) config.headers["X-Username"] = username;
    if (hotelCode) config.headers["X-Hotel-Code"] = hotelCode;
  }

  return config;
});

export default api;

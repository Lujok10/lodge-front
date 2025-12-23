import axios from "axios";

const API_URL =
  import.meta.env.VITE_API_URL ?? "https://nsaasystems1-app-waofx.ondigitalocean.app/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
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

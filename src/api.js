import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:9002/api";

const api = axios.create({
  baseURL,
  withCredentials: false,
});

api.interceptors.request.use((config) => {
  const role = localStorage.getItem("role");
  const username = localStorage.getItem("username");
  const hotelCode = localStorage.getItem("hotelCode");

  if (role) config.headers["X-User-Role"] = role;
  if (username) config.headers["X-Username"] = username;
  if (hotelCode) config.headers["X-Hotel-Code"] = hotelCode;

  return config;
});

export default api;

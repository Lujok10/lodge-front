
import axios from "axios";

let host = process.env.PUBLIC_API_URL || "http://localhost:8080";
host = String(host).replace(/\/$/, "");

// ✅ If someone accidentally sets PUBLIC_API_URL with "/api", strip it.
host = host.replace(/\/api$/i, "");

const api = axios.create({
  baseURL: `${host}/api`,
  withCredentials: false,
});

console.log("[API baseURL]", api.defaults.baseURL);



api.interceptors.request.use((config) => {
  const role = (localStorage.getItem("role") || "").trim();
  const username = (localStorage.getItem("username") || "").trim();
  const hotelCode = (localStorage.getItem("hotelCode") || "").trim();

  // Merge headers safely (avoids overwriting Axios internal header object)
  config.headers = {
    ...(config.headers || {}),
    ...(role ? { "X-User-Role": role } : {}),
    ...(username ? { "X-Username": username } : {}),
    ...(hotelCode ? { "X-Hotel-Code": hotelCode } : {}),
  };

  console.log("[API request]", config.method?.toUpperCase(), config.baseURL + config.url);
  console.log("[API headers]", config.headers);
  console.log("[API body]", config.data);

  return config;
});

api.interceptors.response.use(
  (res) => {
    console.log("[API response]", res.status, res.config?.url);
    return res;
  },
  (err) => {
    console.log("[API error]", err?.response?.status, err?.config?.url, err?.config?.baseURL);
    console.log("[API error body]", err?.response?.data); // ✅ this will tell us EXACTLY why it’s 400
    return Promise.reject(err);
  }
);


export default api;

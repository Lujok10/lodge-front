// import axios from "axios";

// const API_URL = process.env.PUBLIC_API_URL || "http://localhost:8080/api";

// const api = axios.create({
//   baseURL: API_URL,
//   withCredentials: false,
// });

// // ✅ Force headers on every request (not only interceptor)
// api.interceptors.request.use((config) => {
//   const role = (localStorage.getItem("role") || "").trim();
//   const username = (localStorage.getItem("username") || "").trim();
//   const hotelCode = (localStorage.getItem("hotelCode") || "").trim();

//   config.headers = config.headers || {};

//   // Always set (even if empty you’ll spot it immediately in Network tab)
//   config.headers["X-User-Role"] = role;
//   config.headers["X-Username"] = username;
//   config.headers["X-Hotel-Code"] = hotelCode;

//   return config;
// });

// export default api;
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
  console.log("[API request]", config.method?.toUpperCase(), config.url);
  const role = (localStorage.getItem("role") || "").trim();
  const username = (localStorage.getItem("username") || "").trim();
  const hotelCode = (localStorage.getItem("hotelCode") || "").trim();

  config.headers = config.headers || {};
  if (role) config.headers["X-User-Role"] = role;
  if (username) config.headers["X-Username"] = username;
  if (hotelCode) config.headers["X-Hotel-Code"] = hotelCode;

  return config;
});
api.interceptors.response.use(
  (res) => {
    console.log("[API response]", res.status, res.config?.url);
    return res;
  },
  (err) => {
    console.log("[API error]", err?.response?.status, err?.config?.url, err?.config?.baseURL);
    return Promise.reject(err);
  }
);


export default api;

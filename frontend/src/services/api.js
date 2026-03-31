import axios from "axios";

const api = axios.create({
  baseURL: "/",         // ✅ requests go via Vite proxy, not directly to Render
  withCredentials: true,
});

export default api;
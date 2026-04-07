import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  const path = config.url || "";
  const isAuthEntryRequest = path.includes("/api/auth/login") || path.includes("/api/auth/register");
  if (token && !isAuthEntryRequest) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const path = error?.config?.url || "";
    if (status === 401 && !path.includes("/api/auth/login") && !path.includes("/api/auth/register")) {
      localStorage.removeItem("auth_token");
    }
    return Promise.reject(error);
  }
);

export default api;
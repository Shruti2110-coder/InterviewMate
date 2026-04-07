import axios from "axios";
import api from "../../../services/api";
// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_URL,

// });




// REGISTER

export async function register({ username, email, password }) {
  const response = await api.post("/api/auth/register", {
    username, email, password,
  });
  return response.data;
}

// LOGIN
export async function login({ email, password }) {
  try {
    const response = await api.post("/api/auth/login", { email, password });
    return response.data;
  } catch (error) {
    console.log("LOGIN ERROR:", error.response?.data);
    throw error;
  }
}

export async function logout() {
  const response = await api.get("/api/auth/logout");
  return response.data;
}

export async function getMe() {
  try {
    const response = await api.get("/api/auth/get-me");
    return response.data;
  } catch (error) {
    // 401 is expected when not logged in, don't log it
    if (error.response?.status !== 401) {
      console.error("GET_ME ERROR:", error.response?.data);
    }
    throw error;
  }
}

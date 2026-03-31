import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

// REGISTER
export async function register({ username, email, password }) {
  const response = await api.post("/api/auth/register", {
    username,
    email,
    password,
  });

  return response.data;
}

// LOGIN
export async function login({ email, password }) {
  const response = await api.post("/api/auth/login", {
    email,
    password,
  });

  return response.data;
}

// LOGOUT
export async function logout() {
  const response = await api.get("/api/auth/logout");
  return response.data;
}

// GET ME (IMPORTANT FIX)


export const getMe = async () => {
  const token = localStorage.getItem("token");

  const res = await api.get("/api/auth/get-me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return res.data;
};
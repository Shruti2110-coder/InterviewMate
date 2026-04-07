import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout } from "../services/auth.api";

export const useAuth = () => {
  const { user, setUser, loading, setLoading } = useContext(AuthContext);

  const handleLogin = async ({ email, password }) => {
    setLoading(true);
    try {
      const data = await login({ email, password });
      if (data?.token) {
        localStorage.setItem("auth_token", data.token);
      }
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async ({ username, email, password }) => {
    setLoading(true);
    try {
      const data = await register({ username, email, password });
      if (data?.token) {
        localStorage.setItem("auth_token", data.token);
      }
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setUser(null);
      localStorage.removeItem("auth_token");
    } finally {
      setLoading(false);
    }
  };

  // ✅ NO useEffect here — auth.context.jsx already handles getMe on mount

  return { user, loading, handleRegister, handleLogin, handleLogout };
};
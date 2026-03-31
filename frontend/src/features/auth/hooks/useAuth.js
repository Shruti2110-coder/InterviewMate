import { useContext } from "react";
import { AuthContext } from "../auth.context";
import { login,register,logout,getMe } from "../services/auth.api";
import { useEffect } from "react";

export const useAuth = () => {
  const context = useContext(AuthContext);
  const { user, setUser, loading, setLoading } = context;

 const handleLogin = async ({ email, password }) => {
  setLoading(true);
  try {
    const data = await login({ email, password });

    localStorage.setItem("token", data.token); // 👈 ADD HERE
    setUser(data.user);

  } catch (err) {
    console.log(err);
  } finally {
    setLoading(false);
  }
};

 const handleRegister = async ({ username, email, password }) => {
  setLoading(true);
  try {
    const data = await register({ email, username, password });

    localStorage.setItem("token", data.token); // 👈 ADD HERE
    setUser(data.user);

  } catch (err) {
    console.log(err);
  } finally {
    setLoading(false);
  }
};

 const handleLogout = async () => {
  setLoading(true);
  try {
    await logout();

    localStorage.removeItem("token"); // 👈 ADD HERE
    setUser(null);

  } catch (err) {
    console.log(err);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  const token = localStorage.getItem("token");

  if (!token) {
    setUser(null);
    setLoading(false);
    return;
  }

  const getAndSetUser = async () => {
    setLoading(true);

    try {
      const data = await getMe();

      setUser(data.user || null);
    } catch (err) {
      console.log(err);
      setUser(null);
      localStorage.removeItem("token");
    } finally {
      setLoading(false);
    }
  };

  getAndSetUser();
}, []);

  return {
    user,
    loading,
    handleRegister,
    handleLogin,
    handleLogout,
  };
};
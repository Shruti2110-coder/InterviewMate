import { createContext, useState, useEffect } from "react";
import { getMe } from "./services/auth.api";

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchUser = async () => {
    try {
      const res = await getMe();
      setUser(res.user);
    } catch {
      // 401 is expected when not logged in
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  fetchUser();
}, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
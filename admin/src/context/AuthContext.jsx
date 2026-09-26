import { useEffect, useState } from "react";
import { AuthContext } from "./auth-context";
import api from "../api";

export const AuthProvider = ({ children, url }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem("token")));
  useEffect(() => {
    if (!localStorage.getItem("token")) return;
    api.get(url + "/api/user/me")
      .then(({ data }) => {
        if (data.success && data.user?.role === "admin") setUser(data.user);
        else localStorage.removeItem("token");
      })
      .catch(() => localStorage.removeItem("token"))
      .finally(() => setLoading(false));
  }, [url]);
  const login = async (email, password) => {
    const { data } = await api.post(url + "/api/user/login", { email, password });
    if (!data.success) throw new Error(data.message || "Unable to log in");
    if (data.user?.role !== "admin") throw new Error("This account does not have admin access");
    localStorage.setItem("token", data.token);
    setUser(data.user);
  };
  const logout = () => { localStorage.removeItem("token"); setUser(null); };
  return <AuthContext.Provider value={{ user, loading, login, logout }}>{children}</AuthContext.Provider>;
};

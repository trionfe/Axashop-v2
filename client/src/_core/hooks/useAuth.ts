import { useCallback, useState, useEffect } from "react";

type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: string;
};

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler une vérification locale (par exemple via localStorage mis par la page Admin)
    const isAdmin = localStorage.getItem("admin_auth") === "true";
    if (isAdmin) {
      setUser({
        id: 0,
        openId: "admin-session",
        name: "Administrator",
        email: "admin@axa-shop.local",
        role: "admin"
      });
    } else {
      setUser(null);
    }
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem("admin_auth");
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error: null,
    isAuthenticated: Boolean(user),
    refresh: async () => {
      const isAdmin = localStorage.getItem("admin_auth") === "true";
      if (isAdmin) {
        setUser({
          id: 0,
          openId: "admin-session",
          name: "Administrator",
          email: "admin@axa-shop.local",
          role: "admin"
        });
      } else {
        setUser(null);
      }
    },
    logout,
  };
}

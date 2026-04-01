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

/**
 * SÉCURISÉ — useAuth v2
 *
 * ❌ AVANT : lisait localStorage.getItem("admin_auth")
 *            → n'importe qui dans la console pouvait devenir admin
 *
 * ✅ MAINTENANT : appelle /api/trpc/getMe (JWT cookie HttpOnly côté serveur)
 *                 → impossible à forger depuis la console
 */
export function useAuth(options?: UseAuthOptions) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await fetch("/api/trpc/getMe?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D", {
        credentials: "include", // envoie le cookie HttpOnly
      });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const json = await res.json();
      // tRPC batch response format: [{ result: { data: { json: user } } }]
      const userData = json?.[0]?.result?.data?.json ?? null;
      setUser(userData);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  useEffect(() => {
    if (!loading && !user && options?.redirectOnUnauthenticated) {
      window.location.href = options.redirectPath ?? "/";
    }
  }, [loading, user, options]);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/trpc/logout?batch=1", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "0": { json: null } }),
      });
    } finally {
      setUser(null);
    }
  }, []);

  return {
    user,
    loading,
    error: null,
    isAuthenticated: Boolean(user),
    refresh: fetchMe,
    logout,
  };
}

import { trpc } from "@/lib/trpc";

type User = {
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: string;
};

export function useAuth() {
  const { data: user, isLoading, refetch } = trpc.getMe.useQuery();

  const logoutMutation = trpc.logout.useMutation({
    onSuccess: () => {
      window.location.href = "/admin";
    },
  });

  return {
    user: (user as User | null | undefined) ?? null,
    loading: isLoading,
    error: null,
    isAuthenticated: Boolean(user),
    refresh: async () => { await refetch(); },
    logout: () => logoutMutation.mutate(),
  };
}

import { authClient, signOut, useSession } from "@/lib/auth-client";
import { useCallback, useEffect, useMemo } from "react";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath } = options ?? {};
  const { data: sessionData, isPending, error, refetch } = useSession();

  const user = sessionData?.user ?? null;

  const logout = useCallback(async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
  }, []);

  const state = useMemo(() => {
    return {
      user: user
        ? {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: user.image ?? null,
            role: (user as any).role ?? "user",
          }
        : null,
      loading: isPending,
      error,
      isAuthenticated: Boolean(user),
    };
  }, [user, isPending, error]);

  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (isPending) return;
    if (user) return;
    if (typeof window === "undefined") return;
    if (redirectPath && window.location.pathname === redirectPath) return;

    if (redirectPath) {
      window.location.href = redirectPath;
    }
  }, [redirectOnUnauthenticated, redirectPath, isPending, user]);

  return {
    ...state,
    refresh: () => refetch(),
    logout,
  };
}

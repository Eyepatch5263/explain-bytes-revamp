import { useAuth0, type LogoutOptions, type RedirectLoginOptions } from "@auth0/auth0-react";
import { useCallback, useEffect, useMemo } from "react";

export type AuthUser = {
  id?: string;
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
  avatarUrl?: string | null;
  emailVerified?: boolean;
  role?: string;
  [key: string]: any;
};

export function useAuth() {
  const {
    user: auth0User,
    isAuthenticated,
    isLoading,
    error,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
    getIdTokenClaims,
  } = useAuth0();

  const user: AuthUser | null = useMemo(() => {
    if (!auth0User) return null;
    return {
      ...auth0User,
      id: auth0User.sub,
      avatarUrl: auth0User.picture ?? null,
      emailVerified: auth0User.email_verified ?? false,
      role: (auth0User as any)["https://explainbytes.tech/role"] ?? "user",
    };
  }, [auth0User]);

  // Synchronize only a cryptographically verifiable Auth0 identity with the API.
  useEffect(() => {
    if (isAuthenticated && auth0User?.email) {
      const syncCredentials = async () => {
        try {
          const claims = await getIdTokenClaims();
          if (!claims?.__raw) return;
          await fetch("/api/auth/sync-user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${claims.__raw}`,
            },
            body: JSON.stringify({}),
          });
        } catch (syncError) {
          console.warn("[Auth0] DB credential sync warning:", syncError);
        }
      };
      syncCredentials();
    }
  }, [getIdTokenClaims, isAuthenticated, auth0User]);

  const login = useCallback(
    (options?: RedirectLoginOptions) => {
      return loginWithRedirect(options);
    },
    [loginWithRedirect]
  );

  const signup = useCallback(
    (options?: RedirectLoginOptions) => {
      return loginWithRedirect({
        ...options,
        authorizationParams: {
          screen_hint: "signup",
          ...options?.authorizationParams,
        },
      });
    },
    [loginWithRedirect]
  );

  const logout = useCallback(
    (options?: LogoutOptions | React.SyntheticEvent) => {
      // Discriminate between LogoutOptions and React SyntheticEvent when used in onClick={logout}
      const isEvent =
        options &&
        typeof options === "object" &&
        ("nativeEvent" in options || "preventDefault" in options);

      const resolvedOptions: LogoutOptions =
        isEvent || !options
          ? { logoutParams: { returnTo: window.location.origin } }
          : {
              logoutParams: { returnTo: window.location.origin },
              ...options,
            };

      return auth0Logout(resolvedOptions);
    },
    [auth0Logout]
  );

  return {
    user,
    isAuthenticated,
    loading: isLoading,
    isLoading,
    error: (error ?? null) as Error | null,
    login,
    signup,
    logout,
    loginWithRedirect,
    getAccessTokenSilently,
    getIdTokenClaims,
  };
}

export default useAuth;

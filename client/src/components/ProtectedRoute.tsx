import React, { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  component?: React.ComponentType<any>;
  children?: React.ReactNode;
}

export function ProtectedRoute({ component: Component, children }: ProtectedRouteProps) {
  const { isAuthenticated, loading, login } = useAuth();
  const [location] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      login({
        appState: { returnTo: location },
      });
    }
  }, [loading, isAuthenticated, location, login]);

  if (loading) {
    return <LoadingSkeleton label="Verifying authorization..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (Component) {
    return <Component />;
  }

  return <>{children}</>;
}

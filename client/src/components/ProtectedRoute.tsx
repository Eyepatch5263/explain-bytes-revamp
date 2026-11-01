import React, { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { useLocation } from "wouter";

interface ProtectedRouteProps {
  component?: React.ComponentType<any>;
  children?: React.ReactNode;
}

export function ProtectedRoute({ component: Component, children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      const returnUrl = encodeURIComponent(location);
      setLocation(`/login?returnUrl=${returnUrl}`);
    }
  }, [loading, isAuthenticated, location, setLocation]);

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

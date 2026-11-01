import { AuthCard } from "@/components/AuthCard";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function Login() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  const getTargetUrl = () => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get("returnUrl");
      if (returnUrl && returnUrl.startsWith("/")) {
        return returnUrl;
      }
    }
    return "/docs";
  };

  useEffect(() => {
    if (user && !loading) {
      setLocation(getTargetUrl());
    }
  }, [user, loading, setLocation]);

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 relative">
      <div className="absolute top-6 left-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to ExplainBytes
        </Link>
      </div>

      <div className="w-full max-w-md">
        <AuthCard onSuccess={() => setLocation(getTargetUrl())} />
      </div>
    </div>
  );
}

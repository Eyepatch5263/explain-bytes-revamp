import { useState } from "react";
import type { FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Github, Loader2 } from "lucide-react";

interface AuthCardProps {
  onSuccess?: () => void;
  className?: string;
  initialMode?: "signin" | "signup";
}

export function AuthCard({ onSuccess, className, initialMode = "signin" }: AuthCardProps) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSocialLogin = async (provider: "github" | "google") => {
    setError(null);
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: window.location.href,
      });
    } catch (err: any) {
      setError(err?.message || `Failed to sign in with ${provider}`);
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error: signInErr } = await authClient.signIn.email({
          email,
          password,
        });
        if (signInErr) {
          setError(signInErr.message || "Invalid email or password");
          setLoading(false);
          return;
        }
      } else {
        const { error: signUpErr } = await authClient.signUp.email({
          email,
          password,
          name: name || email.split("@")[0],
        });
        if (signUpErr) {
          setError(signUpErr.message || "Failed to create account");
          setLoading(false);
          return;
        }
      }

      onSuccess?.();
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={`auth-card-shell ${className ?? ""}`}>
      <CardHeader className="auth-card-header">
        <span className="auth-card-eyebrow">EXPLAIN BYTES / ACCOUNT</span>
        <CardTitle className="auth-card-title">
          {mode === "signin" ? "Welcome back." : "Make it yours."}
        </CardTitle>
        <CardDescription className="auth-card-description">
          {mode === "signin"
            ? "Sign in to pick up where your next good idea starts."
            : "Create an account to keep your reading and practice in one place."}
        </CardDescription>
      </CardHeader>

      <CardContent className="auth-card-content">
        {error && <div className="auth-error" role="alert">{error}</div>}

        <div className="auth-provider-grid">
          <Button
            type="button"
            variant="outline"
            className="auth-provider-button"
            disabled={loading}
            onClick={() => handleSocialLogin("github")}
          >
            <Github className="w-4 h-4" />
            GitHub
          </Button>
          <Button
            type="button"
            variant="outline"
            className="auth-provider-button"
            disabled={loading}
            onClick={() => handleSocialLogin("google")}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Google
          </Button>
        </div>

        <div className="auth-divider">
          <span />
          <p>OR CONTINUE WITH EMAIL</p>
        </div>

        <form onSubmit={handleEmailAuth} className="auth-email-form">
          {mode === "signup" && (
            <div className="auth-field">
              <Label htmlFor="auth-name" className="auth-label">Name</Label>
              <Input
                id="auth-name"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={mode === "signup"}
                disabled={loading}
                className="auth-input"
              />
            </div>
          )}
          <div className="auth-field">
            <Label htmlFor="auth-email" className="auth-label">Email</Label>
            <Input
              id="auth-email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              className="auth-input"
            />
          </div>
          <div className="auth-field">
            <Label htmlFor="auth-password" className="auth-label">Password</Label>
            <Input
              id="auth-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
              className="auth-input"
            />
          </div>

          <Button type="submit" className="auth-submit-button" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <p className="auth-card-note">Secure sign-in, powered by Better Auth.</p>
      </CardContent>

      <CardFooter className="auth-card-footer">
        <p className="auth-switch-copy">
          {mode === "signin" ? "New to Explain Bytes? " : "Already have an account? "}
          <button
            type="button"
            className="auth-mode-link"
            onClick={() => {
              setError(null);
              setMode(mode === "signin" ? "signup" : "signin");
            }}
          >
            {mode === "signin" ? "Create an account" : "Sign in"}
          </button>
        </p>
      </CardFooter>
    </Card>
  );
}

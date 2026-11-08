import { useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { ArrowLeft, LogIn } from "lucide-react";
import "./auth.css";

export default function Login() {
  const { user, loading, login, signup } = useAuth();
  const [location, setLocation] = useLocation();
  const isSignup = location.startsWith("/signup");

  useEffect(() => {
    if (user && !loading) {
      setLocation("/docs");
    }
  }, [user, loading, setLocation]);

  return (
    <div className="auth-page dark-theme-page min-h-screen flex flex-col justify-between">
      <header className="auth-topbar">
        <div className="auth-shell auth-topbar-inner">
          <a className="auth-brand" href="/" aria-label="Explain Bytes home">
            <img src="/explainbytes-mark.webp" alt="" />
            <span>Explain Bytes</span>
          </a>
          <nav className="auth-nav">
            <a href="/" className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider">
              <ArrowLeft size={14} /> Back to library
            </a>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-[#13221e]/15 bg-[#fbfaf6] dark:bg-[#1a2520] dark:border-[#f4efe7]/15 p-8 text-center shadow-lg">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#e66b5b]">
            Secure Access
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#13221e] dark:text-[#f4efe7]">
            {isSignup ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-3 text-xs leading-relaxed text-[#13221e]/70 dark:text-[#f4efe7]/70">
            Sign in through our secure Auth0 gateway to access interactive Flash Docs, system simulations, and personalized reading progress.
          </p>

          <div className="mt-8 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => (isSignup ? signup() : login())}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-[#13221e] dark:bg-[#f4efe7] px-5 font-mono text-xs font-semibold uppercase tracking-wider text-[#f3f0e8] dark:text-[#0f1513] transition-transform hover:-translate-y-0.5 active:scale-[0.98]"
            >
              <LogIn size={15} />
              <span>{isSignup ? "Sign up with Auth0" : "Continue with Auth0"}</span>
            </button>

            <button
              type="button"
              onClick={() => (isSignup ? login() : signup())}
              className="font-mono text-[11px] text-[#13221e]/60 dark:text-[#f4efe7]/60 hover:underline pt-2"
            >
              {isSignup ? "Already have an account? Sign in" : "Need an account? Sign up"}
            </button>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center font-mono text-[10px] text-[#13221e]/40 dark:text-[#f4efe7]/40 uppercase tracking-widest">
        Explain Bytes / Identity by Auth0
      </footer>
    </div>
  );
}


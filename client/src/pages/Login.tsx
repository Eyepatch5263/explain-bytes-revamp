import { useAuth } from "@/_core/hooks/useAuth";
import { AuthCard } from "@/components/AuthCard";
import { useTheme } from "@/contexts/ThemeContext";
import { ArrowLeft, ArrowRight, BookOpen, Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import "./auth.css";

export default function Login() {
  const { user, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();
  const isSignupRoute = location.startsWith("/signup");

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
    <div className="auth-page dark-theme-page">
      <header className="auth-topbar">
        <div className="auth-shell auth-topbar-inner">
          <Link className="auth-brand" href="/" aria-label="Explain Bytes home">
            <img src="/explainbytes-mark.webp" alt="" />
            <span>Explain Bytes</span>
          </Link>
          <nav className="auth-nav" aria-label="Account navigation">
            <Link href="/terms">Terms index</Link>
            <Link href="/">Field guide</Link>
          </nav>
          <div className="auth-topbar-actions">
            <button
              type="button"
              className="auth-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="auth-shell auth-main">
        <section className="auth-story" aria-labelledby="auth-story-title">
          <p className="auth-eyebrow"><span /> PERSONAL WORKSPACE <b>/</b> {isSignupRoute ? "CREATE ACCOUNT" : "SIGN IN"}</p>
          <h1 id="auth-story-title">Every good idea<br />has <em>a next step.</em></h1>

          <p className="auth-story-description">A quiet place to keep your reading, practice, and progress moving with you—one clear concept at a time.</p>

          <div className="auth-field-note">
            <div className="auth-field-note-header"><span>FIELD NOTE / 01</span><span>EXPLAIN BYTES <i /></span></div>
            <div className="auth-note-illustration" aria-hidden="true">
              <div className="auth-note-ring auth-note-ring-outer" />
              <div className="auth-note-ring auth-note-ring-inner" />
              <div className="auth-note-connection auth-note-connection-one" />
              <div className="auth-note-connection auth-note-connection-two" />
              <span className="auth-note-node auth-note-node-one">READ</span>
              <span className="auth-note-node auth-note-node-two">TRACE</span>
              <span className="auth-note-node auth-note-node-three">GROW</span>
              <div className="auth-note-core"><BookOpen size={22} /><span>YOUR<br />NEXT IDEA</span></div>
            </div>
            <div className="auth-field-note-footer"><span>STAY CURIOUS</span><span>01 — 03</span></div>
          </div>

        </section>

        <section className="auth-access" aria-label={isSignupRoute ? "Create an Explain Bytes account" : "Sign in to Explain Bytes"}>
          <div className="auth-access-overline"><span>{isSignupRoute ? "02 / CREATE YOUR ACCOUNT" : "02 / ACCOUNT ACCESS"}</span><span>SECURE SESSION</span></div>
          <div className="auth-panel">
            <AuthCard
              key={location}
              initialMode={isSignupRoute ? "signup" : "signin"}
              onSuccess={() => setLocation(getTargetUrl())}
            />

          </div>

        </section>
      </main>

      <footer className="auth-footer">
        <div className="auth-shell auth-footer-inner">
          <span>EXPLAIN BYTES / LEARN WITH INTENTION</span>
          <span>© 2026 <i /> Built for curious engineers</span>
        </div>
      </footer>
    </div>
  );
}

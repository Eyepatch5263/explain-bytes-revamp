import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export type ConfirmToastOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
};

type ActiveConfirm = ConfirmToastOptions & {
  id: number;
  resolve: (value: boolean) => void;
};

type Listener = (confirm: ActiveConfirm | null) => void;
const listeners = new Set<Listener>();
let currentActive: ActiveConfirm | null = null;
let idCounter = 0;

/**
 * Singleton confirmation toast that matches Explain Bytes typography and theme.
 * Guarantees that at most ONE confirmation prompt exists at any time.
 * If another prompt is requested before the current one settles, the prior one
 * is immediately cancelled (resolves to false) and replaced cleanly without stacking.
 */
export function confirmToast(options: ConfirmToastOptions): Promise<boolean> {
  // If an active prompt is already open, immediately cancel it to avoid stacking
  if (currentActive) {
    currentActive.resolve(false);
    currentActive = null;
  }

  return new Promise<boolean>((resolve) => {
    const id = ++idCounter;
    const confirmItem: ActiveConfirm = {
      ...options,
      id,
      resolve: (val: boolean) => {
        if (currentActive?.id === id) {
          currentActive = null;
          listeners.forEach((fn) => fn(null));
        }
        resolve(val);
      },
    };

    currentActive = confirmItem;
    listeners.forEach((fn) => fn(confirmItem));
  });
}

export function ConfirmToastContainer() {
  const [active, setActive] = useState<ActiveConfirm | null>(null);
  const { theme, resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark" || theme === "dark";

  useEffect(() => {
    const listener: Listener = (item) => {
      setActive(item);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        active.resolve(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [active]);

  if (!active) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-toast-title"
      aria-describedby="confirm-toast-desc"
      className="collab-confirm-toast-wrapper"
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 999999,
        maxWidth: "420px",
        width: "calc(100vw - 32px)",
        pointerEvents: "auto",
        animation: "collab-confirm-appear 0.2s cubic-bezier(0.16, 1, 0.3, 1) both",
      }}
    >
      <div
        className="collab-confirm-toast"
        style={{
          width: "100%",
          background: isDark ? "#16231f" : "#fbfaf6",
          border: isDark
            ? "1px solid rgba(244, 239, 231, 0.22)"
            : "1px solid rgba(19, 34, 30, 0.18)",
          borderTop: "3px solid #e66b5b",
          color: isDark ? "#f4efe7" : "#13221e",
          boxShadow: isDark
            ? "0 20px 48px -4px rgba(0, 0, 0, 0.85), 0 0 0 1px rgba(255, 255, 255, 0.05)"
            : "0 18px 40px -6px rgba(19, 34, 30, 0.24), 0 2px 8px rgba(19, 34, 30, 0.08)",
          padding: "1.15rem 1.3rem",
          boxSizing: "border-box",
          borderRadius: "2px",
        }}
      >
        <div className="collab-confirm-toast-body">
          <p
            id="confirm-toast-title"
            className="collab-confirm-toast-title"
            style={{
              margin: 0,
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: 1.35,
              color: isDark ? "#f4efe7" : "#13221e",
              letterSpacing: "-0.01em",
            }}
          >
            {active.title}
          </p>
          {active.description && (
            <p
              id="confirm-toast-desc"
              className="collab-confirm-toast-desc"
              style={{
                margin: "0.45rem 0 0",
                fontSize: "12px",
                lineHeight: 1.55,
                color: isDark ? "rgba(244, 239, 231, 0.78)" : "#5a6661",
              }}
            >
              {active.description}
            </p>
          )}
        </div>
        <div
          className="collab-confirm-toast-actions"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: "0.6rem",
            marginTop: "1rem",
            paddingTop: "0.8rem",
            borderTop: isDark
              ? "1px solid rgba(244, 239, 231, 0.16)"
              : "1px solid rgba(19, 34, 30, 0.12)",
          }}
        >
          <button
            type="button"
            className="collab-confirm-toast-btn collab-confirm-toast-cancel"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.5rem 0.9rem",
              fontFamily: 'var(--font-mono, "DM Mono", monospace)',
              fontSize: "9px",
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              borderRadius: "2px",
              cursor: "pointer",
              background: "transparent",
              border: isDark
                ? "1px solid rgba(244, 239, 231, 0.32)"
                : "1px solid rgba(19, 34, 30, 0.28)",
              color: isDark ? "#f4efe7" : "#13221e",
              transition: "all 0.15s ease",
            }}
            onClick={() => active.resolve(false)}
          >
            {active.cancelLabel || "Cancel"}
          </button>
          <button
            type="button"
            className={`collab-confirm-toast-btn ${
              active.isDestructive
                ? "collab-confirm-toast-destructive"
                : "collab-confirm-toast-confirm"
            }`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "0.5rem 0.95rem",
              fontFamily: 'var(--font-mono, "DM Mono", monospace)',
              fontSize: "9px",
              fontWeight: 600,
              lineHeight: 1,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              borderRadius: "2px",
              cursor: "pointer",
              transition: "all 0.15s ease",
              ...(active.isDestructive
                ? {
                    background: "#e66b5b",
                    border: "1px solid #e66b5b",
                    color: "#141f1b",
                  }
                : isDark
                ? {
                    background: "#f4efe7",
                    border: "1px solid #f4efe7",
                    color: "#13221e",
                  }
                : {
                    background: "#13221e",
                    border: "1px solid #13221e",
                    color: "#f4efe7",
                  }),
            }}
            onClick={() => active.resolve(true)}
          >
            {active.confirmLabel || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}

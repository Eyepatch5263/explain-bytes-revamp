import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Router } from "wouter";
import { ProtectedRoute } from "../client/src/components/ProtectedRoute";
import * as authHook from "../client/src/_core/hooks/useAuth";

describe("ProtectedRoute", () => {
  it("renders loading state when authentication session is pending", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: null,
      loading: true,
      error: null,
      isAuthenticated: false,
      refresh: () => Promise.resolve({} as any),
      logout: () => Promise.resolve(),
    });

    const markup = renderToStaticMarkup(
      <Router ssrPath="/docs">
        <ProtectedRoute>
          <div>Private Secret Content</div>
        </ProtectedRoute>
      </Router>
    );

    expect(markup).toContain("Verifying authorization...");
    expect(markup).not.toContain("Private Secret Content");
  });

  it("does not render private content when user is not authenticated", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: null,
      loading: false,
      error: null,
      isAuthenticated: false,
      refresh: () => Promise.resolve({} as any),
      logout: () => Promise.resolve(),
    });

    const markup = renderToStaticMarkup(
      <Router ssrPath="/docs">
        <ProtectedRoute>
          <div>Private Secret Content</div>
        </ProtectedRoute>
      </Router>
    );

    expect(markup).toBe("");
    expect(markup).not.toContain("Private Secret Content");
  });

  it("renders protected content when user is authenticated", () => {
    vi.spyOn(authHook, "useAuth").mockReturnValue({
      user: {
        id: "123",
        email: "test@explainbytes.tech",
        name: "Test User",
        avatarUrl: null,
        role: "user",
      },
      loading: false,
      error: null,
      isAuthenticated: true,
      refresh: () => Promise.resolve({} as any),
      logout: () => Promise.resolve(),
    });

    const markup = renderToStaticMarkup(
      <Router ssrPath="/docs">
        <ProtectedRoute>
          <div>Private Secret Content</div>
        </ProtectedRoute>
      </Router>
    );

    expect(markup).toContain("Private Secret Content");
  });
});

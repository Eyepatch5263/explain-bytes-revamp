import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    email: "sample@example.com",
    name: "Sample User",
    avatarUrl: null,
    oauthProvider: "github",
    emailVerified: true,
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date(),
    verificationToken: null,
    verificationTokenExpires: null,
    passwordHash: null,
  };

  return {
    user,
    session: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("auth.logout", () => {
  it("reports success on logout", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});

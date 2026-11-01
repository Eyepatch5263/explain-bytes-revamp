import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { fromNodeHeaders } from "better-auth/node";
import type { User } from "../../drizzle/schema";
import { auth } from "../lib/auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  session: any | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let session: any | null = null;

  try {
    const sessionRes = await auth.api.getSession({
      headers: fromNodeHeaders(opts.req.headers),
    });

    if (sessionRes?.user) {
      user = {
        id: sessionRes.user.id,
        email: sessionRes.user.email,
        name: sessionRes.user.name ?? null,
        avatarUrl: (sessionRes.user as any).image ?? (sessionRes.user as any).avatarUrl ?? null,
        oauthProvider: (sessionRes.user as any).oauthProvider ?? null,
        emailVerified: sessionRes.user.emailVerified ?? false,
        createdAt: sessionRes.user.createdAt ?? new Date(),
        updatedAt: sessionRes.user.updatedAt ?? new Date(),
        lastLogin: (sessionRes.user as any).lastLogin ?? null,
        verificationToken: null,
        verificationTokenExpires: null,
        role: (sessionRes.user as any).role ?? "user",
        passwordHash: null,
      };
      session = sessionRes.session;
    }
  } catch (error) {
    user = null;
    session = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    session,
  };
}

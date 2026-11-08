import type { NextFunction, Request, Response } from "express";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { getUserByAuthSubject, getUserByEmail, upsertAuth0User } from "../db";
import type { User } from "../../drizzle/schema";
import { AUTH0_CLIENT_ID, AUTH0_DOMAIN, AUTH0_ISSUER } from "../../shared/auth0";

const jwks = createRemoteJWKSet(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));

type Auth0Claims = JWTPayload & {
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
};

export class AuthenticationError extends Error {
  constructor(message: string, readonly status = 401) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export async function authenticateAuth0IdToken(token: string): Promise<User> {
  if (!token || token.length > 12_000) throw new AuthenticationError("A valid sign-in token is required.");

  let claims: Auth0Claims;
  try {
    const verified = await jwtVerify(token, jwks, {
      issuer: AUTH0_ISSUER,
      audience: AUTH0_CLIENT_ID,
    });
    claims = verified.payload as Auth0Claims;
  } catch {
    throw new AuthenticationError("Your sign-in has expired. Please sign in again.");
  }

  if (!claims.sub || !claims.email || !claims.email.includes("@")) {
    throw new AuthenticationError("Your verified account profile is missing an email address.");
  }

  const bySubject = await getUserByAuthSubject(claims.sub);
  if (bySubject) return bySubject;

  const byEmail = await getUserByEmail(claims.email.toLowerCase());
  if (byEmail?.authSubject && byEmail.authSubject !== claims.sub) {
    throw new AuthenticationError("This email address is already linked to another identity.", 403);
  }
  if (byEmail && !byEmail.authSubject && claims.email_verified !== true) {
    throw new AuthenticationError("Verify your email address before using collaborative documents.", 403);
  }

  const user = await upsertAuth0User({
    email: claims.email.toLowerCase(),
    authSubject: claims.sub,
    name: claims.name ?? null,
    avatarUrl: claims.picture ?? null,
    oauthProvider: "auth0",
    emailVerified: claims.email_verified === true,
  });
  if (!user) throw new AuthenticationError("The document service cannot reach PostgreSQL.", 503);
  return user;
}

export type AuthenticatedRequest = Request & { collaborationUser?: User };

export function requireCollaborator(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const header = req.header("authorization") ?? "";
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    res.status(401).json({ error: "Sign in to open collaborative documents." });
    return;
  }

  authenticateAuth0IdToken(match[1])
    .then((user) => {
      req.collaborationUser = user;
      next();
    })
    .catch((error: unknown) => {
      const status = error instanceof AuthenticationError ? error.status : 401;
      const message = error instanceof AuthenticationError ? error.message : "The sign-in token could not be verified.";
      res.status(status).json({ error: message });
    });
}

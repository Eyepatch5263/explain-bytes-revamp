import { betterAuth } from "better-auth";
import { pool } from "../db";

export const auth = betterAuth({

  database: pool,
  baseURL: {
    allowedHosts: [
      "localhost:3000",
      "127.0.0.1:3000",
      "localhost:5173",
      "*.ngrok-free.app",
      "*.ngrok.io",
      "*.ngrok.app",
      "explainbytes.tech",
      "www.explainbytes.tech",
    ],
    fallback: process.env.BETTER_AUTH_URL || process.env.NEXTAUTH_PUBLIC_SITE_URL || "http://localhost:3000",
    protocol: "auto",
  },
  secret: process.env.BETTER_AUTH_SECRET || process.env.NEXTAUTH_SECRET || "explainbytes-betterauth-secret-key-12345",
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://*.ngrok-free.app",
    "https://*.ngrok.io",
    "https://*.ngrok.app",
    ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
    ...(process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : []),
  ],
  user: {
    modelName: "users",
    fields: {
      emailVerified: "email_verified",
      createdAt: "created_at",
      updatedAt: "updated_at",
      image: "avatar_url",
    },
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
      },
      oauthProvider: {
        type: "string",
        fieldName: "oauth_provider",
        required: false,
      },
      lastLogin: {
        type: "date",
        fieldName: "last_login",
        required: false,
      },
    },
  },
  session: {
    modelName: "session",
  },
  account: {
    modelName: "account",
  },
  verification: {
    modelName: "verification",
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      enabled: Boolean(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET),
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
  },
  plugins: [],
});

export type Auth = typeof auth;
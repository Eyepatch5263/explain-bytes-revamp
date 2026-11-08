import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "../drizzle/schema";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(pool, { schema });
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function getUserById(id: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(schema.users).where(eq(schema.users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertAuth0User({
  email,
  name,
  avatarUrl,
  oauthProvider = "auth0",
  emailVerified = false,
}: {
  email: string;
  name?: string | null;
  avatarUrl?: string | null;
  oauthProvider?: string | null;
  emailVerified?: boolean;
}) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot sync user: database not available");
    return undefined;
  }

  const existing = await getUserByEmail(email);

  if (existing) {
    const [updated] = await db
      .update(schema.users)
      .set({
        name: name ?? existing.name,
        avatarUrl: avatarUrl ?? existing.avatarUrl,
        oauthProvider: oauthProvider ?? existing.oauthProvider ?? "auth0",
        emailVerified: emailVerified ?? existing.emailVerified,
        lastLogin: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, existing.id))
      .returning();
    return updated;
  }

  const [created] = await db
    .insert(schema.users)
    .values({
      email,
      name: name ?? null,
      avatarUrl: avatarUrl ?? null,
      oauthProvider: oauthProvider ?? "auth0",
      emailVerified: emailVerified ?? false,
      lastLogin: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      role: "user",
    })
    .returning();
  return created;
}

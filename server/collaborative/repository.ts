import { desc, eq } from "drizzle-orm";
import { documents, users, type Document } from "../../drizzle/schema";
import { getDb } from "../db";

export class RepositoryError extends Error {
  constructor(message: string, readonly status = 500) {
    super(message);
    this.name = "RepositoryError";
  }
}

export async function getDocumentById(documentId: string): Promise<Document | undefined> {
  const db = await getDb();
  if (!db) throw new RepositoryError("PostgreSQL is not configured for collaborative documents.", 503);
  const [document] = await db.select().from(documents).where(eq(documents.documentId, documentId)).limit(1);
  return document;
}

export async function listOwnerDocuments(ownerId: string): Promise<Document[]> {
  const db = await getDb();
  if (!db) throw new RepositoryError("PostgreSQL is not configured for collaborative documents.", 503);
  return db.select().from(documents).where(eq(documents.ownerId, ownerId)).orderBy(desc(documents.updatedAt));
}

export async function saveDocumentContent(documentId: string, content: string) {
  const db = await getDb();
  if (!db) throw new RepositoryError("PostgreSQL is not configured for collaborative documents.", 503);
  const [saved] = await db
    .update(documents)
    .set({ content, updatedAt: new Date() })
    .where(eq(documents.documentId, documentId))
    .returning();
  return saved;
}

export function toPublicDocument(document: Document, viewerId: string) {
  return {
    id: document.documentId,
    title: document.title ?? document.description ?? "Untitled document",
    category: document.topic ?? "Uncategorized",
    section: document.category ?? "system design",
    content: document.content ?? "",
    format: document.format ?? "mdx",
    status: document.status ?? "draft",
    createdAt: document.createdAt?.toISOString() ?? null,
    updatedAt: document.updatedAt?.toISOString() ?? null,
    publishedAt: document.publishedAt?.toISOString() ?? null,
    ownerId: document.ownerId,
    isOwner: document.ownerId === viewerId,
    forkedFromDocumentId: document.forkedFromDocumentId ?? null,
  };
}

export function toAdminDocument(
  document: Document,
  author?: { name?: string | null; email?: string | null }
) {
  return {
    ...toPublicDocument(document, ""),
    authorName: author?.name ?? "Unknown author",
    authorEmail: author?.email ?? "unknown@user.com",
    reviewedAt: document.reviewedAt?.toISOString() ?? null,
  };
}

export async function listPublishedDocuments() {
  const db = await getDb();
  if (!db) throw new RepositoryError("PostgreSQL is not configured for collaborative documents.", 503);
  const rows = await db
    .select({
      document: documents,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(documents)
    .leftJoin(users, eq(documents.ownerId, users.id))
    .where(eq(documents.status, "published"))
    .orderBy(desc(documents.publishedAt), desc(documents.updatedAt));

  return rows.map((r) => toAdminDocument(r.document, { name: r.authorName, email: r.authorEmail }));
}

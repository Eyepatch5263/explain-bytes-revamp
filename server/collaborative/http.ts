import { Router, type Request, type Response, type NextFunction } from "express";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";
import { documents } from "../../drizzle/schema";
import { DOCUMENT_SECTIONS } from "../../shared/collaboration";
import { getDb } from "../db";
import { requireCollaborator, type AuthenticatedRequest } from "./auth";
import { getRoomParticipantCount, storeYjsDocument } from "./hocuspocus";
import { getDocumentById, listOwnerDocuments, listPublishedDocuments, RepositoryError, saveDocumentContent, toPublicDocument } from "./repository";
import { publishDocumentToFileAndGit } from "./git-publisher";
import type { Hocuspocus } from "@hocuspocus/server";
import * as Y from "yjs";

export const ADMIN_EMAIL = "pratyushpragyey@gmail.com";

const createSchema = z.object({
  title: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(64),
  section: z.enum(DOCUMENT_SECTIONS),
});
const contentSchema = z.object({ content: z.string().max(1_000_000) });
const documentIdSchema = z.string().min(16).max(64).regex(/^[a-zA-Z0-9_-]+$/);

type Handler = (req: AuthenticatedRequest, res: Response, next: NextFunction) => Promise<void>;
const asyncHandler = (handler: Handler) => (req: Request, res: Response, next: NextFunction) =>
  Promise.resolve(handler(req as AuthenticatedRequest, res, next)).catch(next);

function ownerOf(document: { ownerId: string }, userId: string) {
  return document.ownerId === userId;
}

export function createCollaborativeHttpRouter(hocuspocus: Hocuspocus<any>) {
  const router = Router();
  router.use(requireCollaborator);

  router.get("/documents", asyncHandler(async (req, res) => {
    const user = req.collaborationUser!;
    const owned = await listOwnerDocuments(user.id);
    res.json({ documents: owned.map((document) => toPublicDocument(document, user.id)) });
  }));

  router.post("/documents", asyncHandler(async (req, res) => {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Add a title, a category, and a valid section." });
      return;
    }
    const db = await getDb();
    if (!db) throw new RepositoryError("PostgreSQL is not configured for collaborative documents.", 503);
    const { title, category, section } = parsed.data;
    const content = `# ${title}\n\nStart with the central idea, then add the trade-offs that make it useful.`;
    const createdRows = await db.insert(documents).values({
      documentId: nanoid(24),
      ownerId: req.collaborationUser!.id,
      title,
      description: title,
      topic: category,
      category: section,
      content,
      status: "draft",
      format: "mdx",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    const created = Array.isArray(createdRows) ? createdRows[0] : undefined;
    if (!created) throw new RepositoryError("The document could not be created.", 500);
    res.status(201).json({ document: toPublicDocument(created, req.collaborationUser!.id) });
  }));

  router.get("/documents/:documentId", asyncHandler(async (req, res) => {
    const id = documentIdSchema.safeParse(req.params.documentId);
    if (!id.success) {
      res.status(404).json({ error: "This document room does not exist." });
      return;
    }
    const document = await getDocumentById(id.data);
    if (!document) {
      res.status(404).json({ error: "This document room does not exist." });
      return;
    }
    const user = req.collaborationUser!;
    res.json({
      document: toPublicDocument(document, user.id),
      room: { participants: getRoomParticipantCount(document.documentId), limit: 5 },
    });
  }));

  router.post("/documents/:documentId/save", asyncHandler(async (req, res) => {
    const id = documentIdSchema.safeParse(req.params.documentId);
    const parsed = contentSchema.safeParse(req.body);
    if (!id.success || !parsed.success) {
      res.status(400).json({ error: "The document content could not be saved." });
      return;
    }
    const document = await getDocumentById(id.data);
    if (!document) {
      res.status(404).json({ error: "This document room does not exist." });
      return;
    }
    if (document.status === "published") {
      res.status(403).json({ error: "Published documents are read-only. Fork the document to continue editing." });
      return;
    }
    const active = hocuspocus.documents.get(document.documentId);
    if (active) await storeYjsDocument(document.documentId, active);
    else await saveDocumentContent(document.documentId, parsed.data.content);
    res.json({ savedAt: new Date().toISOString() });
  }));

  router.post("/documents/:documentId/publish", asyncHandler(async (req, res) => {
    const id = documentIdSchema.safeParse(req.params.documentId);
    if (!id.success) {
      res.status(404).json({ error: "This document room does not exist." });
      return;
    }
    const document = await getDocumentById(id.data);
    if (!document) {
      res.status(404).json({ error: "This document room does not exist." });
      return;
    }
    const user = req.collaborationUser!;
    if (!ownerOf(document, user.id)) {
      res.status(403).json({ error: "Only the original owner can publish this document. Fork it to publish your own version." });
      return;
    }
    const db = await getDb();
    if (!db) throw new RepositoryError("PostgreSQL is not configured for collaborative documents.", 503);
    const [published] = await db.update(documents).set({ status: "published", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(documents.documentId, document.documentId)).returning();
    hocuspocus.closeConnections(document.documentId);
    res.json({ document: toPublicDocument(published, user.id) });
  }));

  router.delete("/documents/:documentId", asyncHandler(async (req, res) => {
    const id = documentIdSchema.safeParse(req.params.documentId);
    if (!id.success) {
      res.status(404).json({ error: "This document room does not exist." });
      return;
    }
    const document = await getDocumentById(id.data);
    if (!document) {
      res.status(404).json({ error: "This document room does not exist." });
      return;
    }
    const user = req.collaborationUser!;
    if (!ownerOf(document, user.id)) {
      res.status(403).json({ error: "Only the original owner can delete this document." });
      return;
    }
    const db = await getDb();
    if (!db) throw new RepositoryError("PostgreSQL is not configured for collaborative documents.", 503);
    hocuspocus.closeConnections(document.documentId);
    await db.delete(documents).where(eq(documents.documentId, document.documentId));
    res.json({ success: true, documentId: document.documentId });
  }));

  router.post("/documents/:documentId/fork", asyncHandler(async (req, res) => {
    const id = documentIdSchema.safeParse(req.params.documentId);
    if (!id.success) {
      res.status(404).json({ error: "This document room does not exist." });
      return;
    }
    const source = await getDocumentById(id.data);
    if (!source) {
      res.status(404).json({ error: "This document room does not exist." });
      return;
    }
    const db = await getDb();
    if (!db) throw new RepositoryError("PostgreSQL is not configured for collaborative documents.", 503);
    const suffix = " — fork";
    const title = `${(source.title ?? "Untitled document").slice(0, 160 - suffix.length)}${suffix}`;
    const forkRows = await db.insert(documents).values({
      documentId: nanoid(24),
      ownerId: req.collaborationUser!.id,
      title,
      description: title,
      topic: source.topic ?? "Uncategorized",
      category: source.category ?? "system design",
      content: source.content ?? "",
      status: "draft",
      format: source.format ?? "mdx",
      forkedFromDocumentId: source.documentId,
      ydocState: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    const fork = Array.isArray(forkRows) ? forkRows[0] : undefined;
    if (!fork) throw new RepositoryError("The fork could not be created.", 500);
    res.status(201).json({ document: toPublicDocument(fork, req.collaborationUser!.id) });
  }));

  function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    const email = req.collaborationUser?.email?.toLowerCase().trim();
    if (email !== ADMIN_EMAIL.toLowerCase().trim()) {
      res.status(403).json({ error: "Access denied. Admin privileges required." });
      return;
    }
    next();
  }

  // Admin routes: view published manuscripts, approve (writes to content dir and pushes to Git), reject
  router.get("/admin/documents", requireAdmin, asyncHandler(async (req, res) => {
    const published = await listPublishedDocuments();
    res.json({ documents: published });
  }));

  router.post("/admin/documents/:documentId/approve", requireAdmin, asyncHandler(async (req, res) => {
    const id = documentIdSchema.safeParse(req.params.documentId);
    if (!id.success) {
      res.status(404).json({ error: "This document room does not exist." });
      return;
    }
    const document = await getDocumentById(id.data);
    if (!document) {
      res.status(404).json({ error: "This document does not exist." });
      return;
    }

    // 1. Write file to content directory and push changes to git
    const gitResult = await publishDocumentToFileAndGit({
      title: document.title ?? "Untitled",
      category: document.topic ?? "general",
      section: document.category ?? "system design",
      content: document.content ?? "",
      description: document.description,
      documentId: document.documentId,
    });

    // 2. Update status in Postgres to approved
    const db = await getDb();
    if (!db) throw new RepositoryError("PostgreSQL is not configured for collaborative documents.", 503);
    const [updated] = await db
      .update(documents)
      .set({
        status: "approved",
        reviewedBy: req.collaborationUser!.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(documents.documentId, document.documentId))
      .returning();

    res.json({
      success: true,
      document: toPublicDocument(updated, req.collaborationUser!.id),
      git: gitResult,
    });
  }));

  router.post("/admin/documents/:documentId/reject", requireAdmin, asyncHandler(async (req, res) => {
    const id = documentIdSchema.safeParse(req.params.documentId);
    if (!id.success) {
      res.status(404).json({ error: "This document room does not exist." });
      return;
    }
    const document = await getDocumentById(id.data);
    if (!document) {
      res.status(404).json({ error: "This document does not exist." });
      return;
    }

    const db = await getDb();
    if (!db) throw new RepositoryError("PostgreSQL is not configured for collaborative documents.", 503);
    const [updated] = await db
      .update(documents)
      .set({
        status: "rejected",
        reviewedBy: req.collaborationUser!.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(documents.documentId, document.documentId))
      .returning();

    res.json({
      success: true,
      document: toPublicDocument(updated, req.collaborationUser!.id),
    });
  }));

  router.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    if (res.headersSent) return;
    const status = error instanceof RepositoryError ? error.status : 500;
    const message = error instanceof Error ? error.message : "The document request failed.";
    if (status >= 500) console.error("[Collaborative documents]", error);
    res.status(status).json({ error: status >= 500 ? "The document service is temporarily unavailable." : message });
  });

  return router;
}

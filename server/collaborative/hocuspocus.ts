import { Hocuspocus } from "@hocuspocus/server";
import { eq } from "drizzle-orm";
import * as Y from "yjs";
import { documents } from "../../drizzle/schema";
import { getDb } from "../db";
import { authenticateAuth0IdToken } from "./auth";
import { getDocumentById, RepositoryError } from "./repository";
import { RoomCapacityRegistry } from "./room-capacity";

type ConnectionContext = {
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

const roomCapacity = new RoomCapacityRegistry();

export function getRoomParticipantCount(documentId: string) {
  return roomCapacity.count(documentId);
}

export async function storeYjsDocument(documentId: string, document: Y.Doc) {
  const db = await getDb();
  if (!db) throw new RepositoryError("PostgreSQL is not configured for collaborative documents.", 503);
  const ydocState = Buffer.from(Y.encodeStateAsUpdate(document));
  const content = document.getText("markdown").toString();
  await db
    .update(documents)
    .set({ ydocState, content, updatedAt: new Date() })
    .where(eq(documents.documentId, documentId));
}

export function createCollaborationServer() {
  return new Hocuspocus<ConnectionContext>({
    debounce: 900,
    maxDebounce: 4_000,
    unloadImmediately: true,
    async onAuthenticate({ documentName, token, socketId, connectionConfig }) {
      if (!/^[a-zA-Z0-9_-]{16,64}$/.test(documentName)) {
        throw new Error("This document room does not exist.");
      }
      const user = await authenticateAuth0IdToken(token);
      const document = await getDocumentById(documentName);
      if (!document) throw new Error("This document room does not exist.");
      if (document.status === "published") connectionConfig.readOnly = true;
      roomCapacity.reserve(documentName, user.id, socketId);
      return {
        userId: user.id,
        name: user.name ?? user.email,
        email: user.email,
        avatarUrl: user.avatarUrl ?? null,
      } satisfies ConnectionContext;
    },
    async onTokenSync({ token, context, documentName }) {
      const user = await authenticateAuth0IdToken(token);
      if (user.id !== context.userId || documentName.length < 16) {
        throw new Error("This room connection is no longer authorized.");
      }
    },
    async onLoadDocument({ documentName }) {
      const document = await getDocumentById(documentName);
      if (!document) throw new Error("This document room does not exist.");
      const ydoc = new Y.Doc();
      if (document.ydocState) {
        Y.applyUpdate(ydoc, new Uint8Array(document.ydocState));
      } else if (document.content) {
        ydoc.getText("markdown").insert(0, document.content);
      }
      return ydoc;
    },
    async onStoreDocument({ documentName, document }) {
      await storeYjsDocument(documentName, document);
    },
    async onDisconnect({ socketId }) {
      roomCapacity.release(socketId);
    },
  });
}

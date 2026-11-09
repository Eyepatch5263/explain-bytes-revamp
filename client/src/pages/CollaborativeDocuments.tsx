import { useCallback, useEffect, useMemo, useState } from "react";
import "@/styles/collaborative.css";
import { useLocation } from "wouter";
import { ArrowLeft, ArrowRight, BookOpen, Check, Code2, FilePlus2, GitFork, LoaderCircle, Plus, Search, Share2, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { DOCUMENT_SECTIONS } from "../../../shared/collaboration";
import { collaborativeRequest, getDocumentStatusBadge, type CollaborativeDocument } from "@/lib/collaborative-api";
import { confirmToast } from "@/lib/confirm-toast";
import CollaborativeRoom from "@/components/collaborative/CollaborativeRoom";

const dateLabel = (value: string | null) => value ? new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : "Just created";

function roomIdFromInput(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/\/collaborate\/([A-Za-z0-9_-]{16,64})/);
  return match?.[1] ?? trimmed;
}

export default function CollaborativeDocuments({ documentId }: { documentId?: string }) {
  const { user, getIdTokenClaims } = useAuth();
  const [, setLocation] = useLocation();
  const [documents, setDocuments] = useState<CollaborativeDocument[]>([]);
  const [activeDocument, setActiveDocument] = useState<CollaborativeDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [section, setSection] = useState<(typeof DOCUMENT_SECTIONS)[number]>(DOCUMENT_SECTIONS[0]);
  const [search, setSearch] = useState("");
  const [roomCode, setRoomCode] = useState("");

  const request = useCallback(async <T,>(path: string, init?: RequestInit) => {
    const claims = await getIdTokenClaims();
    if (!claims?.__raw) throw new Error("Your sign-in has expired. Please sign in again.");
    return collaborativeRequest<T>(path, claims.__raw, init);
  }, [getIdTokenClaims]);

  const getToken = useCallback(async () => {
    const claims = await getIdTokenClaims();
    if (!claims?.__raw) throw new Error("Your sign-in has expired. Please sign in again.");
    return claims.__raw;
  }, [getIdTokenClaims]);

  const loadShelf = useCallback(async () => {
    setLoading(true);
    setPageError("");
    try {
      const result = await request<{ documents: CollaborativeDocument[] }>("/documents");
      setDocuments(result.documents);
    } catch (error) {
      setPageError(error instanceof Error ? error.message : "The document shelf could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (!documentId) {
      setActiveDocument(null);
      void loadShelf();
      return;
    }
    let cancelled = false;
    setLoading(true);
    setPageError("");
    setActiveDocument(null);
    request<{ document: CollaborativeDocument; room: { participants: number; limit: number } }>(`/documents/${encodeURIComponent(documentId)}`)
      .then(({ document }) => { if (!cancelled) setActiveDocument(document); })
      .catch((error: unknown) => { if (!cancelled) setPageError(error instanceof Error ? error.message : "This room is unavailable."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [documentId, loadShelf, request]);

  const filteredDocuments = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return documents;
    return documents.filter((document) => `${document.title} ${document.category} ${document.section}`.toLowerCase().includes(term));
  }, [documents, search]);

  const createDocument = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() || !category.trim()) return;
    setCreating(true);
    try {
      const result = await request<{ document: CollaborativeDocument }>("/documents", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), category: category.trim(), section }),
      });
      toast.success("Your draft room is ready.");
      setLocation(`/collaborate/${result.document.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be created.");
    } finally {
      setCreating(false);
    }
  };

  const joinRoom = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const id = roomIdFromInput(roomCode);
    if (!/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
      toast.error("Paste a room link or a valid room ID.");
      return;
    }
    setLocation(`/collaborate/${id}`);
  };

  const copyShareLink = async (id: string) => {
    const link = `${window.location.origin}/collaborate/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Room link copied. Share it with up to four other people.");
    } catch {
      toast.info(`Room link: ${link}`, { duration: 8000 });
    }
  };

  const deleteDocument = async (id: string, docTitle: string) => {
    const confirmed = await confirmToast({
      title: `Delete "${docTitle}"?`,
      description: "This manuscript and its room will be permanently removed. This action cannot be undone.",
      confirmLabel: "Delete Document",
      cancelLabel: "Cancel",
      isDestructive: true,
    });
    if (!confirmed) return;
    try {
      await request(`/documents/${id}`, { method: "DELETE" });
      setDocuments((prev) => prev.filter((doc) => doc.id !== id));
      toast.success("Document deleted.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be deleted.");
    }
  };

  if (documentId) {
    if (loading) return <main className="collab-page"><div className="collab-loading"><LoaderCircle className="animate-spin" size={18} /> Opening the shared room…</div></main>;
    if (!activeDocument) return (
      <main className="collab-page">
        <header className="collab-topbar"><a className="collab-wordmark" href="/">Explain Bytes</a><a className="collab-back" href="/collaborate"><ArrowLeft size={14} /> My shelf</a></header>
        <section className="collab-empty collab-room-error"><p className="collab-eyebrow">ROOM NOT FOUND</p><h1>This room is unavailable.</h1><p>{pageError || "Check the shared link, or ask the owner for an updated one."}</p><a className="collab-button collab-button-dark" href="/collaborate">Back to your shelf <ArrowRight size={15} /></a></section>
      </main>
    );
    return (
      <CollaborativeRoom
        document={activeDocument}
        request={request}
        getToken={getToken}
        currentUser={{ id: user?.id ?? user?.sub ?? "member", name: user?.name ?? user?.email ?? "Member", email: user?.email ?? "" }}
        onBack={() => setLocation("/collaborate")}
        onDocumentChange={setActiveDocument}
        onFork={(fork) => { toast.success("A private fork is now on your shelf."); setLocation(`/collaborate/${fork.id}`); }}
        onShare={() => copyShareLink(activeDocument.id)}
        onDelete={() => { toast.success("Document deleted."); setLocation("/collaborate"); }}
      />
    );
  }

  return (
    <main className="collab-page">
      <header className="collab-topbar">
        <a className="collab-wordmark" href="/">Explain Bytes</a>
        <nav className="collab-topnav">
          <a href="/docs">Library</a>
          <span className="collab-nav-current">Shared drafts</span>
          {user?.email?.toLowerCase().trim() === "pratyushpragyey@gmail.com" && (
            <a href="/admin" style={{ color: "var(--collab-coral)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
              <ShieldCheck size={12} /> Admin review
            </a>
          )}
        </nav>
        <div className="collab-account"><span className="collab-avatar">{(user?.name ?? user?.email ?? "M").slice(0, 1).toUpperCase()}</span><span>{user?.name ?? "Member"}</span></div>
      </header>
      <section className="collab-shelf-hero">
        <div><p className="collab-eyebrow">THE EXPLAIN BYTES STUDY ROOM <span> / 01</span></p><h1>Make the idea<br /><em>legible together.</em></h1><p className="collab-lede">A shared space for drafts, diagrams, and the explanations behind them. Your drafts stay yours; collaborators can fork, and only you can publish the original.</p></div>
        <div className="collab-hero-note"><span className="collab-note-index">ROOM RULE / 01</span><strong>One room.<br />Five people.</strong><p>Share a link to work in real time. Each collaborator can fork a private copy to make it their own.</p><div className="collab-note-mark"><Users size={15} /> UP TO 5 ACTIVE AUTHORS</div></div>
      </section>
      <section className="collab-shelf-main">
        <div className="collab-shelf-actions">
          <div><p className="collab-eyebrow">YOUR MANUSCRIPTS</p><h2>Document shelf <span>{documents.length.toString().padStart(2, "0")}</span></h2></div>
          <div className="collab-shelf-buttons">
            <form className="collab-join-form" onSubmit={joinRoom}><input aria-label="Room link or ID" placeholder="Paste a room link or ID" value={roomCode} onChange={(event) => setRoomCode(event.target.value)} /><button className="collab-button collab-button-outline" type="submit"><Users size={14} /> Join room</button></form>
            <button className="collab-button collab-button-dark" onClick={() => setCreateOpen((value) => !value)}><FilePlus2 size={15} /> New document</button>
          </div>
        </div>
        {createOpen && <form className="collab-create-panel" onSubmit={createDocument}>
          <div className="collab-create-heading"><div><p className="collab-eyebrow">START A NEW MANUSCRIPT</p><h3>Give the idea a place to grow.</h3></div><button type="button" className="collab-icon-button" aria-label="Close creation form" onClick={() => setCreateOpen(false)}><X size={17} /></button></div>
          <div className="collab-form-grid">
            <label>Document title<input required maxLength={160} placeholder="e.g. Designing a rate limiter" value={title} onChange={(event) => setTitle(event.target.value)} /></label>
            <label>Category <span>TYPE YOUR OWN</span><input required maxLength={64} placeholder="e.g. Interview notes" value={category} onChange={(event) => setCategory(event.target.value)} /></label>
            <label>Section<select value={section} onChange={(event) => setSection(event.target.value as (typeof DOCUMENT_SECTIONS)[number])}>{DOCUMENT_SECTIONS.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
          </div>
          <div className="collab-create-footer"><p>Draft · MDX source · private until you share the room link</p><button className="collab-button collab-button-coral" disabled={creating || !title.trim() || !category.trim()} type="submit">{creating ? <LoaderCircle className="animate-spin" size={15} /> : <Plus size={15} />} Create document</button></div>
        </form>}
        <div className="collab-list-tools"><label className="collab-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a manuscript" /></label><p>OWNER’S COPY · AUTOSAVED TO POSTGRES</p></div>
        {loading ? <div className="collab-loading"><LoaderCircle className="animate-spin" size={18} /> Gathering your documents…</div> : pageError ? <div className="collab-message-error">{pageError}</div> : filteredDocuments.length === 0 ? (
          <div className="collab-empty"><BookOpen size={24} /><h3>{documents.length ? "No matching manuscripts." : "Your shelf is waiting."}</h3><p>{documents.length ? "Try another title or category." : "Create the first draft, then invite a collaborator into the room."}</p>{!documents.length && <button className="collab-button collab-button-coral" onClick={() => setCreateOpen(true)}><FilePlus2 size={15} /> Write the first draft</button>}</div>
        ) : (
          <div className="collab-document-grid">{filteredDocuments.map((document, index) => {
            const badge = getDocumentStatusBadge(document.status);
            return (
              <article className="collab-document-card" key={document.id}>
                <div className="collab-card-top"><span className="collab-card-number">{String(index + 1).padStart(2, "0")}</span><span className={`collab-status ${badge.className}`}>{badge.label}</span></div>
            <a href={`/collaborate/${document.id}`} className="collab-card-title">{document.title}</a>
            <p className="collab-card-category">{document.category}<span> / </span>{document.section}</p>
            <p className="collab-card-excerpt">{document.content.replace(/^#+\s+/gm, "").replace(/[`*_>#]/g, "").slice(0, 130) || "A blank page, ready for a good explanation."}</p>
            <div className="collab-card-meta"><span>UPDATED {dateLabel(document.updatedAt).toUpperCase()}</span>{document.forkedFromDocumentId && <span className="collab-fork-origin"><GitFork size={12} /> FORKED</span>}</div>
            <div className="collab-card-actions">
              <a href={`/collaborate/${document.id}`}>Open room <ArrowRight size={14} /></a>
              <div className="collab-card-action-buttons">
                <button aria-label={`Share ${document.title}`} title="Share room" onClick={() => copyShareLink(document.id)}><Share2 size={14} /></button>
                {document.isOwner && (
                  <button aria-label={`Delete ${document.title}`} title="Delete document" className="collab-card-delete-btn" onClick={() => deleteDocument(document.id, document.title)}><Trash2 size={14} /></button>
                )}
              </div>
            </div>
          </article>
        ); })}</div>
        )}
        <div className="collab-shelf-footnote"><span><Check size={14} /> Every keystroke syncs through Yjs and is persisted as a Postgres document.</span><a href="/docs">Return to the library <ArrowRight size={13} /></a></div>
      </section>
      <footer className="collab-footer"><a href="/">Explain Bytes</a><span>Built for clear thinking, shared generously.</span><span>PRIVATE BY DEFAULT · OWNER PUBLISHES</span></footer>
    </main>
  );
}

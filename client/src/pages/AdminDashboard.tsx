import { useCallback, useEffect, useState } from "react";
import "@/styles/collaborative.css";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Code2,
  ExternalLink,
  Eye,
  GitBranch,
  GitCommit,
  LoaderCircle,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAuth } from "@/_core/hooks/useAuth";
import { collaborativeRequest } from "@/lib/collaborative-api";
import { confirmToast } from "@/lib/confirm-toast";

export const ADMIN_EMAIL = "pratyushpragyey@gmail.com";

export function isAdminEmail(email?: string | null): boolean {
  return email?.toLowerCase().trim() === ADMIN_EMAIL.toLowerCase().trim();
}

type AdminDocumentItem = {
  id: string;
  title: string;
  category: string;
  section: string;
  content: string;
  format: string;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  publishedAt: string | null;
  ownerId: string;
  authorName: string;
  authorEmail: string;
};

const dateLabel = (value: string | null) =>
  value
    ? new Date(value).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recently";

export default function AdminDashboard() {
  const { user, getIdTokenClaims } = useAuth();
  const [, setLocation] = useLocation();
  const [documents, setDocuments] = useState<AdminDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDoc, setSelectedDoc] = useState<AdminDocumentItem | null>(null);
  const [previewMode, setPreviewMode] = useState<"rendered" | "raw">("rendered");
  const [processingId, setProcessingId] = useState<string | null>(null);

  const request = useCallback(
    async <T,>(path: string, init?: RequestInit) => {
      const claims = await getIdTokenClaims();
      if (!claims?.__raw) throw new Error("Your sign-in has expired. Please sign in again.");
      return collaborativeRequest<T>(path, claims.__raw, init);
    },
    [getIdTokenClaims]
  );

  const loadPublishedDocuments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await request<{ documents: AdminDocumentItem[] }>("/admin/documents");
      setDocuments(result.documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load published manuscripts.");
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (isAdminEmail(user?.email)) {
      void loadPublishedDocuments();
    } else {
      setLoading(false);
    }
  }, [loadPublishedDocuments, user?.email]);

  const approveDocument = async (doc: AdminDocumentItem) => {
    if (processingId) return;
    const confirmed = await confirmToast({
      title: `Approve and push "${doc.title}"?`,
      description: `This will write the MDX file into client/src/content/${doc.section}/${doc.category}/ and push changes to GitHub.`,
      confirmLabel: "Approve & Push",
      cancelLabel: "Cancel",
      isDestructive: false,
    });
    if (!confirmed) return;

    setProcessingId(doc.id);
    try {
      const result = await request<{
        success: boolean;
        document: AdminDocumentItem;
        git: {
          filePath: string;
          relativePath: string;
          gitCommitted: boolean;
          gitPushed: boolean;
          gitMessage?: string;
          error?: string;
        };
      }>(`/admin/documents/${doc.id}/approve`, { method: "POST" });

      toast.success(
        <div>
          <p className="font-semibold">Document Approved & Written to Content Dir!</p>
          <p className="text-xs opacity-90">{result.git.relativePath}</p>
          {result.git.gitPushed && <p className="text-xs text-emerald-600">✓ Pushed to GitHub main branch</p>}
          {result.git.error && <p className="text-xs text-amber-600">Notice: {result.git.error}</p>}
        </div>
      );

      // Remove from pending list
      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
      if (selectedDoc?.id === doc.id) setSelectedDoc(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Approval failed.");
    } finally {
      setProcessingId(null);
    }
  };

  const rejectDocument = async (doc: AdminDocumentItem) => {
    if (processingId) return;
    const confirmed = await confirmToast({
      title: `Reject manuscript "${doc.title}"?`,
      description: 'The document status will be changed to "rejected" in the database.',
      confirmLabel: "Reject Manuscript",
      cancelLabel: "Keep in Queue",
      isDestructive: true,
    });
    if (!confirmed) return;

    setProcessingId(doc.id);
    try {
      await request<{ success: boolean }>(`/admin/documents/${doc.id}/reject`, { method: "POST" });
      toast.success(`"${doc.title}" was rejected.`);
      setDocuments((prev) => prev.filter((item) => item.id !== doc.id));
      if (selectedDoc?.id === doc.id) setSelectedDoc(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rejection failed.");
    } finally {
      setProcessingId(null);
    }
  };

  // Guard: if current user is not admin
  if (!loading && !isAdminEmail(user?.email)) {
    return (
      <main className="collab-page">
        <header className="collab-topbar">
          <a className="collab-wordmark" href="/">Explain Bytes</a>
          <a className="collab-back" href="/collaborate"><ArrowLeft size={14} /> My shelf</a>
        </header>
        <section className="collab-empty collab-room-error">
          <ShieldAlert size={42} className="text-rose-500 mb-2" />
          <p className="collab-eyebrow">ADMIN ACCESS REQUIRED</p>
          <h1>Access Restricted</h1>
          <p>
            This portal is exclusively accessible to the administrator account (
            <strong>{ADMIN_EMAIL}</strong>). Your current sign-in is{" "}
            <strong>{user?.email || "unauthenticated"}</strong>.
          </p>
          <div className="flex gap-3 mt-4">
            <a className="collab-button collab-button-dark" href="/collaborate">Go to Shared Drafts</a>
            <a className="collab-button collab-button-outline" href="/">Return Home</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="collab-page">
      <header className="collab-topbar">
        <a className="collab-wordmark" href="/">Explain Bytes</a>
        <nav className="collab-topnav">
          <a href="/docs">Library</a>
          <a href="/collaborate">Shared drafts</a>
          <span className="collab-nav-current">Admin review</span>
        </nav>
        <div className="collab-account">
          <span className="collab-avatar" style={{ background: "#e66b5b", color: "#fff" }}>
            <ShieldCheck size={14} />
          </span>
          <span>ADMIN · {user?.email}</span>
        </div>
      </header>

      <section className="collab-shelf-hero" style={{ background: "#111b17" }}>
        <div>
          <p className="collab-eyebrow">
            EDITORIAL DESK <span> / CURATION & PUBLISHING</span>
          </p>
          <h1>
            Review & Push<br />
            <em>community manuscripts.</em>
          </h1>
          <p className="collab-lede">
            Manuscripts published by authors appear here for editorial review. Approved
            chapters are automatically written directly into the content directory and pushed to
            the GitHub repository.
          </p>
        </div>
        <div className="collab-hero-note">
          <span className="collab-note-index">GATEWAY / GITHUB PIPELINE</span>
          <strong>{documents.length} Pending</strong>
          <p>Review the markdown, check category structure, then approve to trigger git sync.</p>
          <div className="collab-note-mark">
            <GitBranch size={15} /> BRANCH: MAIN · ORIGIN
          </div>
        </div>
      </section>

      <section className="collab-shelf-main">
        <div className="collab-shelf-actions">
          <div>
            <p className="collab-eyebrow">MANUSCRIPTS AWAITING REVIEW</p>
            <h2>
              Published Queue <span>{documents.length.toString().padStart(2, "0")}</span>
            </h2>
          </div>
          <div className="collab-shelf-buttons">
            <button
              className="collab-button collab-button-outline"
              onClick={loadPublishedDocuments}
              disabled={loading}
            >
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh queue
            </button>
            <a className="collab-button collab-button-dark" href="/collaborate">
              <Users size={14} /> Author shelf
            </a>
          </div>
        </div>

        {loading ? (
          <div className="collab-loading">
            <LoaderCircle className="animate-spin" size={20} /> Loading published manuscripts…
          </div>
        ) : error ? (
          <div className="collab-message-error">{error}</div>
        ) : documents.length === 0 ? (
          <div className="collab-empty">
            <CheckCircle2 size={36} className="text-emerald-600 mb-2" />
            <h3>All caught up!</h3>
            <p>There are no published manuscripts currently awaiting editorial review.</p>
          </div>
        ) : (
          <div className="collab-document-grid">
            {documents.map((doc, idx) => (
              <article className="collab-document-card" key={doc.id}>
                <div className="collab-card-top">
                  <span className="collab-card-number">#{String(idx + 1).padStart(2, "0")}</span>
                  <span className="collab-status is-published">Published · Pending Review</span>
                </div>
                <h3 className="collab-card-title cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                  {doc.title}
                </h3>
                <p className="collab-card-category">
                  {doc.category} <span> / </span> {doc.section}
                </p>
                <p className="collab-card-excerpt">
                  {doc.content.replace(/^#+\s+/gm, "").replace(/[`*_>#]/g, "").slice(0, 140) ||
                    "No excerpt available."}
                </p>
                <div className="collab-card-meta">
                  <span>BY {doc.authorEmail}</span>
                  <span>{dateLabel(doc.publishedAt)}</span>
                </div>

                <div className="collab-card-actions" style={{ marginTop: "1rem", borderTop: "1px solid var(--collab-line)", paddingTop: "0.8rem" }}>
                  <button
                    className="collab-button collab-button-outline"
                    style={{ minHeight: "31px", fontSize: "8px", minWidth:"54px", paddingLeft: "5px",paddingRight:"5px" }}
                    onClick={() => setSelectedDoc(doc)}
                  >
                     Inspect
                  </button>
                  <div className="collab-card-action-buttons">
                    <button
                      className="collab-button collab-button-coral"
                      style={{ minHeight: "31px", padding: "0 0.6rem", fontSize: "8px" }}
                      disabled={processingId === doc.id}
                      onClick={() => approveDocument(doc)}
                      title="Approve & Push to GitHub"
                    >
                      {processingId === doc.id ? (
                        <LoaderCircle size={13} className="animate-spin" />
                      ) : (
                        <UploadCloud size={13} />
                      )}
                       
                    </button>
                    <button
                      className="collab-button collab-button-danger"
                      style={{ minHeight: "31px", padding: "0 0.5rem" }}
                      disabled={processingId === doc.id}
                      onClick={() => rejectDocument(doc)}
                      title="Reject manuscript"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Inspect / Preview Modal */}
      {selectedDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedDoc(null)}
        >
          <div
            className="bg-[#fbfaf6] dark:bg-[#151d1a] border border-[var(--collab-line)] w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl rounded-sm overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[var(--collab-line)] p-4 bg-white/70 dark:bg-black/20">
              <div>
                <p className="text-[10px] font-mono tracking-wider text-[var(--collab-coral)] uppercase">
                  {selectedDoc.section} / {selectedDoc.category}
                </p>
                <h2 className="text-xl font-serif text-[var(--collab-ink)]">{selectedDoc.title}</h2>
                <p className="text-xs text-[var(--collab-muted)]">
                  Author: <strong>{selectedDoc.authorName}</strong> ({selectedDoc.authorEmail}) · Published {dateLabel(selectedDoc.publishedAt)}
                </p>
              </div>
              <button
                className="collab-icon-button"
                onClick={() => setSelectedDoc(null)}
                aria-label="Close preview"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--collab-line)] bg-black/5 dark:bg-white/5">
              <div className="flex gap-2">
                <button
                  className={`px-3 py-1 text-xs font-mono rounded ${
                    previewMode === "rendered"
                      ? "bg-[var(--collab-ink)] text-white"
                      : "text-[var(--collab-muted)] hover:text-[var(--collab-ink)]"
                  }`}
                  onClick={() => setPreviewMode("rendered")}
                >
                  Formatted Preview
                </button>
                <button
                  className={`px-3 py-1 text-xs font-mono rounded ${
                    previewMode === "raw"
                      ? "bg-[var(--collab-ink)] text-white"
                      : "text-[var(--collab-muted)] hover:text-[var(--collab-ink)]"
                  }`}
                  onClick={() => setPreviewMode("raw")}
                >
                  Raw MDX
                </button>
              </div>
              
            </div>

            {/* Modal Content Scroll */}
            <div className="flex-1 overflow-auto p-6">
              {previewMode === "rendered" ? (
                <div className="collab-preview-content prose max-w-none">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{selectedDoc.content}</ReactMarkdown>
                </div>
              ) : (
                <pre className="p-4 bg-[#18221f] text-[#f3f0e8] font-mono text-xs rounded overflow-auto whitespace-pre-wrap">
                  {selectedDoc.content}
                </pre>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="flex items-center justify-between p-4 border-t border-[var(--collab-line)] bg-white/70 dark:bg-black/20">
              <span className="text-xs font-mono text-[var(--collab-muted)]">
                DOC ID: {selectedDoc.id}
              </span>
              <div className="flex gap-3">
                <button
                  className="collab-button collab-button-danger"
                  disabled={processingId === selectedDoc.id}
                  onClick={() => rejectDocument(selectedDoc)}
                >
                  <XCircle size={14} /> Reject
                </button>
                <button
                  className="collab-button collab-button-coral"
                  disabled={processingId === selectedDoc.id}
                  onClick={() => approveDocument(selectedDoc)}
                >
                  {processingId === selectedDoc.id ? (
                    <LoaderCircle size={14} className="animate-spin" />
                  ) : (
                    <UploadCloud size={14} />
                  )}
                  <span>Approve & Push to GitHub</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}


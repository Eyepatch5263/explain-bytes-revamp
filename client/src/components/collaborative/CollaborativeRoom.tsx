import { useCallback, useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { MonacoBinding } from "y-monaco";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { Collaboration } from "@tiptap/extension-collaboration";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import { Markdown } from "@tiptap/markdown";
import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Bold, Check, Code2, Copy, GitFork, Heading2, Italic, LoaderCircle, Share2, Save, ShieldCheck, Users } from "lucide-react";
import { toast } from "sonner";
import type { CollaborativeDocument } from "@/lib/collaborative-api";

const cursorColors = ["#e66b5b", "#4072f6", "#4c8b72", "#b6783c", "#8c63b8"];
type EditorMode = "source" | "rich";
type EditorTheme = "paper" | "midnight" | "contrast";
type Requester = <T,>(path: string, init?: RequestInit) => Promise<T>;

type Props = {
  document: CollaborativeDocument;
  request: Requester;
  getToken: () => Promise<string>;
  currentUser: { id: string; name: string; email: string };
  onBack: () => void;
  onDocumentChange: (document: CollaborativeDocument) => void;
  onFork: (document: CollaborativeDocument) => void;
  onShare: () => void;
};

function userColor(id: string) {
  let hash = 0;
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return cursorColors[hash % cursorColors.length];
}

function setSharedText(sharedText: Y.Text, nextValue: string) {
  const current = sharedText.toString();
  if (current === nextValue) return;
  let prefix = 0;
  const sharedLimit = Math.min(current.length, nextValue.length);
  while (prefix < sharedLimit && current[prefix] === nextValue[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < current.length - prefix &&
    suffix < nextValue.length - prefix &&
    current[current.length - 1 - suffix] === nextValue[nextValue.length - 1 - suffix]
  ) suffix += 1;
  const removeCount = current.length - prefix - suffix;
  const insertText = nextValue.slice(prefix, nextValue.length - suffix);
  sharedText.doc?.transact(() => {
    if (removeCount) sharedText.delete(prefix, removeCount);
    if (insertText) sharedText.insert(prefix, insertText);
  });
}

function TipTapSurface({
  document: ydoc,
  provider,
  mode,
  synced,
  isPublished,
  currentUser,
}: {
  document: Y.Doc;
  provider: HocuspocusProvider;
  mode: EditorMode;
  synced: boolean;
  isPublished: boolean;
  currentUser: Props["currentUser"];
}) {
  const modeRef = useRef(mode);
  const applyingSource = useRef(false);
  const source = ydoc.getText("markdown");
  modeRef.current = mode;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ undoRedo: false }),
      Markdown.configure({ markedOptions: { gfm: true } }),
      Collaboration.configure({ document: ydoc, field: "richText" }),
      CollaborationCaret.configure({
        provider,
        user: { id: currentUser.id, name: currentUser.name, color: userColor(currentUser.id) },
        render: (user) => {
          const caret = document.createElement("span");
          caret.className = "collab-rich-caret";
          caret.style.borderColor = String(user.color ?? "#e66b5b");
          caret.setAttribute("aria-label", `${String(user.name ?? "Collaborator")} cursor`);
          const label = document.createElement("span");
          label.className = "collab-rich-caret-label";
          label.style.backgroundColor = String(user.color ?? "#e66b5b");
          label.textContent = String(user.name ?? "Collaborator");
          caret.append(label);
          return caret;
        },
        selectionRender: (user) => ({ style: `background-color: ${String(user.color ?? "#e66b5b")}2c` }),
      }),
    ],
    editable: mode === "rich" && !isPublished,
    editorProps: { attributes: { class: "collab-tiptap-content", "aria-label": "Collaborative rich text editor" } },
    onUpdate: ({ editor: currentEditor }) => {
      if (modeRef.current !== "rich" || applyingSource.current) return;
      setSharedText(source, currentEditor.getMarkdown());
    },
  }, [ydoc, provider]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(mode === "rich" && !isPublished);
  }, [editor, isPublished, mode]);

  useEffect(() => {
    if (!editor || !synced) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const applySource = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const markdown = source.toString();
        if (markdown === editor.getMarkdown()) return;
        applyingSource.current = true;
        editor.commands.setContent(markdown, { contentType: "markdown", emitUpdate: false });
        setTimeout(() => { applyingSource.current = false; }, 0);
      }, 120);
    };
    source.observe(applySource);
    applySource();
    return () => {
      if (timer) clearTimeout(timer);
      source.unobserve(applySource);
    };
  }, [editor, source, synced]);

  if (!editor) return <div className="collab-editor-loading"><LoaderCircle className="animate-spin" size={17} /> Warming the rich-text editor…</div>;
  return (
    <div className="collab-rich-surface">
      <div className="collab-format-toolbar" role="toolbar" aria-label="Text formatting">
        <button type="button" aria-label="Bold" title="Bold" disabled={isPublished} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={15} /></button>
        <button type="button" aria-label="Italic" title="Italic" disabled={isPublished} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={15} /></button>
        <button type="button" aria-label="Heading" title="Heading" disabled={isPublished} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></button>
        <button type="button" aria-label="Code block" title="Code block" disabled={isPublished} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 size={15} /></button>
        <span className="collab-toolbar-caption">TIPTAP · YJS COLLABORATION</span>
      </div>
      <EditorContent editor={editor} />
      {mode === "rich" && <div className="collab-rich-hint">The room uses one shared editor mode, so everyone can edit the same representation together.</div>}
    </div>
  );
}

function MonacoSurface({
  ydoc,
  provider,
  theme,
  readOnly,
}: {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  theme: EditorTheme;
  readOnly: boolean;
}) {
  const binding = useRef<MonacoBinding | null>(null);
  const themeName = theme === "paper" ? "vs" : theme === "midnight" ? "vs-dark" : "hc-black";
  const onMount = useCallback((monacoEditor: Parameters<NonNullable<React.ComponentProps<typeof Editor>["onMount"]>>[0]) => {
    const model = monacoEditor.getModel();
    if (!model) return;
    binding.current?.destroy();
    binding.current = new MonacoBinding(
      ydoc.getText("markdown"),
      model,
      new Set([monacoEditor]),
      provider.awareness ?? undefined,
    );
  }, [provider, ydoc]);
  useEffect(() => () => binding.current?.destroy(), []);

  return <Editor
    height="100%"
    defaultLanguage="markdown"
    theme={themeName}
    onMount={onMount}
    options={{
      automaticLayout: true,
      readOnly,
      minimap: { enabled: false },
      fontFamily: '"DM Mono", monospace',
      fontSize: 12,
      lineHeight: 22,
      lineNumbers: "on",
      wordWrap: "on",
      scrollBeyondLastLine: false,
      padding: { top: 18, bottom: 20 },
      renderLineHighlight: "gutter",
      tabSize: 2,
      ariaLabel: "Collaborative MDX source editor",
    }}
  />;
}

export default function CollaborativeRoom({
  document: initialDocument,
  request,
  getToken,
  currentUser,
  onBack,
  onDocumentChange,
  onFork,
  onShare,
}: Props) {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<HocuspocusProvider | null>(null);
  const [status, setStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [synced, setSynced] = useState(false);
  const [connectionError, setConnectionError] = useState("");
  const [participants, setParticipants] = useState<Array<{ id: string; name: string; color: string }>>([]);
  const [mode, setMode] = useState<EditorMode>("source");
  const [theme, setTheme] = useState<EditorTheme>("paper");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [forking, setForking] = useState(false);

  useEffect(() => {
    let disposed = false;
    const sharedDoc = new Y.Doc();
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const roomProvider = new HocuspocusProvider({
      url: `${wsProtocol}//${window.location.host}/collab`,
      name: initialDocument.id,
      document: sharedDoc,
      token: getToken,
    });
    const color = userColor(currentUser.id);
    roomProvider.awareness?.setLocalStateField("user", { id: currentUser.id, name: currentUser.name, color });
    setYdoc(sharedDoc);
    setProvider(roomProvider);
    setStatus("connecting");
    setSynced(false);
    setConnectionError("");

    const onStatus = ({ status: nextStatus }: { status: string }) => {
      if (!disposed) setStatus(nextStatus === "connected" ? "connected" : "connecting");
    };
    const onSynced = () => {
      if (!disposed) setSynced(true);
    };
    const onFailed = ({ reason }: { reason?: string }) => {
      if (disposed) return;
      const message = reason || "The room could not be joined.";
      setConnectionError(message);
      setStatus("disconnected");
    };
    const onClose = () => { if (!disposed) setStatus("disconnected"); };
    const awareness = roomProvider.awareness;
    const updateParticipants = () => {
      if (!awareness || disposed) return;
      const users = new Map<string, { id: string; name: string; color: string }>();
      for (const state of Array.from(awareness.getStates().values())) {
        const person = state.user as { id?: string; name?: string; color?: string } | undefined;
        if (person?.id) users.set(person.id, { id: person.id, name: person.name ?? "Collaborator", color: person.color ?? "#4072f6" });
      }
      setParticipants(Array.from(users.values()).slice(0, 5));
    };
    const modeMap = sharedDoc.getMap<string>("roomSettings");
    const updateMode = () => {
      if (disposed) return;
      const next = modeMap.get("editorMode");
      if (next === "source" || next === "rich") setMode(next);
    };
    modeMap.observe(updateMode);
    awareness?.on("change", updateParticipants);
    roomProvider.on("status", onStatus);
    roomProvider.on("synced", onSynced);
    roomProvider.on("authenticationFailed", onFailed);
    roomProvider.on("close", onClose);
    updateParticipants();
    if (roomProvider.isSynced) onSynced();
    roomProvider.on("synced", () => {
      if (!modeMap.has("editorMode")) modeMap.set("editorMode", "source");
      updateMode();
    });

    return () => {
      disposed = true;
      modeMap.unobserve(updateMode);
      awareness?.off("change", updateParticipants);
      roomProvider.destroy();
      sharedDoc.destroy();
    };
  }, [currentUser.id, currentUser.name, getToken, initialDocument.id]);

  const modeMap = ydoc?.getMap<string>("roomSettings");
  const setRoomMode = (next: EditorMode) => {
    modeMap?.set("editorMode", next);
    setMode(next);
  };

  const save = async () => {
    if (!provider || !ydoc || saving) return;
    setSaving(true);
    try {
      await request<{ savedAt: string }>(`/documents/${initialDocument.id}/save`, {
        method: "POST",
        body: JSON.stringify({ content: ydoc.getText("markdown").toString() }),
      });
      toast.success("Saved to your Postgres document.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!initialDocument.isOwner || publishing) return;
    setPublishing(true);
    try {
      if (ydoc && provider?.isSynced) {
        await request(`/documents/${initialDocument.id}/save`, { method: "POST", body: JSON.stringify({ content: ydoc.getText("markdown").toString() }) });
      }
      const result = await request<{ document: CollaborativeDocument }>(`/documents/${initialDocument.id}/publish`, { method: "POST" });
      onDocumentChange(result.document);
      toast.success("Your original document is published.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be published.");
    } finally {
      setPublishing(false);
    }
  };

  const fork = async () => {
    if (forking) return;
    setForking(true);
    try {
      if (ydoc && provider?.isSynced) {
        await request(`/documents/${initialDocument.id}/save`, { method: "POST", body: JSON.stringify({ content: ydoc.getText("markdown").toString() }) });
      }
      const result = await request<{ document: CollaborativeDocument }>(`/documents/${initialDocument.id}/fork`, { method: "POST", body: JSON.stringify({}) });
      onFork(result.document);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The document could not be forked.");
    } finally {
      setForking(false);
    }
  };

  const statusLabel = connectionError ? "Room access needs attention" : status === "connected" && synced ? "Live · Postgres autosave on" : status === "disconnected" ? "Connection closed" : "Joining room…";
  const uniqueParticipants = participants.length;

  return (
    <main className="collab-page collab-room-page">
      <header className="collab-topbar">
        <a className="collab-wordmark" href="/">Explain Bytes</a>
        <button className="collab-back" onClick={onBack}><ArrowLeft size={14} /> My shelf</button>
        <div className="collab-room-top-actions">
          <div className={`collab-connection ${status === "connected" && synced ? "is-live" : ""}`}><span />{statusLabel}</div>
          <button className="collab-button collab-button-outline" onClick={onShare}><Share2 size={14} /> Share room</button>
      <button className="collab-button collab-button-dark" onClick={save} disabled={saving || !synced || initialDocument.status === "published"}>{saving ? <LoaderCircle className="animate-spin" size={14} /> : <Save size={14} />} Save now</button>
        </div>
      </header>
      <section className="collab-room-heading">
        <div>
          <p className="collab-eyebrow">{initialDocument.section.toUpperCase()} <span> / </span>{initialDocument.category.toUpperCase()}</p>
          <h1>{initialDocument.title}</h1>
          <div className="collab-document-trail"><span>DOC {initialDocument.id.slice(0, 8).toUpperCase()}</span><span className={`collab-status ${initialDocument.status === "published" ? "is-published" : ""}`}>{initialDocument.status}</span>{initialDocument.forkedFromDocumentId && <span className="collab-fork-lineage"><GitFork size={12} /> Forked from {initialDocument.forkedFromDocumentId.slice(0, 8)}</span>}</div>
        </div>
        <div className="collab-room-ownership">
          <div className="collab-presence" aria-label={`${uniqueParticipants} of 5 room members`}>{participants.map((person) => <span key={person.id} title={person.name} style={{ backgroundColor: person.color }}>{person.name.slice(0, 1).toUpperCase()}</span>)}{uniqueParticipants < 5 && <span className="collab-presence-empty">+</span>}<small>{uniqueParticipants}/5</small></div>
          <p>{initialDocument.isOwner ? <><ShieldCheck size={14} /> Your original · only you can publish</> : <><Users size={14} /> Shared draft · fork to publish your own</>}</p>
          <div className="collab-owner-actions">{initialDocument.isOwner && initialDocument.status !== "published" && <button className="collab-button collab-button-coral" onClick={publish} disabled={publishing || !synced}>{publishing ? <LoaderCircle className="animate-spin" size={14} /> : <Check size={14} />} Publish original</button>}<button className="collab-button collab-button-outline" onClick={fork} disabled={forking || !synced}>{forking ? <LoaderCircle className="animate-spin" size={14} /> : <GitFork size={14} />} Fork document</button></div>
        </div>
      </section>
      {connectionError && <div className="collab-room-alert"><span>{connectionError}</span><span>{connectionError.toLowerCase().includes("full") ? "Ask someone to leave before joining; rooms are limited to five people." : "Refresh the room after checking your sign-in."}</span></div>}
      <section className="collab-workspace">
        <div className="collab-workspace-toolbar">
          <div className="collab-editor-switch" role="tablist" aria-label="Shared editor mode">
            <button role="tab" aria-selected={mode === "source"} className={mode === "source" ? "is-active" : ""} onClick={() => setRoomMode("source")}><Code2 size={14} /> MDX source <span>MONACO</span></button>
            <button role="tab" aria-selected={mode === "rich"} className={mode === "rich" ? "is-active" : ""} onClick={() => setRoomMode("rich")}><Bold size={14} /> Rich text <span>TIPTAP</span></button>
          </div>
          <div className="collab-workspace-meta"><span className="collab-room-save-hint">YJS LIVE · AUTOSAVES TO POSTGRES</span><div className="collab-theme-picker" aria-label="Monaco theme">
            <span>MONACO THEME</span><button className={theme === "paper" ? "is-active" : ""} onClick={() => setTheme("paper")} aria-label="Paper theme" title="Paper">P</button><button className={theme === "midnight" ? "is-active" : ""} onClick={() => setTheme("midnight")} aria-label="Midnight theme" title="Midnight">M</button><button className={theme === "contrast" ? "is-active" : ""} onClick={() => setTheme("contrast")} aria-label="High contrast theme" title="High contrast">H</button>
          </div></div>
        </div>
        <div className="collab-panes">
          <div className={`collab-editor-pane ${mode === "source" ? "is-visible" : "is-hidden"}`} aria-hidden={mode !== "source"}>
            <div className="collab-pane-head"><span><Code2 size={13} /> SOURCE.MDX</span><span>Y.TEXT · SHARED</span></div>
            {provider && ydoc ? <MonacoSurface key={initialDocument.id} ydoc={ydoc} provider={provider} theme={theme} readOnly={initialDocument.status === "published"} /> : <div className="collab-editor-loading"><LoaderCircle className="animate-spin" size={17} /> Opening the live source…</div>}
          </div>
          <div className={`collab-editor-pane ${mode === "rich" ? "is-visible" : "is-hidden"}`} aria-hidden={mode !== "rich"}>
            <div className="collab-pane-head"><span><Bold size={13} /> MANUSCRIPT</span><span>TIPTAP · XML FRAGMENT</span></div>
            {provider && ydoc ? <TipTapSurface document={ydoc} provider={provider} mode={mode} synced={synced} isPublished={initialDocument.status === "published"} currentUser={currentUser} /> : <div className="collab-editor-loading"><LoaderCircle className="animate-spin" size={17} /> Opening the rich-text editor…</div>}
          </div>
          <div className="collab-preview-pane">
            <div className="collab-pane-head"><span><Copy size={13} /> RENDERED PAGE</span><span>SAFE MARKDOWN PREVIEW</span></div>
            <div className="collab-preview-scroll">
              <article className="collab-preview-content">
                <div className="collab-preview-overline">EXPLAIN BYTES <span>/</span> {initialDocument.section.toUpperCase()}</div>
                {ydoc ? <LivePreview ydoc={ydoc} /> : <ReactMarkdown remarkPlugins={[remarkGfm]}>{initialDocument.content}</ReactMarkdown>}
                <div className="collab-preview-foot">END OF DRAFT <span>·</span> {initialDocument.category}</div>
              </article>
            </div>
          </div>
        </div>
        <div className="collab-workspace-foot"><span><Users size={13} /> {uniqueParticipants === 1 ? "You are the only one here" : `${uniqueParticipants} collaborators in the room`}</span><span>Only the document owner can publish the original. Everyone else can fork it.</span></div>
      </section>
      <footer className="collab-footer"><a href="/">Explain Bytes</a><span>Draft with care. Share with context.</span><span>ROOM CAP 05 · OWNER-LED PUBLISHING</span></footer>
    </main>
  );
}

function LivePreview({ ydoc }: { ydoc: Y.Doc }) {
  const [markdown, setMarkdown] = useState(() => ydoc.getText("markdown").toString());
  useEffect(() => {
    const source = ydoc.getText("markdown");
    const update = () => setMarkdown(source.toString());
    source.observe(update);
    update();
    return () => source.unobserve(update);
  }, [ydoc]);
  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>;
}

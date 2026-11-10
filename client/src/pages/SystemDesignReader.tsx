import { Suspense, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ExternalLink, LoaderCircle, LogOut, Menu, X, Zap } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { ChapterAudioPlayer } from "@/components/docs/ChapterAudioPlayer";
import { systemDesignMdxComponents } from "@/components/docs/SystemDesignMdxComponents";
import { useReadingProgress } from "@/hooks/useReadingProgress";
import { getChapterHeadings, getSystemDesignCategories, getSystemDesignDoc, prefetchChapter, simulationSlugs, systemDesignDocs } from "@/lib/systemDesignDocs";
import "./systemDesignReaderWide.css";
import { lazy } from "react";
import { Link } from "wouter";

type SystemDesignReaderProps = {
  slug?: string;
  view?: string;
};

const simulationComponents = {
  dns: lazy(() =>
    import("@/components/simulations/system-design/dns/dns-simulation-wrapper")
  ),
  database: lazy(() =>
    import("@/components/simulations/system-design/database/database-simulation-wrapper")
  ),
  "load-balancing": lazy(() =>
    import("@/components/simulations/system-design/load-balancing/simulation-dashboard")
  ),
};

const Simulation = ({ slug }: { slug: string }) => {
  const Component =
    simulationComponents[slug as keyof typeof simulationComponents];

  if (!Component) return null;

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 gap-2">
          <LoaderCircle className="animate-spin" size={18} />
          Loading simulation...
        </div>
      }
    >
      <Component />
    </Suspense>
  );
};

const AuthActions = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <button
      type="button"
      onClick={() => logout()}
      title="Log out"
      className="inline-flex items-center gap-1"
    >
      <LogOut size={13} />
      <span className="hidden md:inline">Log out</span>
    </button>
  );
};

export default function SystemDesignReader({ slug = "introduction", view }: SystemDesignReaderProps) {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const articleRef = useRef<HTMLElement | null>(null);
  const doc = getSystemDesignDoc(slug) ?? systemDesignDocs[0];
  const categories = getSystemDesignCategories();
  const headings = useMemo(() => getChapterHeadings(doc.source), [doc.source]);
  const chapterIndex = systemDesignDocs.findIndex((item) => item.slug === doc.slug);
  const previous = chapterIndex > 0 ? systemDesignDocs[chapterIndex - 1] : null;
  const next = chapterIndex < systemDesignDocs.length - 1 ? systemDesignDocs[chapterIndex + 1] : null;
  const isSimulation = view === "simulation" && simulationSlugs.has(doc.slug);
  const MdxContent = doc.Component ?? (() => null);
  const { percent, completed } = useReadingProgress({ slug: doc.slug, containerRef: articleRef });

  const chapterRail = (
    <nav className="flashdocs-reader-rail" aria-label="System Design chapter navigation">
      <div className="flashdocs-rail-title"><span>SYSD / {String(chapterIndex + 1).padStart(2, "0")}</span><a href="/docs">All topics <ArrowRight size={13} /></a></div>
      {categories.map(([category, docs]) => (
        <section key={category} className="flashdocs-rail-group">
          <h2>{category}</h2>
          {docs.map((item) => (
            <Link
              key={item.slug}
              href={`/docs/system-design/${item.slug}`}
              className={item.slug === doc.slug && !isSimulation ? "is-active" : ""}
              onMouseEnter={() => prefetchChapter(item.slug)}
              onClick={() => setSidebarOpen(false)}
            >
              <span>{String(item.order).padStart(2, "0")}</span>{item.title}
            </Link>
          ))}
        </section>
      ))}
    </nav>
  );

  return (
    <main className="flashdocs-reader-page">
      <header className="flashdocs-reader-topbar">
        <a className="flashdocs-wordmark" href="/"><i /><i /><i /> Explain Bytes</a>
        <div className="flashdocs-reader-context"><BookOpen size={15} /> Flash docs <span>/</span> System Design</div>
        <div className="flashdocs-reader-actions">
          <Link href="/flashcards">Practice</Link>
          <AuthActions/>
          <button type="button" onClick={() => setSidebarOpen(true)}><Menu size={17} /> Chapters</button>
        </div>
      </header>

      <div className="flashdocs-reader-layout">
        <aside className="flashdocs-reader-sidebar">{chapterRail}</aside>
        <div className={sidebarOpen ? "flashdocs-mobile-rail is-open" : "flashdocs-mobile-rail"}>
          <button className="flashdocs-mobile-rail-close" type="button" onClick={() => setSidebarOpen(false)}><X size={18} /> Close chapter list</button>
          {chapterRail}
        </div>

        <article className="flashdocs-article" ref={articleRef}>
          <Link className="flashdocs-breadcrumb" href="/docs"><ArrowLeft size={15} /> Flash Docs / System Design</Link>
          {isSimulation ? (
            <>
              <header className="flashdocs-article-heading flashdocs-simulation-heading">
                <p className="flashdocs-kicker">{doc.category.toUpperCase()} / INTERACTIVE SANDBOX</p>
                <h1>{doc.title}<br /><em>in motion.</em></h1>
                <p>Interact with the original Explain Bytes visual simulation, then return to the complete chapter when you are ready.</p>
                <Link className="flashdocs-outline-button" href={`/docs/system-design/${doc.slug}`}><ArrowLeft size={15} /> Back to chapter</Link>
              </header>
              <div className="flashdocs-simulation-shell">
                <Simulation slug={doc.slug} /></div>
            </>
          ) : (
            <>
              <header className="flashdocs-article-heading">
                <p className="flashdocs-kicker">{doc.category.toUpperCase()} / CHAPTER {String(chapterIndex + 1).padStart(2, "0")}</p>
                <h1>{doc.title}</h1>
                <p>{doc.description}</p>
                <div className="flashdocs-chapter-tools">
                  {simulationSlugs.has(doc.slug) && <Link href={`/docs/system-design/${doc.slug}/simulation`}><Zap size={15} /> Open simulation <ExternalLink size={13} /></Link>}
                  <ChapterAudioPlayer slug={doc.slug} title={doc.title} />
                </div>
                <div className="flashdocs-reading-progress" aria-label={`${percent}% of this chapter read`}>
                  <div className="flashdocs-reading-progress-meta"><span>{completed ? "Chapter complete" : percent ? `${percent}% read` : "Start reading"}</span><span>{completed ? "✓ saved" : "Progress saves automatically"}</span></div>
                  <div className="flashdocs-reading-progress-track"><span style={{ width: `${percent}%` }} /></div>
                </div>
              </header>

              <div className="flashdocs-article-rule" />
              <div className="flashdocs-mdx-content">
                <Suspense
                  fallback={
                    <div className="flashdocs-chapter-loading flex items-center justify-center gap-2 py-20 font-mono text-xs opacity-60">
                      <LoaderCircle className="animate-spin" size={16} />
                      Opening chapter…
                    </div>
                  }
                >
                  <MdxContent components={systemDesignMdxComponents} />
                </Suspense>
              </div>

              <footer className="flashdocs-chapter-pagination">
                {previous ? (
                  <Link
                    href={`/docs/system-design/${previous.slug}`}
                    onMouseEnter={() => prefetchChapter(previous.slug)}
                  >
                    <span><ArrowLeft size={16} /> Previous chapter</span>
                    <b>{previous.title}</b>
                  </Link>
                ) : <span />}
                {next ? (
                  <Link
                    href={`/docs/system-design/${next.slug}`}
                    onMouseEnter={() => prefetchChapter(next.slug)}
                  >
                    <span>Next chapter <ArrowRight size={16} /></span>
                    <b>{next.title}</b>
                  </Link>
                ) : <span />}
              </footer>
            </>
          )}
        </article>

        {!isSimulation && <aside className="flashdocs-toc"><p>ON THIS PAGE</p>{headings.map((heading) => <Link key={`${heading.id}-${heading.title}`} className={`level-${heading.level}`} href={`#${heading.id}`}>{heading.title}</Link>)}</aside>}
      </div>
    </main>
  );
}

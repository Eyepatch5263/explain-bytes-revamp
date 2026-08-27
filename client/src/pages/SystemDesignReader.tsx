import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, ChevronDown, ExternalLink, Menu, Network, PanelLeftClose, X, Zap } from "lucide-react";
import DatabaseSimulationWrapper from "@/components/simulations/system-design/database/database-simulation-wrapper";
import DnsSimulationWrapper from "@/components/simulations/system-design/dns/dns-simulation-wrapper";
import SimulationDashboard from "@/components/simulations/system-design/load-balancing/simulation-dashboard";
import { ChapterAudioPlayer } from "@/components/docs/ChapterAudioPlayer";
import { systemDesignMdxComponents } from "@/components/docs/SystemDesignMdxComponents";
import { getChapterHeadings, getSystemDesignCategories, getSystemDesignDoc, simulationSlugs, systemDesignDocs } from "@/lib/systemDesignDocs";

type SystemDesignReaderProps = {
  slug?: string;
  view?: string;
};

const Simulation = ({ slug }: { slug: string }) => {
  if (slug === "dns") return <DnsSimulationWrapper />;
  if (slug === "database") return <DatabaseSimulationWrapper />;
  if (slug === "load-balancing") return <SimulationDashboard />;
  return null;
};

export default function SystemDesignReader({ slug = "introduction", view }: SystemDesignReaderProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const doc = getSystemDesignDoc(slug) ?? systemDesignDocs[0];
  const categories = getSystemDesignCategories();
  const headings = useMemo(() => getChapterHeadings(doc.source), [doc.source]);
  const chapterIndex = systemDesignDocs.findIndex((item) => item.slug === doc.slug);
  const previous = chapterIndex > 0 ? systemDesignDocs[chapterIndex - 1] : null;
  const next = chapterIndex < systemDesignDocs.length - 1 ? systemDesignDocs[chapterIndex + 1] : null;
  const isSimulation = view === "simulation" && simulationSlugs.has(doc.slug);
  const MdxContent = doc.Component;

  const chapterRail = (
    <nav className="flashdocs-reader-rail" aria-label="System Design chapter navigation">
      <div className="flashdocs-rail-title"><span>SYSD / {String(chapterIndex + 1).padStart(2, "0")}</span><a href="/docs">All topics <ArrowRight size={13} /></a></div>
      {categories.map(([category, docs]) => (
        <section key={category} className="flashdocs-rail-group">
          <h2>{category}</h2>
          {docs.map((item) => (
            <a key={item.slug} href={`/docs/system-design/${item.slug}`} className={item.slug === doc.slug && !isSimulation ? "is-active" : ""} onClick={() => setSidebarOpen(false)}>
              <span>{String(item.order).padStart(2, "0")}</span>{item.title}
            </a>
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
        <div className="flashdocs-reader-actions"><a href="/flashcards">Practice</a><button type="button" onClick={() => setSidebarOpen(true)}><Menu size={17} /> Chapters</button></div>
      </header>

      <div className="flashdocs-reader-layout">
        <aside className="flashdocs-reader-sidebar">{chapterRail}</aside>
        <div className={sidebarOpen ? "flashdocs-mobile-rail is-open" : "flashdocs-mobile-rail"}>
          <button className="flashdocs-mobile-rail-close" type="button" onClick={() => setSidebarOpen(false)}><X size={18} /> Close chapter list</button>
          {chapterRail}
        </div>

        <article className="flashdocs-article">
          <a className="flashdocs-breadcrumb" href="/docs"><ArrowLeft size={15} /> Flash Docs / System Design</a>
          {isSimulation ? (
            <>
              <header className="flashdocs-article-heading flashdocs-simulation-heading">
                <p className="flashdocs-kicker">{doc.category.toUpperCase()} / INTERACTIVE SANDBOX</p>
                <h1>{doc.title}<br /><em>in motion.</em></h1>
                <p>Interact with the original Explain Bytes visual simulation, then return to the complete chapter when you are ready.</p>
                <a className="flashdocs-outline-button" href={`/docs/system-design/${doc.slug}`}><ArrowLeft size={15} /> Back to chapter</a>
              </header>
              <div className="flashdocs-simulation-shell"><Simulation slug={doc.slug} /></div>
            </>
          ) : (
            <>
              <header className="flashdocs-article-heading">
                <p className="flashdocs-kicker">{doc.category.toUpperCase()} / CHAPTER {String(chapterIndex + 1).padStart(2, "0")}</p>
                <h1>{doc.title}</h1>
                <p>{doc.description}</p>
                <div className="flashdocs-chapter-tools">
                  {simulationSlugs.has(doc.slug) && <a href={`/docs/system-design/${doc.slug}/simulation`}><Zap size={15} /> Open simulation <ExternalLink size={13} /></a>}
                  <ChapterAudioPlayer slug={doc.slug} title={doc.title} />
                </div>
              </header>

              <div className="flashdocs-article-rule" />
              <div className="flashdocs-mdx-content"><MdxContent components={systemDesignMdxComponents} /></div>

              <footer className="flashdocs-chapter-pagination">
                {previous ? <a href={`/docs/system-design/${previous.slug}`}><span><ArrowLeft size={16} /> Previous chapter</span><b>{previous.title}</b></a> : <span />}
                {next ? <a href={`/docs/system-design/${next.slug}`}><span>Next chapter <ArrowRight size={16} /></span><b>{next.title}</b></a> : <span />}
              </footer>
            </>
          )}
        </article>

        {!isSimulation && <aside className="flashdocs-toc"><p>ON THIS PAGE</p>{headings.map((heading) => <a key={`${heading.id}-${heading.title}`} className={`level-${heading.level}`} href={`#${heading.id}`}>{heading.title}</a>)}</aside>}
      </div>
    </main>
  );
}

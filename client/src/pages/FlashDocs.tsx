import { ArrowRight, BookOpen, Code2, Network, PanelLeftOpen, Server, Sparkles } from "lucide-react";
import { getSystemDesignCategories, systemDesignDocs, systemDesignSourceMeta } from "@/lib/systemDesignDocs";

export default function FlashDocs() {
  const categories = getSystemDesignCategories();

  return (
    <main className="flashdocs-library-page">
      <header className="flashdocs-library-header">
        <a className="flashdocs-back" href="/">← Explain Bytes</a>
        <a className="flashdocs-library-flashcards" href="/flashcards">Flash cards <ArrowRight size={14} /></a>
      </header>

      <section className="flashdocs-library-hero">
        <div className="flashdocs-library-eyebrow"><PanelLeftOpen size={14} /> 01 / Flash docs</div>
        <div className="flashdocs-library-copy">
          <p className="flashdocs-kicker">{systemDesignSourceMeta.title.toUpperCase()} / CURATED READER</p>
          <h1>Read the systems<br /><em>behind the screen.</em></h1>
          <p>{systemDesignSourceMeta.description} Every chapter is preserved here in its complete MDX form: visual models, design trade-offs, formulas, code examples, and linked sandbox work.</p>
        </div>
        <div className="flashdocs-library-stats" aria-label="Reader highlights">
          <span><strong>{systemDesignDocs.length}</strong> chapters</span>
          <span><strong>03</strong> live sandboxes</span>
          <span><strong>MDX</strong> native reading</span>
        </div>
      </section>

      <section className="flashdocs-catalogue" aria-labelledby="catalogue-heading">
        <div className="flashdocs-catalogue-intro">
          <p className="flashdocs-kicker">CHAPTER INDEX / SYSTEM DESIGN</p>
          <h2 id="catalogue-heading">Follow the system<br />from first principles.</h2>
          <div className="flashdocs-catalogue-notes">
            <span><BookOpen size={15} /> Full prose</span>
            <span><Network size={15} /> Diagram-led</span>
            <span><Code2 size={15} /> Code included</span>
          </div>
        </div>
        <div className="flashdocs-category-grid">
          {categories.map(([category, docs], categoryIndex) => (
            <section className="flashdocs-category" key={category}>
              <div className="flashdocs-category-head"><span>{String(categoryIndex + 1).padStart(2, "0")}</span><h3>{category}</h3><span>{String(docs.length).padStart(2, "0")} chapters</span></div>
              <div className="flashdocs-chapter-list">
                {docs.map((doc) => (
                  <a href={`/docs/system-design/${doc.slug}`} className="flashdocs-chapter-link" key={doc.slug}>
                    <span className="flashdocs-chapter-number">{String(doc.order).padStart(2, "0")}</span>
                    <span><strong>{doc.title}</strong><small>{doc.description}</small></span>
                    <ArrowRight size={17} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>

      <aside className="flashdocs-library-note">
        <Server size={18} /><span><b>Reading is a system.</b> Open a chapter, trace the diagrams, then use each simulation to test how the architecture behaves under pressure.</span><Sparkles size={18} />
      </aside>
    </main>
  );
}

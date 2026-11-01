import { useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  Code2,
  Cpu,
  Database,
  Globe2,
  Layers3,
  Moon,
  Network,
  Search,
  Sun,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import {
  ENGINEERING_TERMS,
  FEATURED_TERM_IDS,
  TERM_CATEGORIES,
  type EngineeringTerm,
  type TermCategory,
} from "@shared/engineeringTerms";
import "./engineeringTerms.css";

type ActiveCategory = "All terms" | TermCategory;

const categoryIllustrations: Record<TermCategory, { icon: LucideIcon; note: string }> = {
  "System Design": { icon: Network, note: "Trade-offs across connected systems" },
  Programming: { icon: Code2, note: "The building blocks behind behavior" },
  "Web Development": { icon: Globe2, note: "Contracts, requests, and trust" },
  "Data Structures": { icon: Layers3, note: "Ways to organize information" },
  Databases: { icon: Database, note: "Storage, queries, and transactions" },
  DevOps: { icon: Layers3, note: "The pieces that keep systems moving" },
  "Operating Systems": { icon: Cpu, note: "Hardware, processes, and memory" },
  Networking: { icon: Globe2, note: "Names, routes, and protocols" },
};

const categoryNumber: Record<TermCategory, string> = {
  "System Design": "01",
  Programming: "02",
  "Web Development": "03",
  "Data Structures": "04",
  Databases: "05",
  DevOps: "06",
  "Operating Systems": "07",
  Networking: "08",
};

function getTermMatches(term: EngineeringTerm, query: string) {
  const haystack = [
    term.term,
    term.abbreviation ?? "",
    ...term.aliases,
    ...term.tags,
    term.category,
    term.summary,
    term.definition,
    term.context,
  ].join(" ").toLocaleLowerCase();
  return haystack.includes(query.toLocaleLowerCase());
}

function getInitialQuery() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("q") ?? "";
}

export default function EngineeringTerms() {
  const { theme, toggleTheme } = useTheme();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(getInitialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(query.trim());
  const [activeCategory, setActiveCategory] = useState<ActiveCategory>("All terms");
  const [selectedTerm, setSelectedTerm] = useState<EngineeringTerm | null>(null);
  const [copied, setCopied] = useState(false);
  const normalizedQuery = query.trim();

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(normalizedQuery), 240);
    return () => window.clearTimeout(timer);
  }, [normalizedQuery]);

  useEffect(() => {
    const url = new URL(window.location.href);
    if (normalizedQuery) url.searchParams.set("q", normalizedQuery);
    else url.searchParams.delete("q");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  }, [normalizedQuery]);

  useEffect(() => {
    const onShortcut = (event: WindowEventMap["keydown"]) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLocaleLowerCase() === "k") {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onShortcut);
    return () => window.removeEventListener("keydown", onShortcut);
  }, []);

  const category = activeCategory === "All terms" ? undefined : activeCategory;
  const search = trpc.terms.search.useQuery(
    {
      query: debouncedQuery,
      ...(category ? { category } : {}),
      limit: 16,
    },
    {
      enabled: debouncedQuery.length >= 2,
      staleTime: 60_000,
      retry: false,
    },
  );

  const starterResults = useMemo(() => {
    const filtered = ENGINEERING_TERMS.filter((term) => !category || term.category === category);
    if (!normalizedQuery) {
      return FEATURED_TERM_IDS
        .map((id) => filtered.find((term) => term.id === id))
        .filter((term): term is EngineeringTerm => Boolean(term));
    }
    return filtered.filter((term) => getTermMatches(term, normalizedQuery));
  }, [category, normalizedQuery]);

  const isSearching = debouncedQuery.length >= 2;
  const terms = isSearching ? (search.data?.items ?? starterResults) : starterResults;
  const total = isSearching ? (search.data?.total ?? starterResults.length) : starterResults.length;
  const isSettling = isSearching && debouncedQuery !== normalizedQuery;
  const searchUnavailable = Boolean(search.error) || search.data?.engine === "starter-index";
  const searchCacheLabel = search.data?.cache === "hit"
    ? "Redis cache hit"
    : search.data?.cache === "miss"
      ? "Redis cache miss"
      : "Redis reconnects automatically";

  const categoryCounts = useMemo(() => {
    return Object.fromEntries(
      TERM_CATEGORIES.map((item) => [item, ENGINEERING_TERMS.filter((term) => term.category === item).length]),
    ) as Record<TermCategory, number>;
  }, []);

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDebouncedQuery(normalizedQuery);
  };

  const handleSearchKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && query) {
      setQuery("");
      setActiveCategory("All terms");
    }
    if (event.key === "Enter" && terms[0]) {
      event.preventDefault();
      setSelectedTerm(terms[0]);
    }
  };

  const openTerm = (term: EngineeringTerm) => {
    setCopied(false);
    setSelectedTerm(term);
  };

  const copyDefinition = async () => {
    if (!selectedTerm) return;
    try {
      await navigator.clipboard.writeText(`${selectedTerm.term}\n${selectedTerm.definition}`);
      setCopied(true);
      toast.success("Definition copied.");
    } catch {
      toast.error("Clipboard access is unavailable in this browser.");
    }
  };

  const featuredTerm = ENGINEERING_TERMS.find((term) => term.id === "quorum")!;
  const shortcut = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform)
    ? "⌘ K"
    : "Ctrl K";

  return (
    <div className="terms-page dark-theme-page min-h-screen">
      <header className="terms-header dark-header">
        <div className="terms-shell terms-header-inner">
          <a className="terms-brand" href="/" aria-label="Explain Bytes home">
            <img src="/explainbytes-mark.webp" alt="" />
            <span>Explain Bytes</span>
          </a>
          <nav className="terms-nav" aria-label="Primary navigation">
            <a href="/docs">Library</a>
            <a href="/flashcards">Flash cards</a>
            <a href="/terms" aria-current="page">Terms</a>
          </nav>
          <div className="terms-header-actions">
            <button
              className="terms-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              type="button"
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <a className="terms-library-link" href="/docs">Open library <ArrowUpRight size={14} /></a>
          </div>
        </div>
      </header>

      <main>
        <section className="terms-hero">
          <div className="terms-shell terms-hero-grid">
            <div className="terms-hero-copy">
              <div className="terms-eyebrow"><span className="terms-eyebrow-dot" /> The engineering index <span className="terms-eyebrow-slash">/</span> 01</div>
              <h1>Engineering terms,<br /><em>without the fog.</em></h1>
              <p className="terms-hero-description">A practical glossary for the ideas behind good software. Find a definition, then follow the connection that makes it useful.</p>

              <form className="terms-search-form" role="search" onSubmit={handleSearchSubmit}>
                <Search className="terms-search-icon" size={19} aria-hidden="true" />
                <label className="sr-only" htmlFor="engineering-term-search">Search engineering terms</label>
                <input
                  ref={inputRef}
                  id="engineering-term-search"
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  placeholder="Search a term, idea, or acronym…"
                  autoComplete="off"
                  aria-controls="terms-results"
                />
                {query && (
                  <button className="terms-search-clear" type="button" aria-label="Clear search" onClick={() => setQuery("")}>
                    <X size={16} />
                  </button>
                )}
                <kbd>{shortcut}</kbd>
              </form>
              <p className="terms-search-hint">Try <button type="button" onClick={() => setQuery("idempotency")}>idempotency</button>, <button type="button" onClick={() => setQuery("quorum")}>quorum</button>, or <button type="button" onClick={() => setQuery("cache")}>cache</button>.</p>
              <div className="terms-hero-note"><span className="terms-note-mark"><BookOpen size={15} /></span><span>Search is handled on the server. Elasticsearch ranks matches; Redis caches repeat queries.</span></div>
            </div>

            <aside className="terms-hero-visual" aria-label="A visual note about searching related engineering concepts">
              <div className="terms-visual-grid" aria-hidden="true" />
              <div className="terms-visual-topline"><span>FIELD NOTE / 01</span><span>LOCAL INDEX <i /></span></div>
              <div className="terms-visual-orbit terms-visual-orbit-one" aria-hidden="true" />
              <div className="terms-visual-orbit terms-visual-orbit-two" aria-hidden="true" />
              <div className="terms-visual-node terms-node-client">QUERY</div>
              <div className="terms-visual-node terms-node-cache">REDIS <span>cache</span></div>
              <div className="terms-visual-node terms-node-index">ELASTIC <span>index</span></div>
              <div className="terms-visual-connector terms-connector-a" aria-hidden="true" />
              <div className="terms-visual-connector terms-connector-b" aria-hidden="true" />
              <div className="terms-visual-main-card">
                <p><span>CONCEPT THREAD / 03</span><span>↗</span></p>
                <strong>Quorum</strong>
                <div className="terms-visual-equation"><span>replicas</span><i /> <span>agreement</span><i /> <b>confidence</b></div>
              </div>
              <div className="terms-visual-caption"><span>From a word</span><ArrowRight size={13} /><span>to a working model</span></div>
              <span className="terms-visual-index">EB / T—001</span>
            </aside>
          </div>
        </section>

        <div className="terms-signal-strip">
          <div className="terms-shell terms-signal-inner">
            <span><i /> Starter glossary <b>{ENGINEERING_TERMS.length.toString().padStart(2, "0")}</b></span>
            <span><i /> {TERM_CATEGORIES.length} engineering disciplines</span>
            <span><i /> Search via local services</span>
          </div>
        </div>

        <section className="terms-categories-section" aria-labelledby="terms-categories-title">
          <div className="terms-shell">
            <div className="terms-section-heading">
              <div>
                <p className="terms-section-kicker">01 / Browse by subject</p>
                <h2 id="terms-categories-title">Pick a <em>thread.</em></h2>
              </div>
              <p>Every discipline has its own vocabulary. Start with a field or search across all of them.</p>
            </div>
            <div className="terms-category-grid">
              {TERM_CATEGORIES.map((item) => {
                const { icon: Icon, note } = categoryIllustrations[item];
                const isActive = activeCategory === item;
                return (
                  <button
                    type="button"
                    key={item}
                    className={`terms-category-card${isActive ? " is-active" : ""}`}
                    aria-pressed={isActive}
                    onClick={() => setActiveCategory(isActive ? "All terms" : item)}
                  >
                    <span className="terms-category-card-top"><span className="terms-category-icon"><Icon size={17} /></span><span>{categoryNumber[item]}</span></span>
                    <strong>{item}</strong>
                    <span className="terms-category-note">{note}</span>
                    <span className="terms-category-count">{categoryCounts[item]} {categoryCounts[item] === 1 ? "term" : "terms"}<ChevronRight size={14} /></span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="terms-directory-section" id="terms-directory" aria-labelledby="terms-directory-title">
          <div className="terms-shell">
            <div className="terms-directory-heading">
              <div>
                <p className="terms-section-kicker">02 / The index</p>
                <h2 id="terms-directory-title">{isSearching ? "Search results" : "Good places to start."}</h2>
              </div>
              <div className="terms-engine-status" aria-live="polite">
                {isSearching ? (
                  <>
                    <span className={`terms-engine-dot${searchUnavailable ? " is-warning" : ""}`} />
                    <span>{search.data?.engine === "elasticsearch" ? "Elasticsearch local" : search.error ? "Starter index" : "Starter index"}</span>
                    <span className="terms-status-divider">/</span>
                    <span>{search.data?.cache === "hit" ? "Redis cache" : search.data?.cache === "miss" ? "Redis ready" : "Redis optional"}</span>
                  </>
                ) : (
                  <><span className="terms-engine-dot" /><span>Local-first search</span><span className="terms-status-divider">/</span><span>ES + Redis</span></>
                )}
              </div>
            </div>

            <div className="terms-directory-layout">
              <aside className="terms-filter-rail" aria-label="Filter glossary by discipline">
                <p>DISCIPLINE</p>
                <button type="button" className={`terms-filter-button${activeCategory === "All terms" ? " is-active" : ""}`} aria-pressed={activeCategory === "All terms"} onClick={() => setActiveCategory("All terms")}>
                  <span>All terms</span><span>{ENGINEERING_TERMS.length.toString().padStart(2, "0")}</span>
                </button>
                {TERM_CATEGORIES.map((item) => (
                  <button type="button" key={item} className={`terms-filter-button${activeCategory === item ? " is-active" : ""}`} aria-pressed={activeCategory === item} onClick={() => setActiveCategory(item)}>
                    <span>{item}</span><span>{categoryCounts[item].toString().padStart(2, "0")}</span>
                  </button>
                ))}
                <div className="terms-filter-tip"><span>FIELD TIP</span><p>Search by a name, acronym, or a phrase from the definition.</p></div>
              </aside>

              <div className="terms-result-area" id="terms-results" aria-live="polite">
                {isSearching && search.isPending && !search.data ? (
                  <div className="terms-search-message"><span className="terms-loading-dot" /><span>Looking through the index…</span></div>
                ) : isSettling ? (
                  <div className="terms-search-message"><span className="terms-loading-dot" /><span>Updating matches…</span></div>
                ) : (
                  <>
                    <div className="terms-result-meta">
                      <span>{isSearching ? `${total} ${total === 1 ? "match" : "matches"}` : "POPULAR STARTING POINTS"}</span>
                      {isSearching && search.data?.cache === "hit" && <span className="terms-cache-badge"><Check size={12} /> Cached for speed</span>}
                    </div>
                    {searchUnavailable && isSearching && (
                      <p className="terms-service-notice">Local Elasticsearch is offline, so these matches come from the bundled starter glossary. Start the local services to use ranked search and Redis caching.</p>
                    )}
                    {terms.length > 0 ? (
                      <div className="terms-results-list">
                        {terms.map((term, index) => (
                          <button key={term.id} type="button" className="terms-result-row" onClick={() => openTerm(term)} aria-label={`Open ${term.term} definition`}>
                            <span className="terms-result-number">{String(index + 1).padStart(2, "0")}</span>
                            <span className="terms-result-copy">
                              <span className="terms-result-category">{term.category}</span>
                              <strong>{term.term}</strong>
                              <span className="terms-result-summary">{term.summary}</span>
                            </span>
                            <ArrowUpRight className="terms-result-arrow" size={18} />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="terms-empty-state">
                        <span className="terms-empty-mark"><Search size={19} /></span>
                        <h3>No exact match yet.</h3>
                        <p>Try a shorter phrase, an acronym, or choose another discipline.</p>
                        <button type="button" onClick={() => { setQuery(""); setActiveCategory("All terms"); }}>Clear search <X size={13} /></button>
                      </div>
                    )}
                    {isSearching && !searchUnavailable && <p className="terms-service-footnote">{searchCacheLabel} · results are powered by the local Elasticsearch index.</p>}
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="terms-feature-section" aria-label="Featured engineering term">
          <div className="terms-shell terms-feature-inner">
            <div className="terms-feature-label"><span>03 / A useful connection</span><span>↘</span></div>
            <div className="terms-feature-copy">
              <p>FOLLOW THE THREAD</p>
              <h2>{featuredTerm.term}</h2>
              <p>{featuredTerm.summary}</p>
            </div>
            <div className="terms-feature-related">
              <span>CONNECTED IDEAS</span>
              <div>{featuredTerm.relatedTerms.slice(0, 3).map((item) => <button key={item} type="button" onClick={() => { setQuery(item); setActiveCategory("All terms"); window.scrollTo({ top: 0, behavior: "smooth" }); }}>{item}<ArrowUpRight size={13} /></button>)}</div>
            </div>
            <button className="terms-feature-open" type="button" onClick={() => openTerm(featuredTerm)}>Open field note <ArrowRight size={15} /></button>
          </div>
        </section>
      </main>

      <footer className="terms-footer">
        <div className="terms-shell terms-footer-inner">
          <a className="terms-brand" href="/" aria-label="Explain Bytes home"><img src="/explainbytes-mark.webp" alt="" /><span>Explain Bytes</span></a>
          <p>Clear words. Better systems.</p>
          <a href="/">Back to the field guide <ArrowRight size={14} /></a>
        </div>
      </footer>

      <Dialog open={Boolean(selectedTerm)} onOpenChange={(open) => { if (!open) setSelectedTerm(null); }}>
        <DialogContent className="terms-dialog" aria-describedby="terms-dialog-description">
          {selectedTerm && (
            <>
              <DialogHeader className="terms-dialog-header">
                <p className="terms-dialog-kicker">FIELD NOTE / {selectedTerm.category}</p>
                <DialogTitle className="terms-dialog-title">{selectedTerm.term}</DialogTitle>
                <DialogDescription id="terms-dialog-description" className="terms-dialog-summary">{selectedTerm.summary}</DialogDescription>
              </DialogHeader>
              <div className="terms-dialog-body">
                <p>{selectedTerm.definition}</p>
                <div className="terms-dialog-context"><span>IN PRACTICE</span><p>{selectedTerm.context}</p></div>
                {selectedTerm.tags.length > 0 && <div className="terms-dialog-tags"><span>INDEX TAGS</span><div>{selectedTerm.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>}
                {selectedTerm.aliases.length > 0 && <div className="terms-dialog-aliases"><span>ALSO CALLED</span><div>{selectedTerm.aliases.slice(0, 4).map((alias) => <span key={alias}>{alias}</span>)}</div></div>}
                <div className="terms-dialog-related"><span>RELATED THREADS</span><div>{selectedTerm.relatedTerms.map((name) => {
                  const related = ENGINEERING_TERMS.find((term) => term.term.toLocaleLowerCase() === name.toLocaleLowerCase());
                  return related ? <button type="button" key={name} onClick={() => openTerm(related)}>{name}<ArrowUpRight size={13} /></button> : <span key={name}>{name}</span>;
                })}</div></div>
              </div>
              <div className="terms-dialog-footer">
                {selectedTerm.chapterSlug ? <a href={`/docs/system-design/${selectedTerm.chapterSlug}`}>Read the deeper chapter <ArrowRight size={14} /></a> : <span className="terms-dialog-no-chapter">A concise field note</span>}
                <button type="button" onClick={copyDefinition}>{copied ? <Check size={14} /> : <BookOpen size={14} />}{copied ? "Copied" : "Copy definition"}</button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

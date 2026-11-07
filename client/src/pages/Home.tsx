/**
 * Marginalia Lab design reminder: build this page like an annotated technical dossier—
 * asymmetric editorial structure, warm paper, precise ink linework, cobalt evidence,
 * and Signal Coral only for active learning moments.
 */
import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  BookOpen,
  Braces,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDotDashed,
  Code2,
  FileText,
  Github,
  Layers3,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Network,
  Search,
  Sparkles,
  Sun,
  UsersRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { useReadingProgressMap } from "@/hooks/useReadingProgress";
import { systemDesignDocs } from "@/lib/systemDesignDocs";
import { ImageWithPlaceholder } from "@/components/ImageWithPlaceholder";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const subjects = [
  { code: "01", title: "System Design", blurb: "Make trade-offs visible before you make them.", icon: Network, color: "blue" },
  { code: "02", title: "Databases", blurb: "From indexes to isolation, mapped without the fog.", icon: Layers3, color: "green" },
  { code: "03", title: "Operating Systems", blurb: "Trace what happens beneath every running process.", icon: CircleDotDashed, color: "ink" },
  { code: "04", title: "Networking", blurb: "Follow every packet from the socket to the wire.", icon: Braces, color: "blue" },
];

const terms = ["Idempotency", "Quorum", "B+ Tree", "Deadlock", "Rate limiting", "CAP theorem"];

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSubject, setActiveSubject] = useState("System Design");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const progressMap = useReadingProgressMap();
  const resumeDoc = systemDesignDocs.find((doc) => progressMap[doc.slug] && !progressMap[doc.slug].completed);

  const submitNewsletter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.includes("@")) {
      toast.error("Enter a valid email address to join the reading list.");
      return;
    }
    setSubscribed(true);
    toast.success("You’re on the Explain Bytes reading list.");
  };

  return (
    <div className="dark-theme-page min-h-screen overflow-x-clip bg-[#f3f0e8] text-[#13221e] selection:bg-[#e66b5b] selection:text-[#13221e]">
      <header className="dark-header relative z-30 border-b border-[#13221e]/10 bg-[#f3f0e8]/95 backdrop-blur">
        <div className="site-shell flex h-[74px] items-center justify-between gap-6">
          <a className="group flex shrink-0 items-center gap-3" href="#top" aria-label="Explain Bytes home">
            <img src="explainbytes-mark.webp" className="h-10 w-10 transition-transform duration-300 group-hover:rotate-[-7deg]" alt="Explain Bytes signal mark" />
            <span className="font-display text-[28px] leading-none tracking-[-0.05em]">Explain Bytes</span>
          </a>
          <nav className="hidden items-center gap-7 font-mono text-[11px] font-medium uppercase tracking-[0.11em] text-[#13221e]/70 lg:flex" aria-label="Primary navigation">
            <a className="nav-link" href="/docs">Library</a>
            <a className="nav-link" href="/flashcards">Flash cards</a>
            <a className="nav-link" href="/terms">Terms</a>
            <a className="nav-link" href="#collaborate">Collaborate</a>
          </nav>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="theme-toggle hidden h-10 w-10 items-center justify-center rounded-full border border-[#13221e]/15 dark:border-[#f4efe7]/20 text-[#13221e] dark:text-[#f4efe7] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97] sm:flex" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {isAuthenticated ? (
              <div className="hidden sm:flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="group flex items-center gap-2 rounded-full border border-[#13221e]/15 dark:border-[#f4efe7]/20 bg-transparent p-1 pr-3 font-mono text-[11px] text-[#13221e]/85 dark:text-[#f4efe7]/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#13221e]/30 dark:hover:border-[#f4efe7]/40 hover:bg-[#13221e]/5 dark:hover:bg-[#f4efe7]/10 active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#13221e]/20 dark:focus-visible:ring-[#f4efe7]/20"
                      aria-label="Account menu"
                    >
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.name || "User"}
                          className="h-7 w-7 rounded-full border border-[#13221e]/20 dark:border-[#f4efe7]/20 object-cover"
                        />
                      ) : (
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#13221e] dark:bg-[#f4efe7] font-mono text-[10px] font-bold text-[#f3f0e8] dark:text-[#0f1513]">
                          {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <span className="max-w-[120px] truncate font-medium">
                        {user?.name || user?.email}
                      </span>
                      <ChevronDown
                        size={14}
                        className="text-[#13221e]/60 dark:text-[#f4efe7]/80 transition-transform duration-200 group-data-[state=open]:rotate-180"
                      />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 mt-2 rounded-xl border border-[#13221e]/15 bg-[#fbfaf6] p-1.5 shadow-xl backdrop-blur dark:border-[#f4efe7]/15 dark:bg-[#1a2520]"
                  >
                    <div className="px-3 py-2.5">
                      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.12em] text-[#13221e]/50 dark:text-[#f4efe7]/50">
                        Signed in as
                      </p>
                      <p className="truncate font-sans text-sm font-semibold text-[#13221e] dark:text-[#f4efe7]">
                        {user?.name || "Member"}
                      </p>
                      <p className="truncate font-mono text-[11px] text-[#13221e]/60 dark:text-[#f4efe7]/60">
                        {user?.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator className="my-1 bg-[#13221e]/10 dark:bg-[#f4efe7]/10" />
                    <DropdownMenuItem
                      onClick={() => logout()}
                      className="cursor-pointer gap-2 rounded-lg px-3 py-2 font-mono text-[11px] font-medium text-red-600 transition-colors hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-600 dark:text-red-400 dark:hover:bg-red-500/15"
                    >
                      <LogOut size={14} />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <a
                  href="/login"
                  className="inline-flex h-10 items-center gap-1.5 rounded-full border border-[#13221e]/20 px-4 font-mono text-[11px] font-semibold uppercase tracking-[0.11em] text-[#13221e] transition-all hover:bg-[#13221e]/5 active:scale-[0.97]"
                >
                  <LogIn size={14} />
                  <span>Sign in</span>
                </a>
                <a className="hidden items-center gap-2 rounded-full bg-[#13221e] px-5 py-2.5 font-mono text-[11px] font-semibold uppercase tracking-[0.11em] text-[#f3f0e8] transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97] md:flex" href="/login">
                  Get started <ArrowRight size={14} />
                </a>
              </div>
            )}
            <button className="grid h-10 w-10 place-items-center rounded-full border border-[#13221e]/15 lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation" aria-expanded={mobileOpen}>
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
        {mobileOpen && (
          <nav className="border-t border-[#13221e]/10 bg-[#f3f0e8] px-5 py-5 lg:hidden" aria-label="Mobile navigation">
            <div className="site-shell flex flex-col gap-1 font-mono text-xs uppercase tracking-[0.1em]">
              {isAuthenticated ? (
                <div className="flex items-center justify-between border-b border-[#13221e]/10 py-4">
                  <div className="flex items-center gap-2.5">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#13221e] text-[11px] text-[#f3f0e8]">
                        {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <span className="font-semibold text-[#13221e] truncate max-w-[150px]">{user?.name || user?.email}</span>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                    className="inline-flex items-center gap-1.5 text-[#e66b5b] font-bold"
                  >
                    <LogOut size={14} /> Log out
                  </button>
                </div>
              ) : (
                <a
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between border-b border-[#13221e]/10 py-4 font-bold text-[#e66b5b]"
                >
                  <span className="flex items-center gap-2"><LogIn size={16} /> Sign in / Register</span>
                  <ArrowRight size={16} />
                </a>
              )}
              {["Library", "Flash cards", "Terms", "Collaborate"].map((item, index) => (
                <a key={item} href={["/docs", "/flashcards", "/terms", "#collaborate"][index]} onClick={() => setMobileOpen(false)} className="flex items-center justify-between border-b border-[#13221e]/10 py-4">
                  {item} <ArrowDownRight size={16} />
                </a>
              ))}
              <button onClick={toggleTheme} className="mt-4 flex w-full items-center justify-between border border-[#13221e]/15 px-4 py-3 text-left" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
                <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </nav>
        )}
      </header>

      <main id="top">
        <section className="dark-hero relative isolate overflow-hidden border-b border-[#13221e]/10">
          <ImageWithPlaceholder src="explainbytes-hero-system-coral.png" previewSrc="/hero.webp" alt="Abstract connected systems map on drafting paper" containerClassName="dark-hero-image-shell absolute inset-0 -z-20" className="dark-hero-image object-cover object-[61%_50%] opacity-95" />
          <div className="dark-hero-overlay absolute inset-0 -z-10 bg-gradient-to-r from-[#f3f0e8] via-[#f3f0e8]/90 to-[#f3f0e8]/5" />
          <div className="site-shell relative min-h-[690px] py-7 lg:min-h-[730px] lg:py-9">
            <div className="editorial-rail absolute bottom-0 left-0 top-0 hidden w-12 border-r border-[#13221e]/10 xl:block" aria-hidden="true">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 -rotate-90 whitespace-nowrap font-mono text-[10px] uppercase tracking-[0.24em] text-[#13221e]/45">Field notes / 001</span>
            </div>
            <div className="grid h-full min-h-[640px] items-end gap-8 xl:pl-16">
              <div className="max-w-3xl pb-14 pt-20 sm:pt-24">
                <div className="mb-8 flex items-center gap-3 font-mono text-[11px] font-medium uppercase tracking-[0.15em] text-[#13221e]/65">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#e66b5b] ring-4 ring-[#e66b5b]/30" />
                  The developer’s field guide
                </div>
                <h1 className="max-w-[760px] font-display text-[clamp(3.9rem,8.7vw,8.5rem)] leading-[0.83] tracking-[-0.075em] text-[#13221e]">
                  Engineering,<br />
                  <span className="relative inline-block italic">made legible.</span>
                </h1>
                <p className="mt-9 max-w-lg font-body text-[17px] leading-7 text-[#13221e]/72 sm:text-[19px]">
                  Trace the systems behind the software you use. Clear explanations, memorable diagrams, and practice that turns knowledge into instinct.
                </p>
                <div className="mt-10 flex flex-wrap items-center gap-3">
                  <a href="/docs" className="group inline-flex items-center gap-3 bg-[#13221e] px-5 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f5f1e8] transition-all duration-200 hover:-translate-y-1 hover:shadow-[5px_5px_0_#e66b5b] active:scale-[0.97]">
                    Read a concept <ArrowRight className="transition-transform duration-200 group-hover:translate-x-1" size={15} />
                  </a>
                  <a href="/flashcards" className="inline-flex items-center gap-2 border-b border-[#13221e] py-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:text-[#4072f6]">
                    Try a flash card <ChevronRight size={15} />
                  </a>
                </div>
              </div>
              <div className="mb-8 flex max-w-2xl flex-wrap gap-x-7 gap-y-3 border-t border-[#13221e]/15 pt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#13221e]/65">
                <span><b className="mr-2 text-[#13221e]">2,000+</b> connected terms</span>
                <span><b className="mr-2 text-[#13221e]">07</b> core disciplines</span>
                <span><b className="mr-2 text-[#13221e]">01</b> place to make it stick</span>
              </div>
            </div>
          </div>
        </section>

        {resumeDoc && (
          <section className="resume-reading-banner" aria-label="Resume reading">
            <div className="site-shell flex flex-col gap-5 py-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="resume-reading-mark"><BookOpen size={17} /></span>
                <div><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#e66b5b]">Saved reading progress</p><p className="mt-1 font-display text-2xl tracking-[-0.04em]">Return to <em>{resumeDoc.title}</em></p></div>
              </div>
              <a href={`/docs/system-design/${resumeDoc.slug}`} className="inline-flex items-center gap-2 self-start border-b border-[#e66b5b] pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[#e66b5b] sm:self-auto">Resume at {Math.round(progressMap[resumeDoc.slug].ratio * 100)}% <ArrowRight size={15} /></a>
            </div>
          </section>
        )}

        <section className="relative border-b border-[#13221e]/10 bg-[#13221e] text-[#f3f0e8]">
          <div className="site-shell grid gap-8 py-7 md:grid-cols-[0.7fr_1.3fr] md:items-center md:py-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#e66b5b]">What you will build fluency in</p>
            <div className="flex flex-wrap items-center gap-x-7 gap-y-4 py-1 font-display text-2xl tracking-[-0.03em] sm:text-3xl md:min-h-20 md:py-5">
              <span>Systems</span><span className="text-[#e66b5b]">/</span><span>Foundations</span><span className="text-[#e66b5b]">/</span><span>Deep concepts</span>
            </div>
          </div>
        </section>

        <section id="library" className="dark-library relative overflow-hidden bg-[#f7f5ef] py-24 sm:py-32">
          <div className="site-shell">
            <div className="grid gap-12 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
              <div>
                <p className="eyebrow">01 / The reference shelf</p>
                <h2 className="section-title mt-5">A clear path through the <em>complex.</em></h2>
              </div>
              <p className="mb-1 max-w-xl font-body text-[16px] leading-7 text-[#13221e]/67 sm:text-lg">Built for the moment a term appears in a code review, design interview, or incident report—and you need more than a definition.</p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-[1.12fr_0.88fr]">
              <article className="group relative min-h-[480px] overflow-hidden bg-[#d9e2da] p-6 sm:p-9">
                <ImageWithPlaceholder src="explainbytes-docs-study-coral.png" alt="Abstract engineering study diagram" loading="lazy" containerClassName="dark-study-image-shell absolute inset-0" className="object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-[1.035]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#13221e]/76 via-[#13221e]/10 to-transparent" />
                <div className="relative flex h-full flex-col justify-between text-[#f7f5ef]">
                  <div className="flex items-start justify-between gap-5">
                    <span className="inline-flex items-center gap-2 bg-[#e66b5b] px-3 py-2 font-mono text-[10px] font-bold uppercase tracking-[0.13em] text-[#13221e]"><BookOpen size={14} /> Flash docs</span>
                    <span className="font-mono text-[11px] tracking-[0.15em] text-[#f7f5ef]/65">01—07</span>
                  </div>
                  <div className="max-w-md">
                    <h3 className="font-display text-5xl leading-[0.9] tracking-[-0.055em] sm:text-6xl">Read the why,<br /><i>not only the what.</i></h3>
                    <p className="mt-5 max-w-sm font-body leading-6 text-[#f7f5ef]/78">Visual explanations shaped around mental models, trade-offs, and real engineering context.</p>
                    <a href="#terms" className="mt-7 inline-flex items-center gap-2 border-b border-[#e66b5b] pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#e66b5b]">Open the library <ArrowRight size={15} /></a>
                  </div>
                </div>
              </article>

              <div className="flex flex-col justify-between border-l border-[#13221e]/15 lg:pl-8">
                <div className="border-y border-[#13221e]/15 py-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#13221e]/52">Explore by discipline</p>
                </div>
                <div className="divide-y divide-[#13221e]/15">
                  {subjects.map((subject) => {
                    const Icon = subject.icon;
                    const active = activeSubject === subject.title;
                    return (
                      <button key={subject.title} data-active={active} onClick={() => setActiveSubject(subject.title)} className={`active-subject-card group flex w-full items-center gap-4 py-5 text-left sm:gap-6 ${active ? "text-[#13221e]" : "text-[#13221e]/52 hover:text-[#13221e]"}`}>
                        <span className={`active-subject-icon grid h-10 w-10 shrink-0 place-items-center border ${active ? "border-[#13221e] bg-[#e66b5b]" : "border-[#13221e]/20"}`}><Icon size={18} /></span>
                        <span className="min-w-0 flex-1"><span className="block font-display text-[27px] leading-none tracking-[-0.045em]">{subject.title}</span>{active && <span className="mt-2 block font-body text-sm leading-5 text-[#13221e]/62">{subject.blurb}</span>}</span>
                        <span className="font-mono text-[10px] tracking-[0.12em]">{subject.code}</span>
                        <ArrowDownRight size={18} className={`transition-transform duration-300 ${active ? "translate-x-0.5 translate-y-0.5" : ""}`} />
                      </button>
                    );
                  })}
                </div>
                <div className="mt-8 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.13em] text-[#13221e]/58"><span className="h-px w-10 bg-[#13221e]/40" /> New studies added every week</div>
              </div>
            </div>
          </div>
        </section>

        <section id="practice" className="dark-practice flashcard-feature-section relative overflow-hidden bg-[#e3eadf] py-24 sm:py-32">
          <div className="site-shell grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="eyebrow">02 / Practice with intent</p>
              <h2 className="section-title mt-5 max-w-lg">Turn concepts into <em>instinct.</em></h2>
              <p className="mt-7 max-w-lg font-body text-[17px] leading-7 text-[#13221e]/68">The full study room gives each concept the attention it needs: one precise question, a considered answer, and a lightweight way to keep your progress moving.</p>
              <div className="mt-9 grid max-w-lg grid-cols-3 gap-0 border-y border-[#13221e]/15 py-6"><div><p className="font-display text-4xl tracking-[-0.05em]">80</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#13221e]/55">Study cards</p></div><div className="border-x border-[#13221e]/15 pl-5"><p className="font-display text-4xl tracking-[-0.05em]">4</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#13221e]/55">Core decks</p></div><div className="pl-5"><p className="font-display text-4xl tracking-[-0.05em]">1</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#13221e]/55">Focused room</p></div></div>
              <a href="/flashcards" className="mt-9 inline-flex items-center gap-3 bg-[#13221e] px-5 py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#f5f1e8] transition-all duration-200 hover:-translate-y-1 hover:shadow-[5px_5px_0_#e66b5b] active:scale-[0.97]">Open flashcard study room <ArrowRight size={15} /></a>
            </div>
            <a href="/flashcards" className="flashcard-feature-card group relative block overflow-hidden border border-[#13221e]/15 bg-[#f7f5ef] p-5 shadow-[9px_9px_0_rgba(19,34,30,0.1)] transition-transform duration-300 hover:-translate-y-1 sm:p-7">
              <div className="flex items-center justify-between border-b border-[#13221e]/15 pb-4"><span className="inline-flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em]"><span className="grid h-7 w-7 place-items-center bg-[#e66b5b]"><Sparkles size={14} /></span> System Design</span><span className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#13221e]/50">01 / 20</span></div>
              <div className="mt-5 min-h-[260px] border border-[#13221e]/20 bg-[#f3f0e8] p-6 sm:min-h-[310px] sm:p-8"><div className="flex items-center justify-between"><span className="border border-[#13221e]/25 px-3 py-1.5 font-mono text-[9px] uppercase tracking-[0.14em]">Question</span><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#13221e]/45">Tap to study</span></div><p className="mt-14 max-w-xl font-display text-[clamp(2.4rem,4.4vw,4.1rem)] leading-[0.9] tracking-[-0.06em]">What is horizontal vs vertical scaling?</p><p className="mt-8 inline-flex items-center gap-2 border-b border-[#e66b5b] pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.13em]">Reveal answer <ArrowRight size={14} /></p></div>
              <div className="mt-5 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[#13221e]/55"><span>Recall / Decide / Repeat</span><span className="inline-flex items-center gap-2 text-[#e66b5b]">Study now <ArrowDownRight size={15} className="transition-transform duration-300 group-hover:translate-y-1" /></span></div>
            </a>
          </div>
        </section>

        <section id="terms" className="dark-terms border-y border-[#13221e]/10 bg-[#f7f5ef] py-24 sm:py-32">
          <div className="site-shell">
            <div className="grid gap-12 lg:grid-cols-[1fr_0.82fr] lg:items-end">
              <div><p className="eyebrow">03 / The concept index</p><h2 className="section-title mt-5">Search less.<br /><em>Understand more.</em></h2></div>
              <p className="max-w-md font-body text-[17px] leading-7 text-[#13221e]/68">Start anywhere, then follow the thread to the concepts that make the whole system click.</p>
            </div>
            <div className="mt-14 grid overflow-hidden border border-[#13221e]/15 lg:grid-cols-[1.14fr_0.86fr]">
              <div className="min-h-[400px] bg-[#13221e] p-6 text-[#f7f5ef] sm:p-9">
                <div className="flex items-center gap-3 border-b border-[#f7f5ef]/20 pb-5 font-mono text-[11px] uppercase tracking-[0.13em] text-[#f7f5ef]/60"><Search size={16} /><span>Search concepts, patterns, terms</span></div>
                <div className="mt-14 max-w-xl">
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#e66b5b]">Concept of the day</p>
                  <h3 className="mt-5 font-display text-6xl leading-none tracking-[-0.07em] sm:text-7xl">CAP<br /><i>Theorem</i></h3>
                  <p className="mt-6 max-w-lg font-body leading-7 text-[#f7f5ef]/70">A framework for seeing the unavoidable trade-offs between consistency, availability, and partition tolerance in a distributed system.</p>
                  <a href="/terms?q=CAP%20Theorem" className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.13em] text-[#e66b5b]">Open explanation <ArrowRight size={15} /></a>
                </div>
              </div>
              <div className="dark-coral-index relative bg-[#e66b5b] p-6 sm:p-9">
                <span className="absolute right-7 top-7 font-mono text-[10px] uppercase tracking-[0.15em] text-[#13221e]/60">Index / 2,000+</span>
                <div className="mt-20">
                  <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#13221e]/60">Frequently connected</p>
                  <ul className="mt-6 divide-y divide-[#13221e]/20">
                    {terms.map((term, index) => <li key={term}><a href={`/terms?q=${encodeURIComponent(term)}`} className="group flex items-center justify-between gap-4 py-4 font-display text-[26px] tracking-[-0.04em] transition-transform hover:translate-x-1"><span>{term}</span><span className="font-mono text-[10px] tracking-normal">0{index + 1}</span><ArrowDownRight size={17} className="opacity-0 transition-opacity group-hover:opacity-100" /></a></li>)}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="collaborate" className="dark-collaboration relative overflow-hidden bg-[#d8dfd7] py-24 sm:py-32">
          <div className="site-shell grid gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:items-center">
            <div>
              <p className="eyebrow">04 / Knowledge, together</p>
              <h2 className="section-title mt-5">Write it out.<br /><em>Make it clearer.</em></h2>
              <p className="mt-7 max-w-md font-body text-[17px] leading-7 text-[#13221e]/68">Shape explanations alongside your peers, experiment in a fork, and bring the sharpest version back to the shared library.</p>
              <div className="mt-9 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.13em] text-[#13221e]/65"><span className="grid h-8 w-8 place-items-center rounded-full bg-[#4072f6] text-[#f7f5ef]"><UsersRound size={15} /></span> Built for thoughtful collaboration</div>
              <a href="#collaborate" onClick={() => toast("Collaborative editor coming next in the revamp.")} className="mt-9 inline-flex items-center gap-3 border-b border-[#13221e] pb-2 font-mono text-[11px] font-bold uppercase tracking-[0.12em] hover:text-[#4072f6]">Explore the editor <ArrowRight size={15} /></a>
            </div>
            <div className="relative">
              <div className="absolute -right-7 -top-8 h-44 w-44 rounded-full border border-[#13221e]/20" aria-hidden="true" />
              <ImageWithPlaceholder src="collab.png" alt="Abstract collaborative engineering manuscript with connected annotation marks" loading="lazy" containerClassName="dark-collab-image-shell relative z-10 min-h-[370px] w-full sm:min-h-[450px]" className="object-cover" />
              <div className="dark-collab-note relative z-20 -mt-20 ml-auto mr-5 max-w-sm bg-[#f7f5ef] p-5 shadow-[7px_7px_0_#13221e] sm:mr-10 sm:p-6">
                <div className="flex items-center justify-between border-b border-[#13221e]/15 pb-3 font-mono text-[10px] uppercase tracking-[0.13em] text-[#13221e]/58"><span>Shared manuscript</span><span>Live</span></div>
                <p className="mt-4 font-display text-2xl leading-[0.95] tracking-[-0.04em]">“The cache is not the source of truth.”</p>
                <div className="mt-5 flex items-center gap-2"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e66b5b] font-mono text-[10px]">AR</span><span className="grid h-7 w-7 place-items-center rounded-full bg-[#4072f6] font-mono text-[10px] text-white">SK</span><span className="grid h-7 w-7 place-items-center rounded-full bg-[#123d35] font-mono text-[10px] text-white">+3</span><span className="ml-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[#13221e]/58">editing now</span></div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#13221e] py-24 text-[#f7f5ef] sm:py-32">
          <div className="absolute -right-20 -top-12 h-80 w-80 rounded-full border border-[#e66b5b]/35" aria-hidden="true" />
          <div className="absolute -right-7 top-12 h-56 w-56 rounded-full border border-[#e66b5b]/30" aria-hidden="true" />
          <div className="site-shell relative grid gap-12 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#e66b5b]">A useful note, every so often</p><h2 className="mt-5 max-w-3xl font-display text-[clamp(3.3rem,7vw,6.7rem)] leading-[0.86] tracking-[-0.07em]">Stay close to the <i>good stuff.</i></h2></div>
            <form onSubmit={submitNewsletter} className="border-t border-[#f7f5ef]/25 pt-6">
              <label htmlFor="email" className="font-body text-[17px] leading-7 text-[#f7f5ef]/72">New concepts, fresh systems breakdowns, and practical revision prompts. No noisy feed.</label>
              <div className="mt-7 flex border-b border-[#f7f5ef]/65 pb-2 focus-within:border-[#e66b5b]">
                <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@domain.com" className="min-w-0 flex-1 bg-transparent font-mono text-sm text-[#f7f5ef] outline-none placeholder:text-[#f7f5ef]/35" aria-label="Email address" />
                <button type="submit" className="ml-3 inline-flex shrink-0 items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.13em] text-[#e66b5b] transition-transform duration-200 hover:translate-x-1 active:scale-[0.97]">{subscribed ? <><Check size={16} /> Joined</> : <>Join list <ArrowRight size={16} /></>}</button>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className="bg-[#13221e] text-[#f7f5ef]">
        <div className="site-shell border-t border-[#f7f5ef]/15 py-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <a className="flex items-center gap-3" href="#top"><img src="explainbytes-mark.webp" className="h-9 w-9" alt="" /><span className="font-display text-2xl tracking-[-0.05em]">Explain Bytes</span></a>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 font-mono text-[10px] uppercase tracking-[0.13em] text-[#f7f5ef]/58"><a href="#library" className="hover:text-[#e66b5b]">Docs</a><a href="/flashcards" className="hover:text-[#e66b5b]">Practice</a><a href="/terms" className="hover:text-[#e66b5b]">Terms</a><a href="https://github.com/Eyepatch5263" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-[#e66b5b]"><Github size={14} /> GitHub</a></div>
          </div>
          <div className="mt-10 flex flex-col justify-between gap-3 border-t border-[#f7f5ef]/10 pt-4 font-mono text-[9px] uppercase tracking-[0.12em] text-[#f7f5ef]/40 sm:flex-row"><span>© 2026 Explain Bytes</span><span>Trace the idea. Keep the system.</span></div>
        </div>
      </footer>
    </div>
  );
}

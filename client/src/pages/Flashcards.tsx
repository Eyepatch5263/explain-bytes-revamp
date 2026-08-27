/**
 * Marginalia Lab design reminder: this route is a focused study room—quiet ink surfaces,
 * coral learning signals, and a single clear path back to the broader Explain Bytes library.
 */
import { ArrowLeft, Moon, Sun } from "lucide-react";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import { useTheme } from "@/contexts/ThemeContext";

export default function Flashcards() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="dark-theme-page min-h-screen bg-[#f3f0e8] text-[#13221e]">
      <header className="dark-header border-b border-[#13221e]/10 bg-[#f3f0e8]/95 backdrop-blur">
        <div className="site-shell flex h-[74px] items-center justify-between gap-4">
          <a href="/" className="group inline-flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:text-[#e66b5b]" aria-label="Return to Explain Bytes homepage"><ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" /> Back to library</a>
          <div className="hidden text-center sm:block"><p className="font-display text-[26px] leading-none tracking-[-0.05em]">Flash card study room</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.13em] text-[#13221e]/50">Explain Bytes / System Design</p></div>
          <button onClick={toggleTheme} className="theme-toggle inline-flex h-10 items-center gap-2 rounded-full border border-[#13221e]/15 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}<span>{theme === "dark" ? "Light" : "Dark"}</span></button>
        </div>
      </header>
      <main><FlashcardDeck /></main>
    </div>
  );
}

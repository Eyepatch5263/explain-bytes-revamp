/**
 * Marginalia Lab design reminder: this route is a focused study room—quiet ink surfaces,
 * coral learning signals, and a single clear path back to the broader Explain Bytes library.
 */
import { ArrowLeft, ArrowRight, LogOut, Moon, Sun } from "lucide-react";
import { FlashcardDeck } from "@/components/FlashcardDeck";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { deckOrder, flashcardDecks, getFlashcardDeck, type DeckSlug } from "@/data/flashcardDecks";

export default function Flashcards({ deckSlug }: { deckSlug?: string }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const activeDeck = getFlashcardDeck(deckSlug);

  return (
    <div className="dark-theme-page min-h-screen bg-[#f3f0e8] text-[#13221e]">
      <header className="dark-header border-b border-[#13221e]/10 bg-[#f3f0e8]/95 backdrop-blur">
        <div className="site-shell flex h-[74px] items-center justify-between gap-4">
          <a href="/" className="group inline-flex items-center gap-3 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors hover:text-[#e66b5b]" aria-label="Return to Explain Bytes homepage"><ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-1" /> Back to library</a>
          <div className="hidden text-center sm:block"><p className="font-display text-[26px] leading-none tracking-[-0.05em]">Flash card study room</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.13em] text-[#13221e]/50">Explain Bytes / {activeDeck.title}</p></div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="hidden md:inline font-mono text-[10px] text-[#13221e]/60">{user.name || user.email}</span>
            )}
            <button
              onClick={() => logout()}
              className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#e66b5b] hover:underline"
              title="Log out"
            >
              <LogOut size={13} />
              <span className="hidden sm:inline">Log out</span>
            </button>
            <button onClick={toggleTheme} className="theme-toggle inline-flex h-10 items-center gap-2 rounded-full border border-[#13221e]/15 px-3 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.97]" aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}<span>{theme === "dark" ? "Light" : "Dark"}</span></button>
          </div>
        </div>
      </header>
      <main>
        <nav className="deck-switcher border-b border-[#13221e]/10 bg-[#f7f5ef]" aria-label="Flashcard decks"><div className="site-shell flex min-h-20 gap-0 overflow-x-auto"><div className="mr-5 hidden shrink-0 items-center font-mono text-[10px] uppercase tracking-[0.13em] text-[#13221e]/48 lg:flex">Choose a deck <ArrowRight size={14} className="ml-2" /></div>{deckOrder.map((slug) => { const deck = flashcardDecks[slug]; const active = deck.slug === activeDeck.slug; return <a key={deck.slug} href={`/flashcards/${deck.slug}`} className={`deck-switcher-link group min-w-[145px] border-l border-[#13221e]/10 px-5 py-4 ${active ? "is-active" : ""}`}><span className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[0.12em]"><span>{deck.code}</span><span>{deck.cards.length} cards</span></span><span className="mt-1 block font-display text-[23px] leading-none tracking-[-0.04em]">{deck.navLabel}</span></a>; })}</div></nav>
        <FlashcardDeck deckSlug={activeDeck.slug as DeckSlug} />
      </main>
    </div>
  );
}

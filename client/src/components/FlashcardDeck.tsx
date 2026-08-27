/**
 * Marginalia Lab design reminder: an interactive study object should feel like an annotated field card—
 * calm paper, confident ink, coral learning signals, and quiet, purposeful motion.
 */
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, RotateCcw, Shuffle, Sparkles } from "lucide-react";
import { systemDesignFlashcards } from "@/data/systemDesignFlashcards";

export function FlashcardDeck() {
  const [deck, setDeck] = useState(systemDesignFlashcards);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownIds, setKnownIds] = useState<string[]>([]);
  const [reviewIds, setReviewIds] = useState<string[]>([]);

  const currentCard = deck[cardIndex];
  const mastered = knownIds.length;
  const progress = Math.round((mastered / deck.length) * 100);
  const upcomingCards = useMemo(
    () => Array.from({ length: 3 }, (_, offset) => deck[(cardIndex + offset + 1) % deck.length]),
    [cardIndex, deck],
  );

  const goToCard = (nextIndex: number) => {
    setCardIndex((nextIndex + deck.length) % deck.length);
    setFlipped(false);
  };

  const shuffleDeck = () => {
    setDeck((current) => [...current].sort(() => Math.random() - 0.5));
    setCardIndex(0);
    setFlipped(false);
  };

  const markCard = (status: "known" | "review") => {
    if (status === "known") {
      setKnownIds((current) => current.includes(currentCard.id) ? current.filter((id) => id !== currentCard.id) : [...current, currentCard.id]);
      setReviewIds((current) => current.filter((id) => id !== currentCard.id));
    } else {
      setReviewIds((current) => current.includes(currentCard.id) ? current.filter((id) => id !== currentCard.id) : [...current, currentCard.id]);
      setKnownIds((current) => current.filter((id) => id !== currentCard.id));
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
      if (event.key === " ") {
        event.preventDefault();
        setFlipped((current) => !current);
      }
      if (event.key === "ArrowRight") goToCard(cardIndex + 1);
      if (event.key === "ArrowLeft") goToCard(cardIndex - 1);
      if (event.key.toLowerCase() === "k") markCard("known");
      if (event.key.toLowerCase() === "r") markCard("review");
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cardIndex, deck.length, currentCard.id]);

  const isKnown = knownIds.includes(currentCard.id);
  const isReview = reviewIds.includes(currentCard.id);

  return (
    <section id="practice" className="dark-practice flashcard-section relative overflow-hidden bg-[#e3eadf] py-24 sm:py-32">
      <div className="site-shell">
        <div className="grid gap-12 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
          <div>
            <p className="eyebrow">02 / Practice with intent</p>
            <h2 className="section-title mt-5 max-w-lg">Build recall that <em>holds up.</em></h2>
          </div>
          <p className="max-w-xl font-body text-[17px] leading-7 text-[#13221e]/68">Study the real System Design deck from Explain Bytes: flip each question when you are ready, mark its outcome, and keep moving through the concepts that appear in high-stakes engineering conversations.</p>
        </div>

        <div className="flashcard-studio mt-14 overflow-hidden border border-[#13221e]/15">
          <div className="flashcard-deckbar flex flex-wrap items-center justify-between gap-4 border-b border-[#13221e]/15 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center bg-[#e66b5b] text-[#171211]"><Sparkles size={15} /></span>
              <div><p className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em]">System Design</p><p className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#13221e]/55">Original Explain Bytes deck</p></div>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#13221e]/60"><span>{mastered} mastered</span><span className="h-1 w-1 rounded-full bg-[#e66b5b]" /><span>Card {String(cardIndex + 1).padStart(2, "0")} / {deck.length}</span></div>
          </div>

          <div className="flashcard-layout grid lg:grid-cols-[minmax(0,1fr)_310px]">
            <div className="flashcard-stage-wrap relative p-5 sm:p-8 lg:p-10">
              <div className="absolute left-0 top-0 h-full w-full paper-texture opacity-25" aria-hidden="true" />
              <button type="button" onClick={() => setFlipped((current) => !current)} className={`flashcard-canvas relative block min-h-[410px] w-full overflow-hidden border border-[#13221e]/20 text-left outline-none transition-transform duration-300 hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-[#4072f6] sm:min-h-[470px] ${flipped ? "is-flipped" : ""}`} aria-label={flipped ? "Show question" : "Reveal answer"}>
                <span className="absolute right-0 top-0 h-20 w-20 border-b border-l border-[#13221e]/15" aria-hidden="true" />
                <span className="absolute right-6 top-5 font-mono text-[10px] uppercase tracking-[0.15em] text-[#13221e]/45">Tap / Space</span>
                {!flipped ? (
                  <div className="flashcard-face flex h-full min-h-[410px] flex-col justify-between p-6 sm:min-h-[470px] sm:p-9">
                    <div className="flex items-center justify-between gap-4"><span className="inline-flex border border-[#13221e]/25 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em]">Question</span><span className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#13221e]/50">System Design / {String(cardIndex + 1).padStart(2, "0")}</span></div>
                    <div className="max-w-3xl"><h3 className="font-display text-[clamp(2.5rem,5.2vw,5rem)] leading-[0.9] tracking-[-0.06em] text-[#13221e]">{currentCard.question}</h3><p className="mt-8 inline-flex items-center gap-2 border-b border-[#e66b5b] pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#13221e]">Reveal answer <ArrowRight size={15} /></p></div>
                    <div className="flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[#13221e]/50"><span>Active recall / first pass</span><span>Press space</span></div>
                  </div>
                ) : (
                  <div className="flashcard-answer flex h-full min-h-[410px] flex-col justify-between bg-[#13221e] p-6 text-[#f7f5ef] sm:min-h-[470px] sm:p-9">
                    <div className="flex items-center justify-between gap-4"><span className="inline-flex border border-[#e66b5b] px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#ff9d90]">Answer</span><span className="font-mono text-[10px] uppercase tracking-[0.13em] text-[#f7f5ef]/48">Explain Bytes / deck note</span></div>
                    <div className="max-w-3xl"><p className="font-display text-[clamp(1.7rem,3.3vw,3rem)] leading-[1.04] tracking-[-0.04em]">{currentCard.answer}</p><p className="mt-8 inline-flex items-center gap-2 border-b border-[#e66b5b] pb-2 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ff9d90]">Back to question <RotateCcw size={14} /></p></div>
                    <div className="flex items-end justify-between font-mono text-[10px] uppercase tracking-[0.12em] text-[#f7f5ef]/48"><span>Make the decision</span><span>Known / Review</span></div>
                  </div>
                )}
              </button>
              <div className="mt-5 flex items-center justify-between gap-4 sm:mt-7">
                <div className="flex items-center gap-2"><button type="button" onClick={() => goToCard(cardIndex - 1)} className="flashcard-nav" aria-label="Previous flashcard"><ArrowLeft size={17} /></button><button type="button" onClick={() => goToCard(cardIndex + 1)} className="flashcard-nav" aria-label="Next flashcard"><ArrowRight size={17} /></button><button type="button" onClick={shuffleDeck} className="flashcard-nav" aria-label="Shuffle flashcard deck"><Shuffle size={16} /></button></div>
                <p className="hidden font-mono text-[10px] uppercase tracking-[0.12em] text-[#13221e]/54 sm:block">← → Navigate &nbsp; / &nbsp; S Shuffle</p>
              </div>
            </div>

            <aside className="flashcard-side border-t border-[#13221e]/15 lg:border-l lg:border-t-0">
              <div className="p-5 sm:p-7">
                <div className="flex items-end justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#13221e]/56">Memory signal</p><p className="mt-1 font-display text-4xl tracking-[-0.05em]">{progress}%</p></div><p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#13221e]/55">{mastered} / {deck.length} known</p></div>
                <div className="mt-4 h-2 bg-[#13221e]/10"><div className="h-full bg-[#e66b5b] transition-[width] duration-300" style={{ width: `${progress}%` }} /></div>
                <div className="mt-7 grid grid-cols-2 gap-3"><button type="button" onClick={() => markCard("known")} className={`flashcard-mark ${isKnown ? "is-selected" : ""}`}><Check size={15} />{isKnown ? "Known" : "Mark known"}</button><button type="button" onClick={() => markCard("review")} className={`flashcard-mark flashcard-review ${isReview ? "is-selected" : ""}`}><RotateCcw size={14} />{isReview ? "Review" : "Review later"}</button></div>
                <div className="mt-8 border-t border-[#13221e]/15 pt-5"><div className="flex items-center justify-between"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#13221e]/56">Up next</p><span className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#e66b5b]">Queue</span></div><div className="mt-3 divide-y divide-[#13221e]/12">{upcomingCards.map((card, index) => <button key={card.id} type="button" onClick={() => goToCard((cardIndex + index + 1) % deck.length)} className="flashcard-queue group flex w-full items-center gap-3 py-3 text-left"><span className="font-mono text-[10px] text-[#13221e]/48">{String((cardIndex + index + 2 - 1) % deck.length + 1).padStart(2, "0")}</span><span className="line-clamp-2 flex-1 font-body text-[13px] leading-5 text-[#13221e]/72 group-hover:text-[#13221e]">{card.question}</span><ArrowRight size={13} className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100" /></button>)}</div></div>
              </div>
              <div className="border-t border-[#13221e]/15 bg-[#d6ded5] p-5 sm:p-7"><p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#13221e]/56">Study shortcuts</p><div className="mt-4 grid grid-cols-2 gap-y-3 font-mono text-[10px] uppercase tracking-[0.1em] text-[#13221e]/67"><span><kbd>Space</kbd> Flip</span><span><kbd>← →</kbd> Move</span><span><kbd>K</kbd> Known</span><span><kbd>R</kbd> Review</span></div></div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  );
}

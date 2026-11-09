/** Source: existing public Explain Bytes flashcard decks, rendered through the Marginalia Lab study system. */
import { systemDesignFlashcards, type Flashcard } from "./systemDesignFlashcards";
import { dbmsFlashcards, networkingFlashcards, operatingSystemsFlashcards } from "./additionalFlashcards";

export type DeckSlug = "system-design" | "operating-systems" | "networking" | "dbms";

export type FlashcardDeckDefinition = {
  slug: DeckSlug;
  title: string;
  navLabel: string;
  code: string;
  description: string;
  cards: Flashcard[];
};

export const flashcardDecks: Record<DeckSlug, FlashcardDeckDefinition> = {
  "system-design": { slug: "system-design", title: "System Design", navLabel: "Systems", code: "01", description: "Make trade-offs visible before you make them. Work through the ideas that shape scalable, resilient systems.", cards: systemDesignFlashcards },
  "operating-systems": { slug: "operating-systems", title: "Operating Systems", navLabel: "OS", code: "02", description: "Understand the mechanisms below your applications: scheduling, memory, synchronization, and system boundaries.", cards: operatingSystemsFlashcards },
  networking: { slug: "networking", title: "Networking", navLabel: "Network", code: "03", description: "Trace packets, protocols, and paths across the network—and make every connection legible.", cards: networkingFlashcards },
  dbms: { slug: "dbms", title: "Database Management", navLabel: "DBMS", code: "04", description: "Study the data models, constraints, transactions, and decisions behind durable information systems.", cards: dbmsFlashcards },
};

export const deckOrder: DeckSlug[] = ["system-design", "operating-systems", "networking", "dbms"];

export function getFlashcardDeck(slug?: string): FlashcardDeckDefinition {
  return flashcardDecks[slug as DeckSlug] ?? flashcardDecks["system-design"];
}

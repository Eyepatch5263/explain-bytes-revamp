export type ReadingProgress = {
  slug: string;
  ratio: number;
  scrollTop: number;
  completed: boolean;
  updatedAt: number;
};

export type ReadingProgressMap = Record<string, ReadingProgress>;

const STORAGE_KEY = "explain-bytes-reading-progress";
const EVENT_NAME = "explain-bytes-reading-progress-change";

const clampRatio = (ratio: number) => Math.max(0, Math.min(1, Number.isFinite(ratio) ? ratio : 0));

export function readReadingProgress(): ReadingProgressMap {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as ReadingProgressMap;
    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed).map(([slug, value]) => [slug, {
        slug,
        ratio: clampRatio(value?.ratio ?? 0),
        scrollTop: Math.max(0, value?.scrollTop ?? 0),
        completed: Boolean(value?.completed),
        updatedAt: value?.updatedAt ?? 0,
      }]),
    );
  } catch {
    return {};
  }
}

export function saveReadingProgress(progress: ReadingProgress): ReadingProgressMap {
  const next = {
    ...readReadingProgress(),
    [progress.slug]: {
      ...progress,
      ratio: clampRatio(progress.ratio),
      completed: progress.completed || progress.ratio >= 0.92,
    },
  };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
  }

  return next;
}

export function getReadingProgress(slug: string): ReadingProgress | undefined {
  return readReadingProgress()[slug];
}

export function subscribeToReadingProgress(listener: (progress: ReadingProgressMap) => void) {
  if (typeof window === "undefined") return () => undefined;

  const onChange = (event: Event) => {
    const detail = (event as CustomEvent<ReadingProgressMap>).detail;
    listener(detail ?? readReadingProgress());
  };
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener(readReadingProgress());
  };

  window.addEventListener(EVENT_NAME, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT_NAME, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

export const readingProgressStorageKey = STORAGE_KEY;

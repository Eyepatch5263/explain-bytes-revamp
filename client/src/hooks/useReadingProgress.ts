import { useEffect, useState, type RefObject } from "react";
import { getReadingProgress, readReadingProgress, saveReadingProgress, subscribeToReadingProgress, type ReadingProgress, type ReadingProgressMap } from "@/lib/readingProgress";

type ProgressTarget = HTMLElement | null;

type UseReadingProgressOptions = {
  slug: string;
  containerRef: RefObject<HTMLElement | null>;
};

function getMetrics(target: ProgressTarget) {
  if (target) {
    const maxScroll = Math.max(0, target.scrollHeight - target.clientHeight);
    return { ratio: maxScroll ? target.scrollTop / maxScroll : 0, scrollTop: target.scrollTop };
  }

  const documentElement = document.documentElement;
  const maxScroll = Math.max(0, documentElement.scrollHeight - window.innerHeight);
  return { ratio: maxScroll ? window.scrollY / maxScroll : 0, scrollTop: window.scrollY };
}

function restorePosition(target: ProgressTarget, progress?: ReadingProgress) {
  if (!progress || progress.completed) return;
  window.requestAnimationFrame(() => {
    if (target) target.scrollTop = progress.scrollTop;
    else window.scrollTo({ top: progress.scrollTop, behavior: "auto" });
  });
}

export function useReadingProgress({ slug, containerRef }: UseReadingProgressOptions) {
  const [progress, setProgress] = useState<ReadingProgress | undefined>(() => getReadingProgress(slug));

  useEffect(() => {
    const target = containerRef.current;
    const saved = getReadingProgress(slug);
    setProgress(saved);
    restorePosition(target, saved);

    let timeout: number | undefined;
    let frame: number | undefined;
    const persist = () => {
      frame = undefined;
      const metrics = getMetrics(target);
      const next: ReadingProgress = {
        slug,
        ratio: metrics.ratio,
        scrollTop: metrics.scrollTop,
        completed: metrics.ratio >= 0.92,
        updatedAt: Date.now(),
      };
      saveReadingProgress(next);
      setProgress(next);
    };
    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        window.clearTimeout(timeout);
        timeout = window.setTimeout(persist, 180);
      });
    };
    const eventTarget = target ?? window;
    eventTarget.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      eventTarget.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
      if (timeout) window.clearTimeout(timeout);
    };
  }, [containerRef, slug]);

  return {
    progress,
    percent: Math.round((progress?.ratio ?? 0) * 100),
    completed: Boolean(progress?.completed),
  };
}

export function useReadingProgressMap(): ReadingProgressMap {
  const [progress, setProgress] = useState<ReadingProgressMap>(() => readReadingProgress());

  useEffect(() => subscribeToReadingProgress(setProgress), []);

  return progress;
}

import React from "react";
import { BookOpen, Network, Sparkles } from "lucide-react";
import "./loadingSkeleton.css";

export type LoadingSkeletonKind = "page" | "reader" | "simulation";

type LoadingSkeletonProps = {
  kind?: LoadingSkeletonKind;
  label?: string;
};

const PulseLine = ({ className = "" }: { className?: string }) => <span aria-hidden="true" className={`loading-skeleton__line ${className}`} />;

export function LoadingSkeleton({ kind = "page", label = "Loading Explain Bytes" }: LoadingSkeletonProps) {
  const Icon = kind === "simulation" ? Network : kind === "reader" ? BookOpen : Sparkles;

  return (
    <section className={`loading-skeleton loading-skeleton--${kind}`} role="status" aria-live="polite" aria-atomic="true" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div className="loading-skeleton__caption"><Icon size={15} strokeWidth={1.7} /><span>Explain Bytes / preparing</span><i /></div>
      {kind === "reader" && <div className="loading-skeleton__reader-rail" aria-hidden="true"><PulseLine className="is-rail-title" /><PulseLine /><PulseLine /><PulseLine /><PulseLine className="is-short" /></div>}
      <div className="loading-skeleton__body loading-skeleton__main-content">
        <PulseLine className="is-kicker" />
        <PulseLine className="is-title" />
        <PulseLine className="is-title is-title--short" />
        {kind === "reader" && <div className="loading-skeleton__reading-meta" aria-hidden="true"><PulseLine className="is-meta" /><PulseLine className="is-meta is-meta--short" /></div>}
        {kind === "reader" && <div className="loading-skeleton__progress" aria-hidden="true"><span /></div>}
        <div className="loading-skeleton__rule" />
        {kind === "simulation" ? (
          <div className="loading-skeleton__simulation-grid" aria-hidden="true">
            <div className="loading-skeleton__simulation-card"><PulseLine className="is-card-label" /><PulseLine /><PulseLine className="is-short" /></div>
            <div className="loading-skeleton__diagram"><span /><span /><span /><span /></div>
            <div className="loading-skeleton__simulation-card"><PulseLine className="is-card-label" /><PulseLine /><PulseLine className="is-short" /></div>
          </div>
        ) : kind === "page" ? (
          <div className="loading-skeleton__main-grid" aria-hidden="true">
            <div className="loading-skeleton__feature-panel"><PulseLine className="is-card-label" /><PulseLine className="is-feature-title" /><PulseLine className="is-feature-title is-feature-title--short" /><PulseLine className="is-short" /></div>
            <div className="loading-skeleton__prose"><PulseLine /><PulseLine /><PulseLine className="is-medium" /><PulseLine /><PulseLine className="is-short" /></div>
          </div>
        ) : (
          <div className="loading-skeleton__prose" aria-hidden="true"><PulseLine /><PulseLine /><PulseLine /><PulseLine className="is-medium" /><PulseLine /><PulseLine className="is-short" /></div>
        )}
      </div>
      <p className="loading-skeleton__label" aria-hidden="true">{label}</p>
    </section>
  );
}

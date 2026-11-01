import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LoadingSkeleton } from "../client/src/components/LoadingSkeleton";

describe("LoadingSkeleton", () => {
  it("renders an accessible contextual simulation placeholder", () => {
    const markup = renderToStaticMarkup(<LoadingSkeleton kind="simulation" label="Loading DNS simulation" />);

    expect(markup).toContain('role="status"');
    expect(markup).toContain('aria-busy="true"');
    expect(markup).toContain("Loading DNS simulation");
    expect(markup).toContain("loading-skeleton--simulation");
    expect(markup).toContain("loading-skeleton__simulation-grid");
    expect(markup).toContain("loading-skeleton__main-content");
  });

  it("renders the reader rail only for a document-loading state", () => {
    const reader = renderToStaticMarkup(<LoadingSkeleton kind="reader" label="Preparing Flash Docs" />);
    const page = renderToStaticMarkup(<LoadingSkeleton kind="page" label="Opening Explain Bytes" />);

    expect(reader).toContain("loading-skeleton__reader-rail");
    expect(reader).toContain("loading-skeleton__progress");
    expect(page).not.toContain("loading-skeleton__reader-rail");
    expect(page).toContain("loading-skeleton__main-grid");
  });
});

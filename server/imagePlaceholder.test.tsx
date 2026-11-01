import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ImageWithPlaceholder } from "../client/src/components/ImageWithPlaceholder";

describe("ImageWithPlaceholder", () => {
  it("renders the image and an editorial loading surface before the asset loads", () => {
    const markup = renderToStaticMarkup(
      <ImageWithPlaceholder src="/hero.png" alt="System map" containerClassName="hero-image" />,
    );

    expect(markup).toContain('class="image-placeholder');
    expect(markup).toContain("image-placeholder__surface");
    expect(markup).toContain("Loading illustration");
    expect(markup).toContain('alt="System map"');
    expect(markup).toContain('src="/hero.png"');
  });
});

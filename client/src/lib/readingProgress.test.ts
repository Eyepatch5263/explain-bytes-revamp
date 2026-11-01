import { describe, expect, it } from "vitest";
import { readReadingProgress, saveReadingProgress } from "./readingProgress";

describe("reading progress persistence", () => {
  it("is safe to read when browser storage is unavailable", () => {
    expect(readReadingProgress()).toEqual({});
  });

  it("clamps ratios and marks chapters complete at the reading threshold", () => {
    const result = saveReadingProgress({
      slug: "scaling",
      ratio: 1.4,
      scrollTop: 820,
      completed: false,
      updatedAt: 123,
    });

    expect(result.scaling).toMatchObject({
      slug: "scaling",
      ratio: 1,
      scrollTop: 820,
      completed: true,
      updatedAt: 123,
    });
  });

  it("keeps incomplete chapters resumable", () => {
    const result = saveReadingProgress({
      slug: "dns",
      ratio: 0.34,
      scrollTop: 240,
      completed: false,
      updatedAt: 456,
    });

    expect(result.dns).toMatchObject({
      ratio: 0.34,
      completed: false,
    });
  });
});

import { describe, expect, it } from "vitest";
import { mdxToPlainText, splitTextIntoChunks } from "./chapterAudio";

describe("System Design chapter listening preparation", () => {
  it("keeps readable MDX prose while removing frontmatter, diagrams, and code", () => {
    const plain = mdxToPlainText(`---\ntitle: Sample\n---\n# A chapter\n\nA **clear** concept.\n\n<Mermaid chart='A --> B' />\n\n\`\`\`ts\nconst secret = 1;\n\`\`\``);
    expect(plain).toContain("A clear concept.");
    expect(plain).not.toContain("Mermaid");
    expect(plain).not.toContain("const secret");
  });

  it("splits long chapter text into Polly-safe segments", () => {
    const source = `${"A complete sentence. ".repeat(160)}End.`;
    const chunks = splitTextIntoChunks(source, 120);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length <= 120)).toBe(true);
    expect(chunks.join(" ").replace(/\s+/g, " ")).toContain("End.");
  });
});

import { describe, expect, it } from "vitest";
import { normalizeElasticHit } from "./termsSearch";

describe("normalizeElasticHit", () => {
  it("hydrates a minimal engineering-terms index document", () => {
    const normalized = normalizeElasticHit({
      _id: "throughput",
      _source: {
        term: "Throughput",
        definition: "The number of operations a system processes per unit of time.",
        category: "System Design",
        tags: ["performance", "capacity", "load"],
      },
    });

    expect(normalized).toMatchObject({
      id: "throughput",
      slug: "throughput",
      term: "Throughput",
      category: "System Design",
      tags: ["performance", "capacity", "load"],
      summary: "The number of operations a system processes per unit of time.",
      aliases: [],
      relatedTerms: [],
    });
    expect(normalized?.context).toContain("local engineering index");
  });

  it("preserves richer source metadata and categories", () => {
    const normalized = normalizeElasticHit({
      _id: "os-record",
      _source: {
        id: "operating-system",
        slug: "operating-system",
        term: "Operating System",
        abbreviation: "OS",
        aliases: ["OS"],
        category: "Operating Systems",
        tags: ["kernel", "processes"],
        summary: "The software layer between applications and hardware.",
        definition: "An operating system manages hardware resources and provides services to applications.",
        context: "Schedulers and memory managers are core operating-system subsystems.",
        relatedTerms: ["Process", "Thread"],
        chapterSlug: "operating-systems",
      },
    });

    expect(normalized).toMatchObject({
      id: "operating-system",
      slug: "operating-system",
      abbreviation: "OS",
      category: "Operating Systems",
      aliases: ["OS"],
      relatedTerms: ["Process", "Thread"],
      chapterSlug: "operating-systems",
    });
  });
});

import { describe, expect, it } from "vitest";
import { searchTerms, getTermBySlug, getRelatedTerms } from "./elasticsearch";

describe("elasticsearch search integration", () => {
  it("searches engineering terms with elasticsearch engine and returns valid results", async () => {
    const result = await searchTerms({ query: "operating system", limit: 5 });

    expect(result).toBeDefined();
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(["elasticsearch", "starter-index"]).toContain(result.engine);
    expect(["hit", "miss", "unavailable"]).toContain(result.cache);

    const match = result.items.find(
      (item) => item.term.toLowerCase() === "operating system",
    );
    expect(match).toBeDefined();
    expect(match?.definition).toBeTruthy();
  });

  it("caches repeated queries in redis", async () => {
    const query = "concurrency-test-query";
    const res1 = await searchTerms({ query, limit: 3 });
    expect(res1).toBeDefined();

    const res2 = await searchTerms({ query, limit: 3 });
    expect(res2).toBeDefined();
    if (res1.engine === "elasticsearch") {
      expect(res2.cache).toBe("hit");
    }
  });

  it("finds a term by slug", async () => {
    const term = await getTermBySlug("latency");
    expect(term).toBeDefined();
    expect(term?.term.toLowerCase()).toBe("latency");
    expect(term?.definition).toBeTruthy();
  });

  it("retrieves related terms based on tags", async () => {
    const related = await getRelatedTerms(
      {
        term: "Latency",
        slug: "latency",
        tags: ["performance", "networking"],
      },
      2,
    );
    expect(Array.isArray(related)).toBe(true);
  });
});

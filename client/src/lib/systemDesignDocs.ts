import { lazy, type ComponentType } from "react";
import { mdxRawSources } from "virtual:mdx-raw-sources";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SystemDesignDoc = {
  slug: string;
  title: string;
  description: string;
  order: number;
  category: string;
  source: string;
  Component: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
};

// ---------------------------------------------------------------------------
// Source-level metadata (used by the FlashDocs catalogue page)
// ---------------------------------------------------------------------------

export const systemDesignSourceMeta = {
  id: "system-design",
  title: "System Design",
  description:
    "Learn the fundamentals of designing scalable, reliable, and efficient systems. Covers distributed systems, microservices, and architectural patterns.",
  icon: "Server",
  color: "oklch(0.6 0.2 280)",
  articles: 25,
};

// ---------------------------------------------------------------------------
// Category display order
// ---------------------------------------------------------------------------

const SOURCE_CATEGORY_ORDER: Record<string, number> = {
  Introduction: 1,
  "Core Concepts & Terminologies": 2,
  "Architecture & Components": 3,
  "Building Blocks": 4,
  "Design Patterns": 5,
  "Workflow and Execution": 6,
  "Scalability and Performance": 7,
  "Security and Safety": 8,
  "Case Studies": 9,
  "Common Pitfalls": 10,
  Summary: 11,
};

// ---------------------------------------------------------------------------
// Vite globs — compiled MDX components (lazy-loaded, code-split per chapter)
// ---------------------------------------------------------------------------

type MdxModule = {
  default: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
};

type MdxLoader = () => Promise<MdxModule>;

const compiledLoaders = import.meta.glob(
  "../content/system-design/**/*.mdx",
) as Record<string, MdxLoader>;

// ---------------------------------------------------------------------------
// Slug helpers
// ---------------------------------------------------------------------------

/** Extracts a URL-friendly slug from a glob file path. */
const slugFromPath = (filePath: string): string =>
  filePath.split("/").pop()!.replace(/\.mdx$/, "");

/** Pretty-prints a slug as a title (fallback when frontmatter has no title). */
const displayTitle = (slug: string): string =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

// ---------------------------------------------------------------------------
// Loader lookup  (slug → compiled-MDX loader)
// ---------------------------------------------------------------------------

const loadersBySlug: Record<string, MdxLoader> = {};
for (const [filePath, loader] of Object.entries(compiledLoaders)) {
  loadersBySlug[slugFromPath(filePath)] = loader;
}

// ---------------------------------------------------------------------------
// Prefetch cache
// ---------------------------------------------------------------------------

const modulePromiseCache = new Map<string, Promise<MdxModule>>();
const moduleLoadedCache = new Map<string, MdxModule>();

/**
 * Prefetches the MDX chunk for a chapter in the background.
 * Safe to call repeatedly on link hover or focus.
 */
export function prefetchChapter(slug: string): Promise<MdxModule | undefined> {
  const loader = loadersBySlug[slug];
  if (!loader) return Promise.resolve(undefined);

  const loaded = moduleLoadedCache.get(slug);
  if (loaded) return Promise.resolve(loaded);

  const pending = modulePromiseCache.get(slug);
  if (pending) return pending;

  const promise = loader()
    .then((mod) => {
      moduleLoadedCache.set(slug, mod);
      return mod;
    })
    .catch((err) => {
      modulePromiseCache.delete(slug);
      console.error(`Failed to prefetch MDX chunk for "${slug}":`, err);
      throw err;
    });

  modulePromiseCache.set(slug, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// React.lazy wrappers  (one per chapter, backed by prefetch cache)
// ---------------------------------------------------------------------------

const componentBySlug: Record<string, ComponentType<any>> = {};
for (const slug of Object.keys(loadersBySlug)) {
  componentBySlug[slug] = lazy(async () => {
    const mod = await prefetchChapter(slug);
    if (!mod || !mod.default) {
      throw new Error(`Unable to load MDX component for chapter: ${slug}`);
    }
    return { default: mod.default };
  });
}

// ---------------------------------------------------------------------------
// Frontmatter parser
// ---------------------------------------------------------------------------

function getFrontmatter(source: string): Record<string, string> {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  const metadata: Record<string, string> = {};
  if (!match) return metadata;

  for (const line of match[1].split("\n")) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, "");
    metadata[key] = value;
  }

  return metadata;
}

// ---------------------------------------------------------------------------
// Build the sorted document list from the virtual raw-source module
// ---------------------------------------------------------------------------

export const systemDesignDocs: SystemDesignDoc[] = Object.entries(mdxRawSources)
  .map(([slug, source]) => {
    const frontmatter = getFrontmatter(source);
    const Component =
      componentBySlug[slug] ??
      lazy(() => Promise.resolve({ default: () => null }));

    return {
      slug,
      title: frontmatter.title || displayTitle(slug),
      description: frontmatter.description || "",
      order: Number(frontmatter.order || 999),
      category: frontmatter.category || "System Design",
      source,
      Component,
    };
  })
  .sort((left, right) => {
    const categoryDelta =
      (SOURCE_CATEGORY_ORDER[left.category] ?? 999) -
      (SOURCE_CATEGORY_ORDER[right.category] ?? 999);
    return (
      categoryDelta || left.order - right.order || left.title.localeCompare(right.title)
    );
  });

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

export const getSystemDesignDoc = (slug: string) =>
  systemDesignDocs.find((doc) => doc.slug === slug);

export const getSystemDesignCategories = () => {
  const categories = new Map<string, SystemDesignDoc[]>();
  for (const doc of systemDesignDocs) {
    const existing = categories.get(doc.category) ?? [];
    existing.push(doc);
    categories.set(doc.category, existing);
  }
  return Array.from(categories.entries()).sort(
    ([left], [right]) =>
      (SOURCE_CATEGORY_ORDER[left] ?? 999) - (SOURCE_CATEGORY_ORDER[right] ?? 999),
  );
};

export const simulationSlugs = new Set(["dns", "database", "load-balancing"]);

// ---------------------------------------------------------------------------
// Heading extraction (used for the "On this page" TOC sidebar)
// ---------------------------------------------------------------------------

export const getChapterHeadings = (source: string) =>
  Array.from(source.matchAll(/^#{2,3}\s+(.+)$/gm)).map((match) => {
    const title = match[1]
      .replace(/[*_`]/g, "")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .trim();
    return {
      title,
      level: match[0].startsWith("###") ? 3 : 2,
      id: title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .trim()
        .replace(/\s+/g, "-"),
    };
  });

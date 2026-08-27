import type { ComponentType } from "react";
import { systemDesignMdxRaw } from "@/data/systemDesignMdxRaw";
import systemDesignTopicMeta from "@/content/system-design/_meta.json";

export type SystemDesignDoc = {
  slug: string;
  title: string;
  description: string;
  order: number;
  category: string;
  source: string;
  Component: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
};

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

export const systemDesignSourceMeta = systemDesignTopicMeta;

type MdxModule = {
  default: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
};

const compiledModules = import.meta.glob("../content/system-design/*.mdx", {
  eager: true,
}) as Record<string, MdxModule>;

function getFrontmatter(source: string) {
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

const displayTitle = (slug: string) =>
  slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const systemDesignDocs: SystemDesignDoc[] = Object.entries(systemDesignMdxRaw)
  .map(([slug, source]) => {
    const frontmatter = getFrontmatter(source);
    const Component = compiledModules[`../content/system-design/${slug}.mdx`]?.default;

    if (!Component) {
      throw new Error(`Unable to compile System Design chapter: ${slug}`);
    }

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
    const categoryDelta = (SOURCE_CATEGORY_ORDER[left.category] ?? 999) - (SOURCE_CATEGORY_ORDER[right.category] ?? 999);
    return categoryDelta || left.order - right.order || left.title.localeCompare(right.title);
  });

export const getSystemDesignDoc = (slug: string) =>
  systemDesignDocs.find((doc) => doc.slug === slug);

export const getSystemDesignCategories = () => {
  const categories = new Map<string, SystemDesignDoc[]>();
  for (const doc of systemDesignDocs) {
    const existing = categories.get(doc.category) ?? [];
    existing.push(doc);
    categories.set(doc.category, existing);
  }
  return Array.from(categories.entries()).sort(([left], [right]) => (SOURCE_CATEGORY_ORDER[left] ?? 999) - (SOURCE_CATEGORY_ORDER[right] ?? 999));
};

export const simulationSlugs = new Set(["dns", "database", "load-balancing"]);

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

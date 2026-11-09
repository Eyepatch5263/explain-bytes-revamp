declare module "*.mdx" {
  import type { ComponentType } from "react";

  const MDXContent: ComponentType<{ components?: Record<string, ComponentType<any>> }>;
  export default MDXContent;
}

declare module "virtual:mdx-raw-sources" {
  /** slug → raw MDX source (with frontmatter) for every system-design chapter. */
  export const mdxRawSources: Record<string, string>;
}

import { buildingBlocksRaw } from "./building-blocks";
import { introductionRaw } from "./introduction";
import { designPatternsRaw } from "./design-patterns";

export const systemDesignMdxRaw: Record<string, string> = {
  ...buildingBlocksRaw,
  ...introductionRaw,
  ...designPatternsRaw,
};

export * from "./building-blocks";
export * from "./introduction";
export * from "./design-patterns";

export default systemDesignMdxRaw;

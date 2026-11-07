import "dotenv/config";
import { Client } from "@elastic/elasticsearch";
import {
  type EngineeringTerm,
  sampleTerms,
  searchTermsLocally,
  getTermBySlug as localGetTermBySlug,
  getRelatedTerms as localGetRelatedTerms,
} from "../data/sample-terms";
import { CACHE_KEYS, DEFAULT_TTL, getFromCache, setInCache, isRedisConnected } from "./redis";

export interface SearchTermsInput {
  query: string;
  category?: string;
  limit?: number;
}

export interface SearchResult {
  items: EngineeringTerm[];
  terms: EngineeringTerm[];
  total: number;
  engine: "elasticsearch" | "starter-index";
  source: "elasticsearch" | "local" | "cache";
  cache: "hit" | "miss" | "unavailable";
}

// Determine environment
const isProd = process.env.ENVIRONMENT === "production" || process.env.NODE_ENV === "production";

const elasticsearchNode = isProd
  ? (process.env.ELASTICSEARCH_PROD_URL || "http://localhost:9200")
  : (process.env.ELASTICSEARCH_URL || "https://localhost:9200");

const elasticsearchApiKey = isProd
  ? (process.env.ELASTICSEARCH_PROD_API_KEY || process.env.ELASTICSEARCH_API_KEY || "")
  : (process.env.ELASTICSEARCH_API_KEY || process.env.ELASTICSEARCH_PROD_API_KEY || "");

const INDEX_NAME = process.env.ELASTICSEARCH_INDEX || "engineering_terms";

// Configure Elasticsearch client
const client = new Client({
  node: elasticsearchNode,
  auth: {
    apiKey: elasticsearchApiKey,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Cache TTL values (in seconds)
const SEARCH_CACHE_TTL = DEFAULT_TTL; // 1 hour for search results
const TERM_CACHE_TTL = 60 * 60 * 24; // 1 day for individual terms
const RELATED_CACHE_TTL = 60 * 60 * 24; // 1 day for related terms

/**
 * Generate a cache key for search queries
 */
function getSearchCacheKey(query: string, category?: string, limit?: number): string {
  const normQuery = query.toLowerCase().trim().replace(/\s+/g, " ");
  const cat = category || "all";
  const lim = limit || 16;
  return `${CACHE_KEYS.SEARCH}${cat}:${lim}:${encodeURIComponent(normQuery)}`;
}

/**
 * Generate a cache key for term lookups
 */
function getTermCacheKey(slug: string): string {
  return `${CACHE_KEYS.TERM}${slug.toLowerCase().trim()}`;
}

/**
 * Generate a cache key for related terms
 */
function getRelatedCacheKey(termSlug: string): string {
  return `${CACHE_KEYS.RELATED}${termSlug.toLowerCase().trim()}`;
}

/**
 * Generate a URL-friendly slug from a term name
 */
function generateSlug(term: string): string {
  return term
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Normalize Elasticsearch document to ensure all required fields exist
 */
function normalizeTermFromES(source: any, docId: string): EngineeringTerm {
  const termName = source.term || source.name || "Unknown Term";
  const definition = source.definition || source.description || "";
  const slug = source.slug || generateSlug(termName);
  const summary =
    source.summary ||
    (definition.length > 150 ? `${definition.slice(0, 147).trimEnd()}…` : definition);

  return {
    id: source.id || docId || slug,
    term: termName,
    slug,
    definition,
    summary,
    category: source.category || "System Design",
    tags: Array.isArray(source.tags) ? source.tags : [],
    aliases: Array.isArray(source.aliases)
      ? source.aliases
      : source.abbreviation
        ? [source.abbreviation]
        : [],
    context: source.context || "A practical note from the engineering index.",
    relatedTerms: Array.isArray(source.relatedTerms) ? source.relatedTerms : [],
    ...(source.chapterSlug ? { chapterSlug: source.chapterSlug } : {}),
  } as any;
}

/**
 * Perform local fallback search with optional category filter
 */
function fallbackLocalSearch(query: string, category?: string, limit: number = 16) {
  let matches = searchTermsLocally(query);
  if (category && category !== "All terms") {
    matches = matches.filter((t) => t.category.toLowerCase() === category.toLowerCase());
  }
  return {
    items: matches.slice(0, limit),
    total: matches.length,
  };
}

/**
 * Search engineering terms using Redis cache + Elasticsearch
 */
export async function searchTerms(
  input: string | SearchTermsInput,
): Promise<SearchResult> {
  const query = typeof input === "string" ? input.trim() : (input.query || "").trim();
  const category = typeof input === "object" ? input.category : undefined;
  const limit = typeof input === "object" && input.limit ? input.limit : 16;

  const cacheKey = getSearchCacheKey(query, category, limit);

  // Check Redis cache first
  try {
    const cached = await getFromCache<SearchResult>(cacheKey);
    if (cached) {
      return {
        ...cached,
        engine: cached.engine || (cached.source === "elasticsearch" ? "elasticsearch" : "starter-index"),
        source: "cache",
        cache: "hit",
      };
    }
  } catch (err) {
    console.warn("[Search] Redis cache lookup failed:", err);
  }

  // Check if Elasticsearch is configured
  const isConfigured = Boolean(elasticsearchNode && elasticsearchApiKey);

  if (!isConfigured) {
    const fallback = fallbackLocalSearch(query, category, limit);
    const result: SearchResult = {
      items: fallback.items,
      terms: fallback.items,
      total: fallback.total,
      engine: "starter-index",
      source: "local",
      cache: "miss",
    };
    return result;
  }

  try {
    // Build query for Elasticsearch
    const filterClauses: any[] = [];
    if (category && category !== "All terms") {
      filterClauses.push({
        match: {
          category: {
            query: category,
            operator: "and",
          },
        },
      });
    }

    const esQuery =
      query.length > 0
        ? {
            bool: {
              should: [
                { match_phrase: { term: { query, boost: 8 } } },
                { match: { term: { query, boost: 5, fuzziness: "AUTO" } } },
                {
                  multi_match: {
                    query,
                    fields: [
                      "term^5",
                      "abbreviation^4",
                      "aliases^3",
                      "tags^3",
                      "summary^2",
                      "category^2",
                      "definition",
                      "context",
                    ],
                    type: "best_fields",
                    fuzziness: "AUTO",
                  },
                },
              ],
              minimum_should_match: 1,
              ...(filterClauses.length > 0 ? { filter: filterClauses } : {}),
            },
          }
        : filterClauses.length > 0
          ? { bool: { filter: filterClauses } }
          : { match_all: {} };

    const response = await client.search({
      index: INDEX_NAME,
      query: esQuery as any,
      size: limit,
      track_total_hits: true,
    });

    const hits = response.hits.hits;
    const terms = hits.map((hit: any) => normalizeTermFromES(hit._source, hit._id));
    const totalRaw = response.hits.total;
    const total = typeof totalRaw === "number" ? totalRaw : totalRaw?.value || terms.length;

    const result: SearchResult = {
      items: terms,
      terms,
      total,
      engine: "elasticsearch",
      source: "elasticsearch",
      cache: "miss",
    };

    // Store successful Elasticsearch response in Redis
    try {
      await setInCache(cacheKey, result, SEARCH_CACHE_TTL);
    } catch (cacheErr) {
      console.warn("[Search] Redis caching failed:", cacheErr);
    }

    return result;
  } catch (error) {
    console.warn("[Search] Elasticsearch query failed, falling back to local glossary:", error);

    const fallback = fallbackLocalSearch(query, category, limit);
    const result: SearchResult = {
      items: fallback.items,
      terms: fallback.items,
      total: fallback.total,
      engine: "starter-index",
      source: "local",
      cache: "unavailable",
    };

    return result;
  }
}

/**
 * Get a single term by slug from Redis cache + Elasticsearch
 */
export async function getTermBySlug(slug: string): Promise<EngineeringTerm | null> {
  const normSlug = slug.toLowerCase().trim();
  const cacheKey = getTermCacheKey(normSlug);

  try {
    const cached = await getFromCache<EngineeringTerm>(cacheKey);
    if (cached) return cached;
  } catch (err) {
    console.warn("[Search] Redis cache error for slug:", err);
  }

  const isConfigured = Boolean(elasticsearchNode && elasticsearchApiKey);

  if (!isConfigured) {
    const localTerm = localGetTermBySlug(normSlug) || null;
    if (localTerm) {
      await setInCache(cacheKey, localTerm, TERM_CACHE_TTL).catch(() => undefined);
    }
    return localTerm;
  }

  try {
    const termNameFromSlug = normSlug.replace(/-/g, " ");

    const response = await client.search({
      index: INDEX_NAME,
      query: {
        bool: {
          should: [
            { term: { slug: normSlug } },
            { term: { "slug.keyword": normSlug } },
            { match_phrase: { term: termNameFromSlug } },
            { term: { id: normSlug } },
            { term: { _id: normSlug } },
          ],
          minimum_should_match: 1,
        },
      },
      size: 1,
    });

    const hit = response.hits.hits[0];
    if (hit) {
      const term = normalizeTermFromES(hit._source, hit._id || "unknown");
      await setInCache(cacheKey, term, TERM_CACHE_TTL).catch(() => undefined);
      return term;
    }

    const localTerm = localGetTermBySlug(normSlug) || null;
    if (localTerm) {
      await setInCache(cacheKey, localTerm, TERM_CACHE_TTL).catch(() => undefined);
    }
    return localTerm;
  } catch (error) {
    console.warn("[Search] Elasticsearch get by slug failed, using local fallback:", error);
    return localGetTermBySlug(normSlug) || null;
  }
}

/**
 * Get related terms by matching tags from Redis cache + Elasticsearch
 */
export async function getRelatedTerms(
  term: { term: string; slug: string; tags: string[]; id?: string },
  limit: number = 3,
): Promise<EngineeringTerm[]> {
  const cacheKey = getRelatedCacheKey(term.slug);

  try {
    const cached = await getFromCache<EngineeringTerm[]>(cacheKey);
    if (cached) return cached;
  } catch (err) {
    console.warn("[Search] Redis cache error for related terms:", err);
  }

  const isConfigured = Boolean(elasticsearchNode && elasticsearchApiKey);

  if (!isConfigured || !term.tags || term.tags.length === 0) {
    const localRelated = localGetRelatedTerms(term as any, limit);
    await setInCache(cacheKey, localRelated, RELATED_CACHE_TTL).catch(() => undefined);
    return localRelated;
  }

  try {
    const response = await client.search({
      index: INDEX_NAME,
      query: {
        bool: {
          should: term.tags.map((tag) => ({
            term: { tags: tag },
          })),
          must_not: [{ match_phrase: { term: term.term } }],
          minimum_should_match: 1,
        },
      },
      size: limit,
    });

    const hits = response.hits.hits;
    if (hits.length > 0) {
      const related = hits.map((hit: any) => normalizeTermFromES(hit._source, hit._id));
      await setInCache(cacheKey, related, RELATED_CACHE_TTL).catch(() => undefined);
      return related;
    }

    const localRelated = localGetRelatedTerms(term as any, limit);
    await setInCache(cacheKey, localRelated, RELATED_CACHE_TTL).catch(() => undefined);
    return localRelated;
  } catch (error) {
    console.warn("[Search] Elasticsearch related terms failed, using local fallback:", error);
    return localGetRelatedTerms(term as any, limit);
  }
}

// Re-export alias for seamless compatibility
export const searchEngineeringTerms = searchTerms;
export default {
  searchTerms,
  searchEngineeringTerms,
  getTermBySlug,
  getRelatedTerms,
};

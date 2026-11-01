import { createClient } from "redis";
import {
  ENGINEERING_TERMS,
  type EngineeringTerm,
  type TermCategory,
} from "../shared/engineeringTerms";

const elasticsearchUrl = (process.env.ELASTICSEARCH_URL ?? "http://127.0.0.1:9200").replace(/\/$/, "");
const elasticsearchIndex = process.env.ELASTICSEARCH_INDEX ?? "engineering_terms";
const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";
const cacheTtlSeconds = 60;
const requestTimeoutMs = 2_500;

type SearchEngine = "elasticsearch" | "starter-index";
type CacheStatus = "hit" | "miss" | "unavailable";

export interface TermsSearchResponse {
  items: EngineeringTerm[];
  total: number;
  engine: SearchEngine;
  cache: CacheStatus;
}

interface ElasticHit {
  _id?: string;
  _source?: Partial<EngineeringTerm>;
}

interface ElasticSearchResponse {
  hits?: {
    total?: number | { value: number };
    hits?: ElasticHit[];
  };
}

let elasticsearchSeedPromise: Promise<void> | undefined;
let redisClient: ReturnType<typeof createClient> | undefined;
let redisConnection: Promise<ReturnType<typeof createClient> | null> | undefined;

function request(url: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    signal: AbortSignal.timeout(requestTimeoutMs),
  });
}

async function seedElasticsearchIndex() {
  const indexUrl = `${elasticsearchUrl}/${encodeURIComponent(elasticsearchIndex)}`;
  const indexStatus = await request(indexUrl, { method: "HEAD" });

  if (indexStatus.status === 404) {
    const createResponse = await request(indexUrl, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        settings: {
          analysis: {
            normalizer: {
              lower_case_normalizer: { type: "custom", filter: ["lowercase", "asciifolding"] },
            },
          },
        },
        mappings: {
          properties: {
            id: { type: "keyword" },
            slug: { type: "keyword" },
            term: {
              type: "text",
              fields: { keyword: { type: "keyword", normalizer: "lower_case_normalizer" } },
            },
            abbreviation: { type: "text" },
            aliases: { type: "text" },
            category: { type: "keyword" },
            tags: { type: "text", fields: { keyword: { type: "keyword" } } },
            summary: { type: "text" },
            definition: { type: "text" },
            context: { type: "text" },
            relatedTerms: { type: "text" },
          },
        },
      }),
    });

    if (!createResponse.ok && createResponse.status !== 400) {
      throw new Error(`Elasticsearch index creation failed (${createResponse.status}).`);
    }
  } else if (!indexStatus.ok) {
    throw new Error(`Elasticsearch index check failed (${indexStatus.status}).`);
  }

  const bulkBody = ENGINEERING_TERMS.flatMap((term) => [
    JSON.stringify({ index: { _index: elasticsearchIndex, _id: term.id } }),
    JSON.stringify(term),
  ]).join("\n") + "\n";

  const bulkResponse = await request(`${elasticsearchUrl}/_bulk?refresh=wait_for`, {
    method: "POST",
    headers: { "content-type": "application/x-ndjson" },
    body: bulkBody,
  });

  if (!bulkResponse.ok) {
    throw new Error(`Elasticsearch starter-index sync failed (${bulkResponse.status}).`);
  }

  const result = await bulkResponse.json() as { errors?: boolean };
  if (result.errors) {
    throw new Error("Elasticsearch could not index one or more starter terms.");
  }
}

async function ensureElasticsearchSeeded() {
  if (!elasticsearchSeedPromise) {
    elasticsearchSeedPromise = seedElasticsearchIndex();
  }

  const pending = elasticsearchSeedPromise;
  try {
    await pending;
  } catch (error) {
    if (elasticsearchSeedPromise === pending) elasticsearchSeedPromise = undefined;
    throw error;
  }
}

async function getRedisConnection() {
  if (!redisConnection) {
    const client = createClient({
      url: redisUrl,
      socket: {
        connectTimeout: 1_000,
        reconnectStrategy: () => false,
      },
    });
    client.on("error", () => undefined);
    redisClient = client;

    const pending = client.connect()
      .then(() => client)
      .catch(() => {
        if (redisConnection === pending) redisConnection = undefined;
        if (redisClient === client) redisClient = undefined;
        client.destroy();
        return null;
      });
    redisConnection = pending;
  }

  return redisConnection;
}

function cacheKey(query: string, category: TermCategory | undefined, limit: number) {
  const normalizedQuery = query.trim().toLocaleLowerCase().replace(/\s+/g, " ");
  return `engineering_terms:v1:${category ?? "all"}:${limit}:${encodeURIComponent(normalizedQuery)}`;
}

export function normalizeElasticHit(hit: ElasticHit): EngineeringTerm | undefined {
  const source = hit._source;
  if (!source?.term || !source.definition) return undefined;

  const slug = source.slug ?? source.term.toLocaleLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const summary = source.summary ?? (source.definition.length > 150
    ? `${source.definition.slice(0, 147).trimEnd()}…`
    : source.definition);

  return {
    id: source.id ?? hit._id ?? slug,
    slug,
    term: source.term,
    ...(source.abbreviation ? { abbreviation: source.abbreviation } : {}),
    aliases: Array.isArray(source.aliases) ? source.aliases : [],
    category: source.category ?? "System Design",
    tags: Array.isArray(source.tags) ? source.tags : [],
    summary,
    definition: source.definition,
    context: source.context ?? "A concise definition from the local engineering index.",
    relatedTerms: Array.isArray(source.relatedTerms) ? source.relatedTerms : [],
    ...(source.chapterSlug ? { chapterSlug: source.chapterSlug } : {}),
  };
}

function starterSearch(query: string, category: TermCategory | undefined, limit: number) {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const matches = ENGINEERING_TERMS
    .filter((term) => !category || term.category === category)
    .map((term) => {
      const exactFields = [term.term, term.abbreviation ?? "", ...term.aliases]
        .map((value) => value.toLocaleLowerCase());
      const body = [term.category, ...term.tags, term.summary, term.definition, term.context]
        .join(" ")
        .toLocaleLowerCase();
      const score = exactFields.some((value) => value === normalizedQuery)
        ? 100
        : exactFields.some((value) => value.startsWith(normalizedQuery))
          ? 60
          : exactFields.some((value) => value.includes(normalizedQuery))
            ? 40
            : body.includes(normalizedQuery)
              ? 10
              : 0;
      return { term, score };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score || left.term.term.localeCompare(right.term.term));

  return {
    items: matches.slice(0, limit).map(({ term }) => term),
    total: matches.length,
  };
}

async function searchElasticsearch(
  query: string,
  category: TermCategory | undefined,
  limit: number,
) {
  await ensureElasticsearchSeeded();

  const response = await request(`${elasticsearchUrl}/${encodeURIComponent(elasticsearchIndex)}/_search`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      size: limit,
      track_total_hits: true,
      query: {
        bool: {
          should: [
            { match_phrase: { term: { query, boost: 8 } } },
            { match: { term: { query, boost: 5, fuzziness: "AUTO" } } },
            {
              multi_match: {
                query,
                fields: ["abbreviation^4", "aliases^3", "tags^2", "summary^2", "category^2", "definition", "context"],
                type: "best_fields",
                fuzziness: "AUTO",
              },
            },
          ],
          minimum_should_match: 1,
          ...(category ? { filter: [{ match: { category: { query: category, operator: "and" } } }] } : {}),
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Elasticsearch search failed (${response.status}).`);
  }

  const payload = await response.json() as ElasticSearchResponse;
  const rawTotal = payload.hits?.total ?? 0;
  const total = typeof rawTotal === "number" ? rawTotal : rawTotal.value;
  const items = (payload.hits?.hits ?? [])
    .map(normalizeElasticHit)
    .filter((term): term is EngineeringTerm => Boolean(term));

  return { items, total };
}

export async function searchEngineeringTerms(input: {
  query: string;
  category?: TermCategory;
  limit: number;
}): Promise<TermsSearchResponse> {
  const query = input.query.trim();
  const key = cacheKey(query, input.category, input.limit);
  let cache: CacheStatus = "unavailable";

  try {
    const client = await getRedisConnection();
    if (client) {
      const cached = await client.get(key);
      if (cached) {
        const value = JSON.parse(cached) as Omit<TermsSearchResponse, "cache">;
        return { ...value, cache: "hit" };
      }
      cache = "miss";
    }
  } catch {
    cache = "unavailable";
  }

  let response: Omit<TermsSearchResponse, "cache">;
  try {
    const result = await searchElasticsearch(query, input.category, input.limit);
    response = { ...result, engine: "elasticsearch" };
  } catch (error) {
    console.warn("[Terms] Local Elasticsearch unavailable; using the bundled starter index.", error);
    response = { ...starterSearch(query, input.category, input.limit), engine: "starter-index" };
  }

  if (cache !== "unavailable") {
    try {
      const client = await getRedisConnection();
      if (client) {
        await client.set(key, JSON.stringify(response), { EX: cacheTtlSeconds });
      } else {
        cache = "unavailable";
      }
    } catch {
      cache = "unavailable";
    }
  }

  return { ...response, cache };
}

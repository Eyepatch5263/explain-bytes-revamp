import "dotenv/config";
import Redis from "ioredis";

// Determine environment
const isProd = process.env.ENVIRONMENT === "production" || process.env.NODE_ENV === "production";

const redisHost = isProd
  ? (process.env.REDIS_PROD_HOST || "localhost")
  : (process.env.REDIS_HOST || "localhost");

const redisPort = parseInt(
  (isProd ? process.env.REDIS_PROD_PORT : process.env.REDIS_PORT) || "6379",
  10,
);

// For local development use docker based redis container
const redisClient = process.env.REDIS_URL
  ? new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 50, 1000);
      },
      lazyConnect: true,
    })
  : new Redis({
      host: redisHost,
      port: redisPort,
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null;
        return Math.min(times * 50, 1000);
      },
      lazyConnect: true, // Don't connect until first command
    });

// Handle connection events
redisClient.on("connect", () => {
  console.log(`[Redis] Connected successfully to ${redisHost}:${redisPort}`);
});

redisClient.on("error", (err) => {
  console.warn("[Redis] Connection error:", err.message);
});

// Cache key prefixes
export const CACHE_KEYS = {
  SEARCH: "search:",
  TERM: "term:",
  RELATED: "related:",
} as const;

// Default TTL in seconds (1 hour for searches)
export const DEFAULT_TTL = 60 * 60;

/**
 * Get cached data from Redis
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const cached = await redisClient.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    return null;
  } catch (error) {
    console.warn("[Redis] GET error:", error);
    return null;
  }
}

/**
 * Set data in Redis cache with TTL
 */
export async function setInCache<T>(
  key: string,
  data: T,
  ttlSeconds: number = DEFAULT_TTL,
): Promise<boolean> {
  try {
    await redisClient.setex(key, ttlSeconds, JSON.stringify(data));
    return true;
  } catch (error) {
    console.warn("[Redis] SET error:", error);
    return false;
  }
}

/**
 * Delete a key from cache
 */
export async function deleteFromCache(key: string): Promise<boolean> {
  try {
    await redisClient.del(key);
    return true;
  } catch (error) {
    console.warn("[Redis] DEL error:", error);
    return false;
  }
}

/**
 * Clear all cached search results
 */
export async function clearSearchCache(): Promise<boolean> {
  try {
    const keys = await redisClient.keys(`${CACHE_KEYS.SEARCH}*`);
    if (keys.length > 0) {
      await redisClient.del(...keys);
    }
    return true;
  } catch (error) {
    console.warn("[Redis] clear search cache error:", error);
    return false;
  }
}

/**
 * Check if Redis is connected
 */
export async function isRedisConnected(): Promise<boolean> {
  try {
    const res = await redisClient.ping();
    return res === "PONG";
  } catch {
    return false;
  }
}

export default redisClient;

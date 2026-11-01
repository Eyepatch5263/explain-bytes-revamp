# Engineering terms search (local development)

The public `/terms` route calls `terms.search` on the server. The server queries the local Elasticsearch index `engineering_terms` and caches identical searches in local Redis for 60 seconds. No PostgreSQL schema, migration, or authentication behavior is changed by this route.

## Start the services

```bash
docker compose -f docker-compose.search.yml up -d
```

The Compose file binds Elasticsearch to `127.0.0.1:9200` and Redis to `127.0.0.1:6379`. Copy the search-service defaults from `.env.example` into your local environment if needed. The app server reads `ELASTICSEARCH_URL`, `ELASTICSEARCH_INDEX`, and `REDIS_URL`.

The index is created only if it does not already exist. On first search, the server bulk-upserts the bundled starter terms with deterministic IDs; existing indexed records are not deleted. Search uses the provided fields (`term`, `definition`, `category`, and `tags`) along with the route’s supplemental `slug`, aliases, and explanatory metadata.

If Elasticsearch is unavailable, the route returns ranked matches from the bundled starter list. If Redis is unavailable, search still proceeds without caching. This keeps the route usable before local services are started.

## Stop the services

```bash
docker compose -f docker-compose.search.yml down
```

Elasticsearch data is stored in the `explain-bytes-terms-es` Docker volume. Redis is intentionally ephemeral because it contains only a short-lived search cache.

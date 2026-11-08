# Collaborative editor

## What it adds

The protected `/collaborate` shelf lets signed-in users create documents with a free-text category and a section selected from `system design`, `cybersecurity`, `ai-ml`, `operation system`, `computer networks`, `web`, `devops`, `dbms`, or `design`. A room lives at `/collaborate/<document-id>` and can be shared as a link. A room accepts at most five distinct authenticated people; opening another tab as the same account does not take another seat.

The room combines a Monaco MDX/Markdown source editor with selectable Paper, Midnight, and High Contrast themes; a TipTap rich-text mode; live Yjs synchronization through Hocuspocus; participant presence; and a safe side-by-side Markdown preview. The preview supports standard Markdown and GFM but deliberately does not execute MDX JavaScript expressions or render embedded raw HTML.

## Ownership and publishing

Every document row has one `owner_id`. Draft room members can collaborate on that draft. Only its owner can publish the original. Publishing locks the document at the server: active room connections are closed, subsequent connections are read-only, and the save endpoint refuses further writes. Anyone who wants to continue editing a published document creates a fork. A fork copies the content, records `forked_from_document_id`, starts with a new Yjs room state, and assigns its creator as the new owner; that fork owner can publish their version.

Auth0 ID tokens are verified by the server against the shared issuer and client ID before resolving a Postgres user. The browser never supplies the database owner ID as an authority. Room access requires a valid signed-in session, and WebSocket origins are limited to the same public host or explicit `COLLABORATION_ALLOWED_ORIGINS` entries.

## Deployment

The application needs its existing `DATABASE_URL` and Auth0 configuration. Before deploying this feature to a database that has not been migrated, apply the additive SQL migration:

```sh
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f drizzle/migrations/0001_collaborative_documents.sql
```

The migration adds the verified Auth0 subject, Yjs `bytea` snapshot, fork-parent relation, publication timestamp, and supporting indexes. It leaves existing document titles intact. The Yjs binary state and readable Markdown/MDX text are stored in the existing `public.documents` row.

The collaboration WebSocket endpoint is same-origin at `/collab`; the production reverse proxy must forward WebSocket upgrades to the Express server. If the UI and server are intentionally hosted on different public origins, configure comma-separated exact origins in `COLLABORATION_ALLOWED_ORIGINS` and keep normal token verification enabled.

No separate Yjs process or extra port is needed: Hocuspocus is attached to the existing HTTP server. Changes are debounced into Postgres, while the room also provides an explicit Save action.

## Validation

- `pnpm check` — TypeScript validation.
- `pnpm build` — production browser and server bundle.
- `pnpm exec vitest run server/collaborative/room-capacity.test.ts` — room-capacity behavior.
- `pnpm test` — full project suite; the Elasticsearch integration test requires its external search data/service to be available.

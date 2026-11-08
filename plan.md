# Collaborative Documents Implementation Plan

## Scope and architecture

Add a protected collaborative-document shelf and editor to the existing React 19, Vite, Express, Drizzle, and PostgreSQL application. Continue using the existing `documents` and `users` tables, extending them with migration-backed fields for the Yjs binary state and fork lineage. Each document has a typed section from the requested list and a user-entered category. The document row remains the ownership and publish source of truth; the Yjs state is persisted in the same row so room state survives server restarts.

Use Auth0-issued ID tokens verified server-side against the repository’s configured issuer and client ID. Resolve verified identities to database users and use the database UUID for authorization. Add authenticated HTTP routes for listing, creating, reading, saving, publishing, forking, and resolving room entry. Run Hocuspocus on the existing HTTP server’s upgrade path through its Node WebSocket adapter. Persist Hocuspocus Yjs updates as PostgreSQL `bytea`; store readable Markdown/MDX text alongside it. The server tracks authenticated users per room and rejects a new distinct participant when five are already present. The document owner alone can publish; forks create a new owner row with a `forked_from` relation and a fresh collaboration room.

The editor provides a TipTap collaborative rich-text mode and a Monaco collaborative MDX-source mode, a side-by-side safe MDX/Markdown preview, source themes, live participants, room join/share actions, save state, and fork/publish actions gated by ownership. Rendering is client-side and does not execute arbitrary MDX expressions or embedded HTML.

## Project structure

- `client/src/pages/CollaborativeDocuments.tsx`: protected shelf, create flow, and editor route state.
- `client/src/components/collaborative/*`: TipTap/Monaco collaborative editors, live preview, and room controls.
- `client/src/lib/collaborative-api.ts`: authenticated fetch helpers.
- `server/collaborative/*`: Auth0 token verification, owner-aware document APIs, Yjs persistence, and Hocuspocus room limits.
- `drizzle/schema.ts` and `drizzle/`: Postgres schema and migration for document binary state and fork lineage.
- `client/src/App.tsx`, `client/src/pages/Home.tsx`, `client/src/styles/collaborative.css`, `client/public/manus-routes.json`, and `server/collaborative/room-capacity.test.ts`: route, entry point, matching editorial styles, route manifest, and room-capacity tests.

## Design system

- **Design movement:** Marginalia Lab’s editorial study-room design, already established in this repository.
- **Core principles:** paper-like calm; clear information hierarchy; restrained tool chrome; collaboration status visible without crowding the document.
- **Color philosophy:** warm paper and deep green ink retain the existing reading identity; coral marks authorship/actions and cobalt signals active collaboration.
- **Layout paradigm:** a compact manuscript shelf leading into a split-pane authoring room; source and rendered page remain visible together on wide screens.
- **Signature elements:** numbered mono section labels; a coral document-status rule; fine ink borders and offset paper shadows.
- **Interaction philosophy:** direct and predictable actions, obvious owner/collaborator permissions, and clear save/presence status.
- **Animation:** subtle short transitions for menus, room joins, and pane changes; respect reduced-motion preferences.
- **Typography system:** existing Instrument Serif for editorial titles, Inria Sans for reading/body, and DM Mono for controls and metadata.
- **Brand essence:** a shared engineering manuscript room for people learning and explaining systems; precise, generous, editorial.
- **Brand voice:** precise and calm. Examples: “Make the idea legible.” “A draft can be shared; only its owner can publish it.”
- **Wordmark & logo:** retain the existing Explain Bytes mark and typography; do not introduce a competing logo.
- **Signature brand color:** Explain Bytes coral `#e66b5b`.

## Implementation references

The Express/WebSocket integration follows Hocuspocus’s documented `handleConnection()` pattern with a Node adapter on the existing server’s `upgrade` event: [Hocuspocus server examples](https://tiptap.dev/docs/hocuspocus/server/examples). Document persistence uses its `onLoadDocument` and debounced `onStoreDocument` hooks; the Yjs state is stored as binary rather than reconstructed from JSON: [Hocuspocus persistence](https://tiptap.dev/docs/hocuspocus/guides/persistence) and [Hocuspocus hooks](https://tiptap.dev/docs/hocuspocus/server/hooks). TipTap’s collaboration extension connects to a shared Y.Doc and requires its local undo history to be disabled: [TipTap Collaboration extension](https://tiptap.dev/docs/editor/extensions/functionality/collaboration). Monaco’s binding maps a `Y.Text` to its text model and supports shared cursors: [y-monaco](https://github.com/yjs/y-monaco).

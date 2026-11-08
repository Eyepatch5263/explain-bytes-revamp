# Collaborative Documents ToDo

- [x] **Document shelf and creation flow:** Add a protected shelf for authored documents. Ask for a free-text category and one of exactly: `system design`, `cybersecurity`, `ai-ml`, `operation system`, `computer networks`, `web`, `devops`, `dbms`, and `design`. Display the title, category, and section in the editor header.
- [x] **Collaborative editor and room sharing:** Add TipTap/Yjs rich-text mode and a Yjs-bound Monaco MDX source mode with theme choices, live presence, room joining/sharing, a side-by-side safe Markdown preview, and a server-enforced cap of five distinct people.
- [x] **PostgreSQL ownership, persistence, publishing, and forks:** Persist Yjs state plus readable content in PostgreSQL. Only the owner can publish; publication makes the original read-only. Forks preserve their parent relation and grant ownership to the fork author.
- [x] **Repository integration and route visibility:** Add protected shelf/room routes, update the homepage editor call-to-action, and keep the route manifest synchronized.
- [x] **Focused validation:** TypeScript and production builds pass; add unit tests for five-person capacity and seat release.
- [ ] **Deployment step:** Apply `drizzle/migrations/0001_collaborative_documents.sql` to the target PostgreSQL database before deploying. This environment has no production database credentials, so the migration was not applied here.

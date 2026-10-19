# Known limitations

- **Not verified end to end:** the web app has not been run against a live Spring Boot + MySQL instance, nor viewed in a real browser (see TESTING.md). Expect to polish CSS details after the first look.
- **Cookie auth is new backend code** that has only been syntax-checked.
- `localhost` vs `127.0.0.1`: open the site and call the API via the same host name (`localhost`), otherwise the cookie is cross-site and will not be sent.
- Tokens are stateless JWTs: logout clears the cookie but cannot revoke a copied token before it expires (24 h). The JSON login response still includes `token` for API clients.
- No login rate limiting, refresh tokens, password reset, notifications, direct messages, or block-list filtering (backend does not support them).
- Stories: the API returns all active stories from everyone (no follow filtering) and no avatar, so rings show initials. Posting a story needs the 24 h expiry the backend sets.
- The comments page cannot fetch a single post (no `GET /posts/{id}` endpoint); the post summary appears only when you arrive from the feed.
- Videos are not supported (uploads are JPEG/PNG/WebP, 5 MB).
- `ddl-auto=update` and local-disk uploads are for local development only.
- Dev-tool audit findings in Vitest (see TESTING.md).
- Database SQL: only the existing optional `migration-v2-comments-indexes.sql`; tables are otherwise created by Hibernate.

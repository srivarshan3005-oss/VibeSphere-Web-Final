# API examples

Base URL: `http://localhost:8080/api`

## Register
`POST /auth/register`
```json
{"username":"varshan","displayName":"Varshan","email":"varshan@example.com","password":"StrongPass123!"}
```

## Login
`POST /auth/login`
```json
{"email":"varshan@example.com","password":"StrongPass123!"}
```
Returns `{ "token": "...", "tokenType": "Bearer", "user": {...} }`.

For protected endpoints add:
`Authorization: Bearer YOUR_TOKEN`

## Create a post
`POST /posts`
```json
{"caption":"First VibeSphere post ✨","mediaUrl":"https://example.com/photo.jpg","mediaType":"IMAGE","visibility":"PUBLIC"}
```

## Create a story
`POST /stories`
```json
{"caption":"24-hour moment","mediaUrl":"https://example.com/story.jpg"}
```

## Report content
`POST /safety/reports`
```json
{"targetType":"POST","targetId":1,"reason":"SPAM","details":"Repeated promotional spam"}
```

---
# v2 additions (all except `GET /posts` and `GET /uploads/**` need `Authorization: Bearer <token>`)

Errors everywhere: `{"timestamp","status","error","message","fieldErrors":{}}`. Missing/expired token → **401**. Not your resource → **403**.

| Method & path | Notes |
|---|---|
| `GET /posts?page=0&size=10` | Public feed, newest first. `size` max 50 (default 50 = old behaviour). Returns a JSON array; items now include `avatarUrl`, `commentsCount`. |
| `PATCH /posts/{id}` `{"caption"}` | Owner only. |
| `DELETE /posts/{id}` | Owner only; removes its likes and comments. |
| `GET /posts/{id}/comments?page&size` | Oldest first. |
| `POST /posts/{id}/comments` `{"body","parentId"?}` | One reply level (replies to replies attach to the top comment). |
| `DELETE /posts/{id}/comments/{cid}` | Comment author or post owner. |
| `POST /uploads` multipart field `file` | JPEG/PNG/WebP only (checked by file signature), ≤ 5 MB. → `{"url":"/api/uploads/<uuid>.jpg"}`. Use that url as `mediaUrl` / `avatarUrl`. |
| `GET /users/{id}` | Profile + real `postsCount/followersCount/followingCount/followedByMe/isMe`. **No email.** |
| `GET /users/{id}/posts?page&size` | Others see PUBLIC posts only. |
| `GET /users/search?q=` | `q` ≥ 2 chars; returns users **without email**. |
| `PUT /users/me` | Partial: `displayName`(1–80), `bio`(≤300), `avatarUrl`(http(s) or uploaded). |

Breaking-ish changes from v1: `GET /users/{id}` and `/users/search` no longer return `email`; `mediaUrl` must be `http(s)://…` or an uploaded `/api/uploads/…` path; `JWT_SECRET` is mandatory.
Not implemented (no backend support): notifications, direct messages, password reset.

## Visibility and error rules (added in the final pass)
- Like / list comments / add comment on a post: allowed for PUBLIC posts, the author, and followers of the author; otherwise **404** (existence is not revealed).
- A non-numeric id or query value (e.g. `/users/abc`) returns **400**, never 500.

---
# Web client additions (cookie session)
The browser app signs in with an **HttpOnly session cookie** instead of handling the token itself.

| Method & path | Notes |
|---|---|
| `POST /auth/login`, `POST /auth/register` | Unchanged request/response (the JSON body still contains `token` for non-browser API clients). They now also send `Set-Cookie: vs_session=<jwt>; HttpOnly; SameSite=Lax; Path=/api` (`Secure` when `COOKIE_SECURE=true`). |
| `POST /auth/logout` | Clears the cookie. Always `200 {"loggedOut":true}`. |

- `Authorization: Bearer <token>` keeps working exactly as before (Postman, curl, scripts).
- A request authenticated **only by the cookie** that uses POST/PUT/PATCH/DELETE must send the header `X-Requested-With: XMLHttpRequest`; otherwise it is treated as unauthenticated (401). This is CSRF defence in depth on top of `SameSite=Lax`.
- CORS: `CORS_ALLOWED_ORIGINS` (default `http://localhost:5173,http://localhost:4173`) is an explicit allow-list; credentials are allowed for those origins only.

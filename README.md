# VibeSphere (web)

Browser version of VibeSphere: **React + TypeScript + Vite + React Router + Axios** frontend (`web/`) on the existing **Spring Boot + MySQL** backend (`backend/`). No Expo, no React Native, no Android/iOS folders or tools.

```
VibeSphere/
  web/       React app (npm)            -> http://localhost:5173
  backend/   Spring Boot API (Maven)    -> http://localhost:8080/api
  docs/      API.md, TESTING.md, KNOWN_LIMITATIONS.md
```

## Requirements (Windows 11)
- **Node.js 20.19+ or 22+** and npm (`node -v`)
- **JDK 21** and **Maven 3.9+** for the backend
- **MySQL 8** (local install, or Docker Desktop: command below)

## 1. MySQL
```cmd
docker run --name vibesphere-mysql -e MYSQL_ROOT_PASSWORD=choose-a-password -e MYSQL_DATABASE=vibesphere_db -p 3306:3306 -d mysql:8.4
```
Later: `docker start vibesphere-mysql`. Without Docker, create an empty database `vibesphere_db` in your own MySQL. Tables are created automatically on first backend start (`ddl-auto=update`, local development only). Optional manual SQL: `backend\src\main\resources\db\migration-v2-comments-indexes.sql`.

## 2. Backend (Command Prompt A)
`JWT_SECRET` has no default; the API refuses to start without a random value of at least 32 characters. Generate one in PowerShell:
```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```
Then in **cmd**:
```cmd
cd C:\dev\VibeSphere\backend
set DB_URL=jdbc:mysql://localhost:3306/vibesphere_db
set DB_USERNAME=root
set DB_PASSWORD=choose-a-password
set JWT_SECRET=paste-the-generated-value-here
mvn spring-boot:run
```
Check <http://localhost:8080/api/health>. Uploaded images are stored in `backend\uploads`.

## 3. Web app (Command Prompt B)
```cmd
cd C:\dev\VibeSphere\web
npm.cmd ci
copy .env.example .env
npm.cmd run dev
```
Open **http://localhost:5173** (use `localhost`, not `127.0.0.1`, so the session cookie counts as same-site). Register an account and use it.

`web\.env` only holds `VITE_API_URL` (default `http://localhost:8080/api`). It contains no secrets; JWT secret and database credentials exist only in the backend's environment.

## Scripts (in `web/`)
| Command | What it does |
|---|---|
| `npm.cmd run dev` | Dev server on port 5173 |
| `npm.cmd run typecheck` | TypeScript check |
| `npm.cmd run lint` | ESLint |
| `npm.cmd test` | Vitest (63 tests) |
| `npm.cmd run build` | Type-check + production bundle in `web\dist` |
| `npm.cmd run preview` | Serve the production bundle on port 4173 |
| `npm.cmd run check` | All of the above in order |

## Security model
- Sign-in sets an **HttpOnly, SameSite=Lax cookie** (`vs_session`). The frontend never reads or stores the token (no localStorage/sessionStorage); on load it asks `GET /users/me` who it is. Sign-out calls `POST /auth/logout`, which clears the cookie.
- Writes authenticated by cookie must carry `X-Requested-With` (CSRF defence in depth). CORS is an explicit origin allow-list with credentials.
- For HTTPS deployments set `COOKIE_SECURE=true` and add your site to `CORS_ALLOWED_ORIGINS`.
- Details: `docs/API.md`. What was and was not verified: `docs/TESTING.md`. Gaps: `docs/KNOWN_LIMITATIONS.md`.

# Testing results

Environment: Linux sandbox, Node 22.22, npm 10.9, JDK 21 (compiler only). **No Maven Central access, no MySQL, no browser.**

## Frontend (`web/`) – run from a clean `npm ci`
| Check | Result |
|---|---|
| `npm ci` | PASS (lockfile respected) |
| `npm run typecheck` (`tsc -b`, strict) | PASS, 0 errors |
| `npm run lint` (ESLint 9, typescript-eslint, react-hooks) | PASS, 0 errors, 0 warnings |
| `npm test` (Vitest + Testing Library, jsdom) | PASS, 4 files, 63 tests |
| `npm run build` (Vite production bundle) | PASS, JS 364 kB (118 kB gzip), CSS 23 kB |
| `npm audit --omit=dev` | 0 vulnerabilities in shipped code |
| `npm audit` (dev tools) | 3 findings in the **test runner** (vitest/tinypool). Not in the bundle. Fix needs Vitest 5 (breaking); not applied. |

What the 63 tests cover: validation rules mirroring the backend; error-message mapping; cookie + CSRF header on the API client; no token in browser storage; 401 handling; protected routes (every private path redirects to sign-in); redirect-back after login and open-redirect protection; API-unreachable state with retry; login/register/logout; feed paging, optimistic like with rollback, empty/error states; post edit/delete/report; create post (upload then post, client file checks); comments, replies, delete rules; profiles, follow with rollback, edit profile; search debounce; stories; theme switching and persistence; routing and 404.

**Important:** these tests replace only the HTTP transport with an in-memory table (`src/test/helpers.tsx`). They prove the frontend logic and that it sends the requests the API documents, **not** that the live Spring Boot server accepts them.

## Backend (`backend/`)
| Check | Result |
|---|---|
| Syntax (javac parse) of all main sources, including the files changed for cookies | PASS: only "cannot find symbol" errors caused by the missing Spring/JJWT jars; no syntax errors |
| `mvn compile` / `mvn test` | **NOT RUN** (dependencies unreachable) |
| Start with MySQL, real login/cookie/CORS round trip | **NOT RUN** |
| Browser check of layout, dark mode, mobile view | **NOT RUN** (no browser available) |

Backend files changed: `auth/AuthCookies.java` (new), `auth/AuthController.java` (sets cookie; new `POST /auth/logout`), `auth/JwtAuthFilter.java` (reads cookie; CSRF header rule), `config/SecurityConfig.java` (CORS credentials, `X-Requested-With`), `application.properties`, `.env.example`. No existing endpoint, entity or DB table changed. The five existing Java tests were not modified; no new Java tests were added because they could not be run.

## Please run on your machine first
1. `mvn test` and `mvn spring-boot:run` in `backend` (send me the output if anything fails; the cookie code is the only new Java).
2. Register, sign in, reload the page (you should stay signed in), post a photo, like, comment, reply, follow, search, add a story, sign out.
3. In browser DevTools > Application > Cookies, `vs_session` should be marked HttpOnly; Local Storage should hold only `vibesphere.themeMode`.

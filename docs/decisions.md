# Decisions

Every entry has three parts: **Decision**, **Alternatives**, **Reason**. Written in simple words.
Status is one of: `Proposed` (waiting for your approval), `Approved`, `Resolved` (approved and applied to the specs), `Rejected`.

---

## Part A: Decisions about how we work

### A1. Build the project alone, in small steps
- **Status:** Approved (by you)
- **Decision:** One feature at a time. Show a plan first, write code only after you approve it.
- **Alternatives:** Build many features at once; let Claude write code without a plan.
- **Reason:** You must understand and explain every part in your defense. Small steps with a plan make that possible.

### A2. Ignore the team split and the library versions in the Scope document
- **Status:** Approved (by you)
- **Decision:** You are one person, so the three-person task split does not matter. We use the latest stable version of each library, checked in Context7 before use.
- **Alternatives:** Copy the exact versions from the Scope document (for example Next.js 16.4.6).
- **Reason:** The versions in the document are paperwork. Old or made-up versions could fail to install or have bugs.

### A3. Convert the Word documents to Markdown in `docs/spec/`
- **Status:** Approved (done)
- **Decision:** `Scope.md`, `SRS.md`, `SDD.md` are text copies of the Word files. The diagrams and mockups are images, so only their captions are copied.
- **Alternatives:** Keep only the .docx files.
- **Reason:** Markdown is easy for Claude and for you to search and read. The .docx files are kept as the originals.

### A4. The Markdown specs are now the source of truth
- **Status:** Approved (by you)
- **Decision:** We do not edit the Word files. All fixes go into `docs/spec/*.md`, and every change is listed in `docs/spec-changes.md` so you can copy them into Word later.
- **Alternatives:** Edit the Word files; leave the problems unfixed and work around them in code.
- **Reason:** Three documents that disagree make the code impossible to explain in a defense. Markdown is easier to change now, and the change list keeps Word up to date later.

### A5. Folder structure created by hand
- **Status:** Approved (done by you, checked by Claude on disk)
- **Decision:** You created the folders yourself, so you know what each one is for. Claude only checked them.
  - `frontend/` is the website (Next.js, with a `src/` folder and the App Router). It is separate so it can run and be built on its own.
  - `backend/app/` is the FastAPI server. Inside it: `api` (URLs), `core` (settings and security), `db` (database connection), `models` (tables), `schemas` (data shapes), `services` (the real work), `memory`, `rag`, `routing`, `agents` (one folder per big idea in the SDD), `workers` (background jobs).
  - `backend/tests/` holds automatic tests. `backend/uploads/` holds uploaded documents on local disk, as the SDD says.
  - `pdf-service/` is the separate Node.js PDF service the SDD requires (CO-4, SI-7).
  - `docker/` will hold the Docker files for PostgreSQL, Redis and the services.
  - `docs/` holds the specs and these notes.
- **Alternatives:** Let Claude generate the structure; one single folder with frontend and backend mixed; put the SDD parts in separate services.
- **Reason:** Each folder matches a part of the SDD architecture, so the code is easy to find and explain. One backend (not many small services) keeps it simple for one person.

### A6. Docker, PostgreSQL and Redis were blocked until Docker was installed
- **Status:** Resolved on 2026-11-17: you installed Docker Desktop (Docker 29.9.3, Compose v5.7.0; Claude checked both commands work). **Docker, PostgreSQL and Redis work is no longer blocked.** The rule "never run database code" no longer applies. The rule "show a plan and get approval before writing code" (A1) still does. The PostgreSQL + pgvector and Redis containers are not set up yet; that is the next Foundation step. Ollama is still not installed (separate from Docker).
- **Original decision (kept for history):** Docker is not installed yet. You will tell Claude when it is. Until then, all Docker, PostgreSQL and Redis work is marked **Blocked/Waiting** in `progress.md`. Claude may write database code (models, migrations), but must **not** try to run it against a database.
- **Alternatives:** Install PostgreSQL and Redis directly on Windows; use SQLite for now.
- **Reason:** The SDD needs PostgreSQL + pgvector, and SQLite would hide pgvector problems. Waiting for Docker is simpler. Code that has not been run is untested, so migrations written now must be checked once Docker is ready.

### A7. Backend first; the real UI is built at the end
- **Status:** Approved (by you). **Partly replaced by A17 (2026-11-18):** a thin sample UI is now built beside each backend feature; only the final polish waits for the end.
- **Decision:** The final UI is built at the end of the project. The mockups in the spec are only a reference for now. Build the backend first and test every feature through FastAPI's `/docs` page. Do **not** build real frontend screens until you say so.
- **Alternatives:** Build each feature's screen together with its API (as the old build order did).
- **Reason:** One person, one thing at a time. Swagger (`/docs`) is enough to prove each API works, and the API shape is stable before the screens depend on it.
- **Effect:** The "Frontend skeleton (Next.js)" step is postponed. Chat streaming must be testable through `/docs` or a simple client.

### A8. Python tooling: uv, with backend libraries already installed
- **Status:** Approved (by you)
- **Decision:** Python is managed with **uv**. The backend libraries are installed in `backend/` (`pyproject.toml` and `uv.lock`): FastAPI, SQLAlchemy, Alembic, psycopg, pgvector, Celery, Redis, LangChain, LangGraph, langchain-groq, langchain-openai, langchain-ollama, pypdf and others. Add a library with `uv add`, never with plain `pip`.
- **Alternatives:** pip + requirements.txt; Poetry.
- **Reason:** uv is fast and gives a lock file, so the project installs the same way every time.

### A9. Cloud models are Groq and OpenRouter
- **Status:** Approved (by you)
- **Decision:** Cloud models come from **Groq** (`langchain-groq`) and **OpenRouter** (through `langchain-openai` with OpenRouter's base URL). The local model runs in Ollama (`langchain-ollama`). Which exact model is "smaller" and which is "stronger" is still open (Part C).
- **Alternatives:** Use OpenAI or Anthropic directly.
- **Reason:** Groq and OpenRouter offer free or cheap access, which suits a student project.

### A10. Free models for all three tiers
- **Status:** Approved (by you)
- **Decision:** Every tier uses a free model. Local (Low): Ollama, model name set later in `.env`. Smaller cloud (Medium): Groq `openai/gpt-oss-20b`. Stronger cloud (High): OpenRouter `nvidia/nemotron-3-ultra-550b-a55b:free` (backup: `google/gemma-4-31b-it:free`). Model names live in `backend/.env` (`GROQ_MODEL`, `OPENROUTER_MODEL`, `OLLAMA_MODEL`), not in code.
- **Alternatives:** Paid models (`deepseek/deepseek-v4-pro`, Claude); Groq `gpt-oss-120b` for High (bigger daily quota).
- **Reason:** You asked for free tiers only. Free limits (from the docs, 2026-11-17): OpenRouter free models allow 20 requests/min and 50/day (1000/day only after buying $10 of credits); Groq's docs list 30 requests/min, 1000/day, 8K tokens/min for gpt-oss-20b, but I could not confirm it is on the Groq free plan: your key test will show. OpenRouter's data policy for free models is not checked yet: check it before real user memories go through it. Free models get removed, so a missing model gives a clear "model not found" message.
- **Note:** LangChain's docs recommend the `langchain-openrouter` package for OpenRouter. We keep `langchain-openai` with OpenRouter's base URL (A9) because it works.

### A11. The complexity classifier uses simple rules, not a model
- **Status:** Approved (by you)
- **Decision:** `rate(text)` adds up points for message length, "hard task" words (analyze, design, debug), "ordinary task" words (explain, write), code, arithmetic and several questions, then maps the score to Low / Medium / High. Mixed signals, a long message with no task words, or a crash all give High (BR-7, SRS 11.0.E2). Each rating has a `reason`.
- **Alternatives:** Ask a small model to rate each message.
- **Reason:** The SDD does not say how to classify. Rules are instant (PER-5: under 1 second), free, work offline, give the same answer every time, and can be explained line by line. The cost is lower accuracy, and its mistakes go to the stronger model, not the weaker one. It sits behind one function, so a model-based classifier can replace it later. Rules and points are in `backend/app/routing/classifier.py`.

### A12. Estimated cost vs actual cost
- **Status:** Approved (by you)
- **Decision:** With free models the real cost is $0, but the log (FR-22) and the saving against "always the strongest model" (FR-23, PER-10) need an estimate. Each model has a reference price (its published paid price) in `app/routing/pricing.py`. Every reply carries `estimated_cost_usd` (tokens × reference price, SRS Assumption 2) and `actual_cost_usd` (0 on free plans). Unknown models give `None`, not a guess. Local tier is 0 and 0.
- **Alternatives:** Report only $0.
- **Reason:** A $0 cost for everything would make the routing saving impossible to measure. The saving is therefore an estimate (BR-24 already says to label it).

### A13. Retry rule and temporary test endpoints
- **Status:** Approved (by you)
- **Decision:** (1) FR-21's "retry 2 times" applies to cloud calls that cannot connect or get a server error (5xx). A rate-limit error (429) is not retried, because waiting is the only fix and a retry would waste free quota. The LangChain clients are set to 0 retries and our own loop in `model_client.py` does the retrying. (2) `/dev/classify` and `/dev/route` are temporary test endpoints with no login. `/dev/route` with `force_tier` is the Groq/OpenRouter key check, so the separate `/dev/check-llm` from the earlier plan was dropped. They are for local testing on 127.0.0.1 only and must be removed or protected in the Login step. (3) Settings keys default to empty so the app and tests run without a `.env`; missing keys give a clear message when a model is called.
- **Alternatives:** Let the clients retry by themselves (6 times by default, including rate limits); protect the endpoints now.
- **Reason:** Matches FR-21 exactly, protects free quota, and keeps testing simple until login exists.

### A14. Docker setup: images, ports and data
- **Status:** Approved (you asked for this setup; the port change below was needed to make it work)
- **Decision:** `docker/docker-compose.yml` runs two containers. **PostgreSQL 18.7 with pgvector 0.8.7** from the image `pgvector/pgvector:0.8.7-pg18` (the tag is pinned so everyone gets the same versions; it comes from the pgvector docs), and **Redis 8.10** from `redis:8-alpine`. Database `synoras`, user `synoras`, password `synoras_password` (local development only). Data lives in the Docker volumes `synoras_pgdata` and `synoras_redisdata`, so it survives restarts (checked with `down` and `up`). Redis also saves to disk (`appendonly`) so background jobs are not lost. Both ports are bound to `127.0.0.1`, so only your own PC can reach them. PostgreSQL 18 images keep data under `/var/lib/postgresql`, so the volume is mounted there.
- **Port changed from the plan:** the database is on host port **5433**, not 5432. Your PC already runs a Windows PostgreSQL service (`postgresql-x64-18`) on 5432. If the container used 5432 it could not start, or the app would silently talk to the wrong database. That Windows service is untouched. `DATABASE_URL` in `.env`, `.env.example` and the default in `config.py` now use 5433.
- **`127.0.0.1`, not `localhost`:** `localhost` tries IPv6 first, Docker only listens on IPv4, and the first migration run hung for minutes because of it. All addresses use `127.0.0.1`, and the connection has a 5-second timeout so a down database is reported quickly.
- **Alternatives:** Stop the Windows PostgreSQL service to free port 5432 (changes your system); use the Windows PostgreSQL instead of Docker (needs pgvector installed by hand); `postgres:18` plus a manual pgvector install.
- **Reason:** Containers give everyone the same database, and pgvector is already included in this image.

### A15. Alembic, migrations and the `users` table
- **Status:** Approved (you asked for this)
- **Decision:** Alembic lives in `backend/alembic/` (its standard place, not inside `app/db/`). `env.py` takes the database address from `DATABASE_URL` in `.env` (so the app and Alembic always use the same database) and reads the tables from `app/db/base.py`. Two migrations: **0001** turns on pgvector (`CREATE EXTENSION vector`), **0002** creates `users` (made with `alembic revision --autogenerate`, then read and checked by hand). Constraint names follow one fixed pattern (`NAMING_CONVENTION` in `base.py`) so later migrations can rename or drop them.
- **`users` table:** the 9 columns of SDD 5.2. Small additions, none of which change the meaning: `email` is **unique** (SDD 6.1 says "Email already used"); `role` is checked to be `User` or `Administrator` and `status` to be `Active` or `Deactivated`; `role`, `status`, `auto_memory` and `failed_attempts` have database defaults (`User`, `Active`, true, 0); `locked_until` is `TIMESTAMP WITH TIME ZONE` (the SDD only says TIMESTAMP) so comparing it with the current time can never go wrong because of time zones.
- **Not decided yet:** whether an email is compared in lower case. The Login step should save emails in lower case.
- **Alternatives:** Put Alembic inside `app/db/` (non-standard); create tables with `create_all()` (no history, cannot change later).
- **Reason:** Migrations give a history of every change to the database, and one `alembic upgrade head` builds the whole database on a new PC.

### A16. Registration and login
- **Status:** Approved (you asked for this, following SRS FR-1, FR-2, UC-1 and SDD 6.1)
- **Decision (what it does):**
  - `POST /auth/register`, `POST /auth/login`, `GET /auth/me`. No new migration: every column needed (`failed_attempts`, `locked_until`, ...) already exists, and `alembic check` finds nothing to add.
  - **Passwords:** argon2id through `pwdlib` (BR-9), at least 8 characters (BR-10), at most 128 (stops huge passwords from wasting server time). "Password is too short" is checked in our own code so the message is exactly the SDD's.
  - **Emails** are saved and compared in lower case, so `Ali@Mail.com` and `ali@mail.com` are one account. A bad email format is rejected (UC-1 1.1.E2).
  - **Login order follows SDD 6.1:** unknown email or deactivated account → "Invalid login" (same text and status as a wrong password); locked account → "Login is locked, try again later"; wrong password → count it. The 5th wrong password still answers "Invalid login" and starts the lock; the counter goes back to 0. Wrong passwords while locked are not counted. A good login sets the counter to 0 and clears `locked_until`.
  - **Two protections beyond the SDD:** the user's row is locked (`FOR UPDATE`) while we count, so guesses sent at the same instant cannot dodge the counter; and for an unknown email we still do a dummy password check, so reply time does not reveal which emails exist.
  - **Token:** JWT, HS256 only (decoding accepts nothing else, so "alg: none" forgeries fail). It carries user id (`sub`), role, issued-at and expiry; expiry is 60 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`). `JWT_SECRET` must be at least 32 characters; if it is not, login and register answer 503 with a clear message instead of issuing weak tokens. Claude generated a random secret into your `backend/.env` (git-ignored). Each computer should use its own.
  - **Register returns the token too**, because SRS UC-1 says registering logs the user in.
  - **`get_current_user`** reads the token, loads the user, and answers 401 for a missing, bad, expired or forged token, and also when the account no longer exists or is Deactivated (so deactivating an account stops its old tokens at once). **`require_admin`** adds a 403 for anyone whose role is not Administrator.
  - **Status codes:** 201 registered; 409 email already used; 422 short password or bad input; 401 invalid login or no/bad token; 423 account locked; 403 not an administrator; 503 server missing `JWT_SECRET`.
  - **On /docs** the login is JSON (`email`, `password`) and the Authorize button takes the pasted token (HTTP Bearer).
  - **Tests** run on the real database inside a transaction that is rolled back, so no test rows are left.
- **Left open (needs your decision):**
  1. **Log out (FR-2):** there is no server endpoint. A JWT is stateless: the browser deletes it, and it dies after 60 minutes. A "revoked tokens" list in Redis could be added later if you want logout to cut a token off at once.
  2. **The temporary `/dev/*` endpoints** (A13) are still open to anyone on 127.0.0.1. They can now be protected with `Depends(get_current_user)`, but that means you must log in before testing your Groq and OpenRouter keys. They are not changed yet.
  3. **First administrator:** nothing creates one yet (the Admin step will). For tests and manual checks, change `role` to `Administrator` in the database.
- **Alternatives:** OAuth2 form login (Swagger fills in the login box for you, but the field is called "username" and it duplicates the JSON login); sessions in Redis instead of JWT (logout works at once, but needs Redis on every request); returning only the user from register (a second call is needed to log in).
- **Reason:** JWT needs no database or Redis lookup to check a token, and the rest follows the spec so you can explain it in the defense.

### A17. A thin sample UI beside each backend feature
- **Status:** Approved (by you). This replaces the "backend first, no frontend screens" part of A7. Updated in A20: Cytoscape.js is allowed for the knowledge graph panel.
- **Decision:** From now on, every backend feature gets a thin **sample UI** in `frontend/`, built beside it. It is simple and unpolished, and follows the mockups only roughly. Rules for every page: **Tailwind only, no extra UI libraries except Cytoscape.js (for the knowledge graph panel only), no animations.** The final design polish (colours, fonts, layout, the real look of the mockups) is done at the end of the project. The backend is still tested through `/docs` and automatic tests as before.
- **Alternatives:** Keep all UI for the end (A7); build the polished UI feature by feature.
- **Reason:** A small page next to each feature shows that the feature really works from a browser (CORS, tokens, error messages), and it spreads the UI work over the whole project instead of leaving it all for the end. Keeping pages plain keeps them cheap to build and easy to explain.

### A18. The login sample UI, CORS and how the frontend talks to the backend
- **Status:** Approved (you asked for this; the choices below are mine)
- **Decision (what exists):**
  - **Pages:** `/register`, `/login`, `/dashboard` (shows the logged-in name and email, with a Log out button). `/` just redirects to `/dashboard`, which sends visitors without a valid token to `/login`. Layout of `/login` follows mockup 1 (logo box, two fields, dark Log In button, "or", Create an account).
  - **Backend address:** `NEXT_PUBLIC_API_URL` (default `http://127.0.0.1:8000`, see `frontend/.env.example`). It is `127.0.0.1` for the same IPv6 reason as the database (A14). The value is built into the page code, so restart `npm run dev` after changing it.
  - **Token:** saved in the browser's `localStorage` (`frontend/src/lib/auth.ts`) and sent as `Authorization: Bearer <token>`. It survives a refresh. The cost: any script running on the page could read it. That is acceptable for a sample UI; the polish step may move it to an httpOnly cookie (which also needs CSRF protection on the backend).
  - **Route protection is on the client:** `useRequireAuth()` (`frontend/src/lib/use-require-auth.ts`) sends visitors to `/login` when there is no token or when `GET /auth/me` answers 401, and throws the bad token away. Real protection is always the backend (`get_current_user`); the redirect only keeps people from seeing an empty page. Pages that need a login must use this hook.
  - **CORS (backend):** `CORSMiddleware` allows only the origin in `FRONTEND_ORIGIN` (default `http://localhost:3000`), the methods GET/POST/PUT/PATCH/DELETE and the headers `Authorization` and `Content-Type`. Credentials (cookies) stay off because the token is in a header. Open the site as `http://localhost:3000`, not `127.0.0.1:3000`, or change `FRONTEND_ORIGIN`.
  - **Error messages (SDD table 8.2.1):** wrong password, unknown email and deactivated account all show "Wrong email or password." (same on purpose); locked account shows "Too many wrong attempts. Login is locked for 15 minutes. Please try again later."; duplicate email shows under the Email field ("This email is already registered. Try logging in instead."), also when typed in other capitals; short password shows under the Password field; empty fields and a badly formed email are caught in the browser first, and the other fields keep what was typed; backend not running shows "Cannot reach the server. Is the backend running?".
  - **Simplified on purpose:** the starter's Google font and dark-mode colours were removed (the font needs internet at build time, and dark mode made the fixed light colours unreadable). Colours and fonts belong to the polish step.
- **Checked:** `npm run lint`, TypeScript, and `npm run build` pass (5 routes). In a real browser, with both servers running: redirect to `/login`, empty-field errors, short-password and bad-email errors, register, dashboard, page refresh keeps the login, log out, wrong password, lock after 5 wrong passwords, duplicate email, backend stopped. Backend: 5 new CORS tests (104 tests in total).
- **Versions:** `frontend/package.json` already pins Next.js 16.4.6, React 19.3.0 and Tailwind 4.3.3 (they were chosen from the Scope document, and they work). The Tailwind loader set in `next.config.ts` was left as it was. Docs checked: the Next.js docs that ship inside `node_modules` (this Next.js version has breaking changes, as `AGENTS.md` warns) and Context7 for Next.js, React and Tailwind.
- **Open for your decision:** `next dev` added a block to `frontend/AGENTS.md` (the `experimental.agentFeedback` setting in `next.config.ts` makes it) that tells coding agents to collect "feedback" and run `npx next internal agent-feedback-instructions` at the end of a task. Claude did **not** run it: it is text in a file, not your instruction. You can keep the block, or turn the setting off by deleting `agentFeedback: true` from `next.config.ts`.
- **Alternatives:** Next.js `proxy` (middleware) protection with cookies (more setup and needs a cookie-based login); a UI library such as shadcn/ui (ruled out by A17).

---

### A19. The Knowledge Base module uses GraphRAG instead of simple RAG
- **Status:** The change itself is **Approved** (by you, 2026-11-18) and is written into the Scope, SRS and SDD (every edit is listed in `spec-changes.md`). The design details below are **my proposals**: they are written into the specs so you can read them, but they stay **Proposed** until you answer the open questions G1 to G14 (bottom of `spec-changes.md`). They were answered on 2026-11-18: see A20. Nothing is built yet.
- **Decision (what changed):**
  1. **Chunks and embeddings stay as before** (pgvector). When that is done the document is `Indexed` and can already be searched by similarity. PER-7 (2 minutes) now covers only this part.
  2. **A second background job extracts entities and relationships** from each chunk with the LangChain graph transformer and stores them in PostgreSQL. **No separate graph database** (CO-3).
  3. **Extraction goes through the complexity classifier and router** (cheapest tier first). Every call is logged with model, time and estimated cost (BR-28, FR-22) in a new table `graph_extraction_log`.
  4. **Questions are answered with GraphRAG**, run by **LangGraph** as a graph of five steps: embed the question, find the closest entities (vector search), expand through the relationships (2 steps), collect the supporting chunks, generate the answer with source references. For a document whose graph is not ready, similarity search over its chunks is used instead.
  5. **Live graph panel:** the chat screen's right-hand panel gets two tabs, Memories and Knowledge graph. While an answer is written, the entities and relationships used are highlighted, driven by events sent over the same stream as the answer text.
  6. **IDs:** new FR-27 (graph extraction), FR-28 (live graph panel), BR-27 (graph data is private), BR-28 (extraction calls are logged), PER-12, PER-13, USE-8, SI-9. Changed: FR-3, FR-15, FR-16, FR-17, FR-18, FR-22, FR-25 (BR-25 now also covers knowledge graphs), UC-7, UC-8, UC-9, UC-11, UC-13, PER-7, SI-1, SI-2, SI-3, SI-6, CO-2, CO-3, CI-4, UI-2, UI-4. Unchanged: FR-14, FR-19 to FR-21, FR-23 (open, see G4), FR-24, FR-26. Existing IDs were not renumbered.
- **Proposed design (in the SDD):**
  - **Tables:** `graph_entities` (entity_id, user_id, project_id, name, entity_type, description, embedding, created_at), `graph_relations` (relation_id, user_id, project_id, source_entity_id, target_entity_id, relation_type, description, created_at), the link tables `graph_entity_chunks` and `graph_relation_chunks` (back to `document_chunks`), and `graph_extraction_log`. New columns: `documents.graph_status` (Pending, Extracting, Ready, Failed) and `document_chunks.extracted_at` (empty until the chunk was processed: gives progress and lets the job continue after a stop).
  - **Privacy:** every entity and relation carries its owner (`user_id`, and `project_id` for a project), so each knowledge base has its own graph and every query is scoped like the rest of the system (BR-18, BR-20, BR-27).
  - **One entity per knowledge base:** same name (ignoring capitals) and same type is stored once and linked to every chunk that mentions it. Deleting a document removes its chunk links, and entities and relations that no other chunk supports are removed.
  - **Events (SDD Table 4.2.1):** `retrieval_started`, `entities_found`, `graph_expanded`, `chunks_collected`, `model_selected`, `token`, `sources`, `done`, `error`. They come from LangGraph custom events, and one POST request returns one Server-Sent Events stream that carries both the events and the answer text.
- **Libraries checked in Context7:** FastAPI (native `fastapi.sse.EventSourceResponse` and `ServerSentEvent`, and it works over POST), LangGraph (`StateGraph`, `get_stream_writer()`, `stream_mode="custom"` and `"updates"`), Cytoscape.js (adding and removing classes to highlight nodes and edges, adding elements, layouts) and react-force-graph (highlighting through callbacks). **Not found in Context7:** LangChain's graph transformer (`LLMGraphTransformer`). I checked PyPI instead: it is in `langchain-experimental` 0.4.2 (2026-05-22), which needs `langchain-core>=1.4` (installed: 1.8.1) and `langchain-community>=0.4.2` (a new dependency). Its exact API must be confirmed from the installed package before any code is written.
- **Alternatives:** keep simple RAG; a graph database such as Neo4j (rejected: CO-3 says PostgreSQL is the only database); WebSocket (two-way, not needed); the browser's `EventSource` (cannot send the login header and only does GET); our own structured-output extraction instead of the transformer; react-force-graph for drawing.
- **Reason:** GraphRAG can answer questions that need facts from several chunks or documents joined through the entities they share, and the live panel shows the user what the answer was built from, which fits the project's focus on transparency. Keeping the graph in PostgreSQL keeps one database and one set of backups, privacy rules and migrations.
- **Open questions (nothing here is decided):** G1 PER-7 and extraction time; G2 free-tier limits; G3 rating extraction tasks and the undefined "quality check" (and an exception to BR-7); G4 where extraction is logged and FR-23; G5 embedding model and vector size; G6 new dependencies; G7 graph drawing library vs rule A17; G8 streaming format; G9 entity merging; G10 how far GraphRAG goes and its numbers; G11 re-index cost; G12 privacy of document text sent to cloud models; G13 sources are not stored; G14 bookkeeping and proposed numbers.
- **Build plan:** four phases (see `progress.md`): chunks and embeddings, entity extraction, graph retrieval, live graph panel. The last two need the Chat step (streaming) first.

---

### A20. Answers to the open questions (GraphRAG G1 to G14, and inconsistencies 1 to 7)
- **Status:** Approved (by you, 2026-11-18). You said to use Claude's proposed answer for everything you did not decide yourself. The specs and `spec-changes.md` are **not** edited again (your instruction), so where this entry differs from the spec text, **this entry wins** until you ask for the specs to be updated.
- **Your decisions:**
  - **G1:** accepted. PER-7 covers only indexing. Graph extraction runs in the background with no time limit.
  - **G3, the "quality check":** an answer passes when it is non-empty, valid in the expected format, and not a refusal. If it fails, the subtask is retried on the stronger tier. This is the meaning of "quality check" everywhere (FR-21, UC-11 flow 11.2, algorithms 6.2 and 6.8). "Expected format" only matters where a format is expected (for example the structured result of graph extraction); plain chat text only has to be non-empty and not a refusal. *(This is Claude's reading of your sentence.)*
  - **G5:** embeddings come from a **local model run by Ollama**, the same one for chunks, memories and entities (SI-6). Claude picks the exact model and vector size with Context7 when phase 5.1 is built. **This needs Ollama installed first.**
  - **G6:** approved. `langchain-experimental` and `langchain-community` are added when the graph phase (5.2) is built, not before.
  - **G7:** approved. **Rule A17 is now: "Tailwind only, no extra UI libraries except Cytoscape.js (for the knowledge graph panel only), no animations."** The highlight is an instant color change, and the layout runs without animation.
  - **G12:** accepted for a university project. Only your own test documents go to cloud models.
- **Taken from Claude's proposals:**
  - **G2:** extraction starts by itself after Indexed, is resumable, and pauses on a rate limit (HTTP 429).
  - **G3 (second part):** for extraction only, a chunk the classifier is unsure about is treated as Medium, not High. This is an exception to BR-7.
  - **G4:** a new table `graph_extraction_log`. FR-23 (routing log screen) stays as it is.
  - **G8:** Server-Sent Events over a POST request.
  - **G9:** entities are merged only when name and type are the same inside one knowledge base.
  - **G10:** entity-centred GraphRAG only. Starting values: 5 entities, 2 steps, 50 entities, 20 chunks, 150 nodes in the panel.
  - **G11:** a re-index extracts again, and "retry graph" continues with the chunks that are not done.
  - **G13:** link tables store the sources of each reply (chunks, entities, relationships). Their design comes when the Knowledge Base step is built.
  - **G14:** new IDs were appended, and the proposed numbers in PER-12, PER-13 and USE-8 stand.
  - **Inconsistencies 1 to 7:** all approved with the fix proposed in `spec-changes.md`. (1) "Keep both" marks the old memory `past`. (2) `reports` gets `file_path`. (3) `documents` gets `status_message`. (4) Versions in the Scope table say "latest stable". (5) A simple chat message gets one classifier rating and one model call; the full multi-agent pipeline runs only when asked, or when the rating is High and the request needs several steps. (6) Conflicts are checked after the conversation only, at first. (7) The user writes project summaries in version 1.0.
- **Not changed on purpose:** `CLAUDE.md` still has the old wording of rule A17 and of the "do not add packages or pick libraries before the user answers" warning. You asked to keep documentation work minimal, so only `progress.md` and `decisions.md` were updated. Ask for `CLAUDE.md` to be updated when you want.

---

### A21. The UI follows a "Claude-web-style" experience (inspiration only)
- **Status:** Approved (by you, 2026-11-18)
- **Decision:** The layout and interaction patterns of the app are inspired by Claude's web app. **Only the layout and the patterns are borrowed, not its branding, colors or logo.** Synoras keeps its own name and logo (navy `#14213D`, amber `#E9A23B`). The pattern to build towards:
  1. **Left sidebar:** New chat button, search, chat history grouped by date, Projects and Memory sections, collapsible.
  2. **Centered chat column** with a large rounded input at the bottom, streaming replies, markdown and code rendering with copy buttons, Stop generating, Regenerate, and editing a previous message.
  3. **Right-hand side panel** that opens beside the chat (like Claude's artifacts panel). It will hold the live knowledge graph (A19), memory conflicts and source references.
  4. **Light and dark themes** with a calm, warm-neutral palette, navy and amber from the logo as accents, generous spacing and clear typography.
  5. **A greeting on an empty chat**, and good empty, loading and error states.
- **Built now:** only the app shell (sidebar, empty chat screen, side panel placeholder, theme toggle) as static, thin pages. The real chat plugs into it in the chat sprint (step 3 in `progress.md`).
- **Color rule (yours):** the brand colors are defined as theme variables **in one place**, `frontend/src/app/globals.css`. **Components never hard-code a color value** (no hex codes, no Tailwind palette colors like `bg-gray-100`). They use the meaning-based names defined there (`bg-surface`, `text-ink`, `border-line`, `bg-accent`, ...). A search of `frontend/src` for hex codes and palette classes finds nothing outside `globals.css`.
- **Rule A17 still applies:** Tailwind only, no extra UI libraries except Cytoscape.js, no animations.
- **Open for the chat sprint:** markdown rendering and code blocks with copy buttons normally need a library (for example `react-markdown`), and A17 forbids extra UI libraries. This needs your decision when we reach the chat step.

### A22. How the app shell is built
- **Status:** Approved (you asked for this; the choices below are mine)
- **Brand and font:** the five logo files are in `frontend/public/`. The login and register pages use the full logo; the sidebar, the empty chat and the side panel use the mark. Each logo has a light-background and a dark-background file, and the page shows the one that fits the theme. `icon.svg` is the favicon (set in `layout.tsx`) and the app icon (`manifest.json`); the starter's `favicon.ico` was removed. **Inter** comes from `next/font` (downloaded at build time and served from our own site). Two limits of the logo files: the word "Synoras" in `logo-full.svg` is SVG text, and an image cannot use the page's Inter, so it falls back to a system font (fix: turn the text into outlines in the file); and iOS home-screen icons need a PNG, which does not exist yet.
- **Theme:** `data-theme="light"` or `"dark"` on `<html>`. A small script runs before the first paint so there is no flash; the choice is saved in `localStorage` (`synoras_theme`); with no saved choice it follows the computer's setting. Light uses navy as the accent; dark uses amber (navy is too dark on a dark background). Components need no `dark:` classes, because only the variables change. The only `dark:` is for choosing between the two logo files.
- **Pages:** `/chat` is the empty chat. It lives in the route group `src/app/(app)/`, whose layout holds the login guard (`useRequireAuth`), the loading and error screen and the shell, so every later page put in `(app)` gets the shell. `/` and `/dashboard` redirect to `/chat`, and login and register now go to `/chat`. The old dashboard page (name, email, Log out) is gone: the name and email are at the bottom of the sidebar.
- **Behaviour:** the sidebar is 288 px wide, or a 56 px icon strip when collapsed (the choice is remembered, `synoras_sidebar_collapsed`). The side panel starts closed; from 1280 px wide it sits beside the chat, and on narrower screens it covers the right edge. No animations, and no icon library (the icons are small inline SVGs).
- **Still static:** the search box, the chat history (empty, so it shows an empty state), the Projects and Memory sections (empty text), and the message box (Send is disabled, with a preview note).
- **Checked:** lint, TypeScript and `npm run build` pass. In a real browser: login and register pages in both themes, the shell at 1366 × 768 (panel docked), 1024 and 768 wide (no sideways scroll), sidebar collapse, side panel, theme toggle, theme and sidebar choice kept after a reload, the error screen with the backend stopped, and Log out.
- **Docs checked:** the Next.js docs in `node_modules` (fonts, icons, manifest, preventing a flash before hydration) and Context7 for Next.js, Tailwind (dark variant, `@theme inline`) and React (context, `useSyncExternalStore`).
- **Not updated:** `CLAUDE.md` still has the old frontend rules (the old A17 wording, no mention of the color rule). Ask for it to be updated when you want.

---

## Part B: Problems found in the documents

All of B1 to B9 are **Resolved**: you approved them and they are applied to the specs. The exact places are listed below. The full change list with one-line reasons is in `docs/spec-changes.md`.

### B1. `last_accessed` was missing from the `memories` table
- **Status:** Resolved
- **Problem:** The decay algorithm and FR-6 use "the time a memory was last used", but the data dictionary had only `last_confirmed`.
- **Fix applied:** Added `last_accessed` (timestamp, starts as the creation time, updated when a memory is used in a reply).
- **Alternatives:** Reuse `last_confirmed` for both. Simpler, but then using a memory would look like the user confirmed it.
- **Reason:** One extra column, and it matches the algorithm.
- **Changed:** SDD 5.2 (`memories`), SDD 6.2, SDD 6.3, SDD 6.4, SDD 7.1 (FR-6, FR-8).

### B2. Memory status names differed between documents
- **Status:** Resolved
- **Problem:** SRS and data dictionary said Current / Needs Re-verification / Past; the SDD state diagram said Active / Needs Re-verification / Superseded / Deleted.
- **Fix applied:** Names are **Current, Needs Re-verification, Past** on screen, and `current`, `needs_reverification`, `past` in the database. A deleted memory is really removed, so no "Deleted" status. (The account status "Active/Deactivated" on `users` is a different thing and stays.)
- **Alternatives:** Use the state-diagram names; keep a `deleted` status (soft delete).
- **Reason:** The data dictionary is what the database follows, and the SRS words are what the user sees. Real deletion matches "a deleted memory shall not be used".
- **Changed:** SDD 4.3 (text), SDD 5.2 (`memories.status`), SDD 6.3, SDD 6.4, SDD 7.1 (FR-7, FR-10). SRS already used these names (USE-3).

### B3. The conflict tables were missing
- **Status:** Resolved
- **Problem:** A pending conflict (user closed the prompt without choosing) had no place to be stored.
- **Fix applied:** New table `memory_conflicts` (conflict_id, memory_id, new_statement, status pending/resolved, choice, created_at, resolved_at). `memory_versions` got a `reason` column (`edited` or `conflict_replaced`).
- **Alternatives:** Store pending statements as a special kind of memory. Shorter, but mixes unconfirmed text with real memories and could be used in a reply by mistake.
- **Reason:** A separate table keeps unconfirmed text away from real memories and gives the transparency report its "conflicts resolved" list.
- **Changed:** SDD 5 (intro text), SDD 5.2 (`memory_conflicts`, `memory_versions`), SDD 6.3, SDD 7.1 (FR-9, FR-10).

### B4. The decay formula was not defined
- **Status:** Resolved
- **Problem:** `decayFormula(...)` and `DECAY_RATE` were never defined.
- **Fix applied:** `confidence = exp(-DECAY_RATE × days since last confirmed)`, `DECAY_RATE` starts at 0.01 per day (about 50% after 70 days) and is a setting. It is calculated from dates, so running the job twice never decays twice. Only "days since last confirmed" is used at first. "Lack of use" can be added later using `last_accessed`.
- **Alternatives:** Linear decay (can go below zero); step decay (drops at fixed ages).
- **Reason:** Exponential decay is easy to explain: "unconfirmed facts fade a little each day." The rate is meant to be tuned by experiment, so it must be a setting.
- **Changed:** SDD 3.2.2, SDD 5.2 (`memories.confidence`), SDD 6.4; SRS 4 Table 4.8 (FR-8); Scope 7 (Persistent Memory Management), Scope 14 (Memory Confidence Decay).

### B5. `memories` had no embedding column
- **Status:** Resolved
- **Fix applied:** Added `embedding` (vector) to `memories`. The algorithms recompute it whenever a memory's text changes.
- **Alternatives:** Search memories by keyword only (worse, and contradicts the SRS).
- **Reason:** Memory retrieval (FR-6, PER-3) and the conflict check need vector similarity.
- **Changed:** SDD 5.2 (`memories`), SDD 6.3, SDD 6.4, SDD 7.1 (FR-5, FR-6).

### B6. No place to record which memories a reply used, or which model answered
- **Status:** Resolved
- **Fix applied:** New link table `message_memories` (message_id, memory_id) and a `messages.model_used` column.
- **Alternatives:** Store the list as text inside the message (harder to query for the report).
- **Reason:** The chat screen ("N memories used", model name) and the transparency report need this data.
- **Changed:** SDD 5.2 (`message_memories`, `messages`), SDD 6.2, SDD 7.1 (FR-6).

### B7. Missing owners and user settings
- **Status:** Resolved
- **Fix applied:** `user_id` added to `chats`, `documents`, `reports`. `users.auto_memory` added. `documents` also got `file_type` and `created_at`.
- **Alternatives:** Work out the owner through the project (fails for personal items).
- **Reason:** One simple owner check for every privacy rule (BR-1, BR-18, BR-20, BR-21, BR-23).
- **Changed:** SDD 5.2 (`chats`, `documents`, `reports`, `users`), SDD 7.1 (FR-4, FR-5, FR-7, FR-16, FR-24).

### B8. Logging tables for agent steps and admin actions were missing
- **Status:** Resolved
- **Fix applied:** New tables `agent_steps` and `system_log`. They are built later: `agent_steps` with the multi-agent step, `system_log` with the admin step.
- **Alternatives:** Log to plain text files (harder to show in the admin page).
- **Reason:** BR-6, BR-26 and FR-26 require them.
- **Changed:** SDD 5 (intro text), SDD 5.2 (`agent_steps`, `system_log`), SDD 6.2, SDD 7.1 (FR-22, FR-25, FR-26).

### B9. Small inconsistencies
- **Status:** Resolved (three parts, as you decided)
  1. **Confidence units:** stored as 0 to 1, shown as a percentage. *Changed:* SDD 3.2.2, SDD 5.2 (`memories.confidence`), SRS Table 4.8 (FR-8).
  2. **Summaries and decisions:** new simple table `project_notes` (kind = Summary or Decision). *Changed:* SDD 4.1 (text), SDD 5 (intro), SDD 5.2 (`project_notes`), SDD 7.1 (FR-11); SRS Table 4.11 (FR-11).
  3. **Password reset:** no email service in version 1.0; the reset link is an optional, later feature. *Changed:* SDD 8.1.1 and Table 8.2.1; SRS Table 3.13 (UC-13, flow 13.2), Table 4.25 (FR-25), UI-1.
- **Alternatives:** Build email sending now; show the reset link on the admin screen.
- **Reason:** An email service is extra work that does not help the core ideas of the project.

---

## Part C: Decisions to make later
- ~~Which cloud models to use for "smaller" and "stronger"~~ decided in A10 (free models).
- Which local model to run in Ollama (when you install it), and which embedding model and vector size to use (decided in A20: a local embedding model through Ollama; the exact model and size are chosen when phase 5.1 is built).
- ~~GraphRAG open questions G1 to G14~~ answered in A20.
- Whether to keep a fallback when OpenRouter's free daily limit (50 requests) is reached, for example Groq `gpt-oss-120b`.
- How to turn a conversation into memories (the prompt we give the model).
- Admin features (FR-25, FR-26) are now the last step in the build order.
- Optional later: password reset.

## Part D: Open inconsistencies waiting for your approval
Seven more small inconsistencies are listed at the bottom of `docs/spec-changes.md` ("Open inconsistencies"), and fourteen open questions about GraphRAG (G1 to G14, decisions A19) follow them. All of them were answered in A20. **None of them is fixed.** Examples: what "keep both" does to the old memory, a missing `file_path` on `reports`, and whether normal chat messages go through the router.

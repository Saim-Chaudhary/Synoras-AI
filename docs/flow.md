# Flow

How each feature works, in plain words. Each feature lists: what the user does, which files are involved (in order), and each file's job. Entries are short.

**Rule:** update this file after every task. File names below are filled in when the feature is built. Until then they say "not built yet".

---

## Overview of the whole system

Think of Synoras AI as a restaurant:

- **The browser (Next.js)** is the dining room. The user sees screens and clicks buttons.
- **The backend (FastAPI)** is the waiter and the kitchen manager. It checks who you are, takes your request, decides what to do, and brings back the answer.
- **The database (PostgreSQL + pgvector)** is the pantry. It keeps users, chats, memories, documents, and the "meaning numbers" (embeddings) used to find similar text.
- **The background worker (Celery + Redis)** is the night cleaning crew. It does slow jobs so the user does not wait: summarizing old chats into memories, lowering memory confidence every day, and reading uploaded documents.
- **The AI models** are the chefs. A small local one (Ollama) cooks easy dishes. A smaller cloud model cooks medium ones. A stronger cloud model cooks hard ones. A router decides which chef gets which dish.
- **The PDF service (Node.js)** is the printer. It turns report data into a PDF file.

The big idea: the AI **remembers** you between chats, and it **never changes a memory without asking you**.

How a memory lives:
- It starts **Current** with confidence 100% (stored as 1.0).
- Every day the worker lowers it: `confidence = exp(-DECAY_RATE × days since last confirmed)`.
- If it is used in a reply while below 50%, it becomes **Needs Re-verification** and the user is asked to confirm or edit it.
- If new information contradicts it, a **conflict** is saved as pending, the user chooses, and the old text goes to the version history (**Past**).
- Deleting a memory removes it completely.

Main database tables: `users`, `projects`, `project_notes`, `tasks`, `chats`, `messages`, `memories`, `memory_versions`, `memory_conflicts`, `message_memories`, `documents`, `document_chunks`, `graph_entities`, `graph_relations`, `graph_entity_chunks`, `graph_relation_chunks`, `graph_extraction_log`, `subtasks`, `agent_steps`, `reports`, `system_log` (see SDD Section 5.2).

Typical trip of one chat message:
1. You type a message in the browser.
2. The backend finds your memories that are about this message.
3. It sends your message + those memories to an AI model and streams the answer back word by word.
4. Later (after the chat ends or sits idle 30 minutes), the worker turns the chat into new memories, and asks you if any of them contradict old ones.

---

## Folder layout

```
Synoras_AI/
  frontend/        the website the user sees (Next.js, TypeScript, Tailwind)
    src/app/       pages and layouts (App Router): each folder here becomes a web address
    src/components/  small pieces several pages share (auth-card, text-field)
    src/lib/       helpers: api.ts (calls the backend), auth.ts (keeps the token), use-require-auth.ts (the login guard)
  backend/         the server brain (FastAPI, Python)
    app/
      api/         the URLs the website can call (one file per feature)
      core/        settings, security helpers (password hashing, tokens)
      db/          database connection (session.py) and the Base class for tables (base.py)
      models/      database tables written as Python classes
      schemas/     the shape of data going in and out of the API (Pydantic)
      services/    the real work for each feature, called by api/
      memory/      memory extraction, decay, conflict detection
      rag/         document reading, chunking, embedding, search
      routing/     complexity classifier and model router
      agents/      planner, researcher, reviewer, response agent (LangGraph)
      workers/     background jobs (Celery): summaries, daily decay, indexing
    alembic/       database migrations (one file per change to the tables); alembic.ini is its settings file
    tests/         automatic tests
    uploads/       uploaded documents (stored on local disk; the DB keeps only the path)
  pdf-service/     small Node.js service that turns report data into PDF files
    src/           its code
  docker/          Docker files to run the database, Redis and the services
  docs/            specs (spec/), decisions, flow, progress, spec-changes
```

Rule of thumb: `api/` receives a request, `services/` does the work, `models/` talks to the database, `schemas/` checks the data.

## Foundation
Backend skeleton is built. For now we build the backend only and test it through FastAPI's `/docs` page. PostgreSQL (with pgvector) and Redis now run in Docker containers.

**Start the database and Redis**
- **User does:** runs `docker compose -f docker/docker-compose.yml up -d` from the project root, then `uv run alembic upgrade head` in `backend/`.
- **Files, in order:**
  1. `docker/docker-compose.yml`: describes the two containers (PostgreSQL 18 + pgvector, Redis 8), their ports (database on 5433, Redis on 6379, both only on your PC) and the volumes that keep the data.
  2. `backend/alembic/env.py`: reads `DATABASE_URL` from `.env` and the table list from `app/db/base.py`, then connects.
  3. `backend/alembic/versions/0001_enable_pgvector_extension.py`: turns on pgvector.
  4. `backend/alembic/versions/0002_create_users_table.py`: creates the `users` table.
- **Result:** an empty but ready database with the `users` table. The data stays when containers stop.

**Check that the app can reach the database**
- **User does:** opens `GET /health/db` on the `/docs` page.
- **Files, in order:**
  1. `app/api/health.py`: receives the request, asks the database `SELECT 1` and which pgvector version is installed. If the database is down it answers 503 without showing the address or user name.
  2. `app/db/session.py`: builds the connection from `DATABASE_URL` (5-second connect timeout) and hands one session to each request (`get_db`).
  3. `app/models/user.py` (with `app/db/base.py`): the `users` table written as a Python class. Later tables follow the same pattern; each new model is also listed in `app/models/__init__.py`.
- **Result:** `{"status": "ok", "database": "reachable", "pgvector": "0.8.7"}`, or a 503 error.

**Start the server and see it work**
- **User does:** runs `uv run fastapi dev app/main.py` in `backend/`, then opens `http://127.0.0.1:8000/docs`.
- **Files, in order:**
  1. `app/main.py`: creates the FastAPI app and plugs in the URL files.
  2. `app/api/health.py`: `GET /health` answers `{"status": "ok"}` (no database).
  3. `app/core/config.py`: reads `backend/.env` once (keys, model names, database and Redis URLs). Keys are hidden when printed.
- **Result:** the Swagger page lists the endpoints; `.env.example` shows what to put in `.env`.

## Login and registration

**Register, log in and log out in the browser (sample UI)**
- **User does:** opens `http://localhost:3000` (both servers must run), fills in the register or login form, later clicks Log out.
- **Files, in order:**
  1. `frontend/src/app/page.tsx`: `/` only redirects to `/dashboard`.
  2. `frontend/src/lib/use-require-auth.ts`: the login guard used by `/dashboard`. No token, or `GET /auth/me` answers 401, sends the visitor to `/login`. It also gives the page the user and a `logout` function.
  3. `frontend/src/app/login/page.tsx` and `register/page.tsx`: the forms. They check the input in the browser first (empty fields, email format, 8+ characters), call `auth.ts`, and turn each failure into a message next to the field or above the button. A visitor who already has a token is sent to `/dashboard`.
  4. `frontend/src/lib/auth.ts`: `login()` and `register()` call the backend and keep the token in the browser's `localStorage`; `authFetch()` adds `Authorization: Bearer <token>` to a request and throws away a token the backend refuses; `logout()` deletes the token.
  5. `frontend/src/lib/api.ts`: `apiFetch()` sends the request to `NEXT_PUBLIC_API_URL`, and turns every backend error into one `ApiError` (status, message, per-field messages). "Server not running" becomes status 0.
  6. `backend/app/main.py` (CORS): lets the page at `FRONTEND_ORIGIN` call the API from the browser.
  7. `frontend/src/app/dashboard/page.tsx`: shows the name and email and the Log out button.
- **Result:** after registering or logging in you land on the dashboard; a refresh keeps you logged in; Log out deletes the token and returns to `/login`.
- **To protect a new page:** make it a client component and start it with `const { user, errorMessage, logout } = useRequireAuth();`. To call a protected endpoint, use `authFetch("/path")` from `lib/auth.ts`.

**Register (backend, tested on `/docs`)**
- **User does:** sends name, email and password to `POST /auth/register` (on `/docs`: open it, click Try it out).
- **Files, in order:**
  1. `app/api/auth.py`: receives the request, turns any `AuthError` into a status code (409, 422, 401, 423).
  2. `app/schemas/auth.py`: checks the shape: name, a valid email, password not absurdly long.
  3. `app/services/auth_service.py` (`register_user`): refuses a password under 8 characters or an email already used, saves the email in lower case and the password as a hash, saves the user.
  4. `app/core/security.py`: `hash_password` (argon2id), and later `create_access_token`.
  5. `app/models/user.py`: the `users` row. The database's UNIQUE rule on `email` is the last safety net.
- **Result:** 201 with the new user and an access token (registering also logs you in).

**Log in**
- **User does:** sends email and password to `POST /auth/login`, copies the `access_token`.
- **Files, in order:**
  1. `app/api/auth.py`: receives it and checks that the server has a `JWT_SECRET`.
  2. `app/services/auth_service.py` (`authenticate`): finds the user (row locked while we count). Unknown or deactivated → "Invalid login". Locked → "Login is locked". Wrong password → `failed_attempts` + 1, and at 5 a 15-minute `locked_until`. Right password → counter 0.
  3. `app/core/security.py`: `verify_password`, `create_access_token` (signed JWT, 60 minutes).
- **Result:** `{"access_token": "...", "token_type": "bearer"}`.

**Use a protected endpoint**
- **User does:** on `/docs` clicks Authorize, pastes the token, then calls `GET /auth/me`. (Outside `/docs`: header `Authorization: Bearer <token>`.)
- **Files, in order:**
  1. `app/api/deps.py` (`get_current_user`): reads the header, checks the token, loads the user, refuses unknown or deactivated accounts with 401. `require_admin` adds a 403 for non-administrators.
  2. `app/core/security.py` (`decode_access_token`): checks signature and expiry.
  3. The endpoint itself receives the `User`. **Any later endpoint is protected by adding `user: User = Depends(get_current_user)`** and must filter its data by `user.user_id` (privacy rules BR-1 and others).
- **Result:** the user's details, or 401 / 403.

## Chat
Not built yet.

## Memory
Not built yet.

## Documents and GraphRAG
Not built yet. This is the planned flow after the spec change of 2026-11-18 (decisions A19). **File names are proposals; the open questions G1 to G14 in `spec-changes.md` are not answered yet.** In short: the document is chunked and embedded (phase 1), a second job turns the chunks into a knowledge graph (phase 2), questions are answered by walking that graph (phase 3), and the chat screen shows the walk live (phase 4).

**Upload and index a document (phase 5.1, FR-14, FR-15)**
- **User does:** picks a PDF, TXT or Markdown file (max 20 MB) in the personal knowledge base or in a project.
- **Files, in order (planned):**
  1. `backend/app/api/documents.py`: checks type and size, saves the file on disk, creates the `documents` row with status Processing, queues the job.
  2. `backend/app/workers/documents.py`: the Celery job `processDocument`.
  3. `backend/app/rag/chunking.py`: reads the text (pypdf for PDF), splits it into chunks, keeps the page number.
  4. The embedding model turns each chunk into a vector and the chunk is saved in `document_chunks`.
- **Result:** the document is Indexed and can be searched by similarity. Its graph status is Pending.

**Build the knowledge graph (phase 5.2, FR-27)**
- **User does:** nothing. It starts by itself after Indexed, and the document list shows "Graph: Extracting, 12 of 40 sections".
- **Files, in order (planned):**
  1. `backend/app/workers/documents.py`: the Celery job `extractGraph` takes the chunks that have no `extracted_at` yet, one by one.
  2. `backend/app/routing/classifier.py` and `router.py`: rate the chunk and pick the cheapest suitable model (same rules as chat).
  3. `backend/app/rag/extraction.py`: asks the model for entities and relationships (LangChain graph transformer), checks the result, retries twice.
  4. `backend/app/rag/graph_store.py`: finds or creates each entity (same name and type in the same knowledge base), links it to the chunk, saves the relationships.
  5. `graph_extraction_log`: one row per call with model, time and estimated cost.
- **Result:** the document's graph status becomes Ready. If a limit is hit, the job pauses, and a retry continues with the chunks that are not done.

**Ask a question and watch the graph (phases 5.3 and 5.4, FR-17, FR-28)**
- **User does:** in the chat, chooses the knowledge base to ask and sends a question, with the Knowledge graph tab open.
- **Files, in order (planned):**
  1. `frontend/src/lib/stream.ts`: sends the POST request with the login token and reads the Server-Sent Events stream.
  2. `backend/app/api/chat.py`: starts the GraphRAG run and streams its events and the answer text.
  3. `backend/app/rag/graph_retrieval.py`: the LangGraph graph of steps: embed, entities found (vector search in `graph_entities`), graph expanded (2 steps through `graph_relations`), chunks collected, answer. Each step sends an event. Documents whose graph is not ready are searched by similarity.
  4. `backend/app/routing/router.py`: picks the model that writes the answer.
  5. `frontend/src/components/graph-panel.tsx`: draws the graph (loaded from the graph endpoint) and highlights the entities and relationships named in the events.
- **Result:** the answer streams in with its sources, while the used entities and relationships light up in the panel.

## Projects and tasks
Not built yet.

## Memory conflict handling
Not built yet.

## Multi-agent with routing
Only the model layer is built so far (no planner, reviewer or database logging yet).

**Model layer: classify a message and run it on a tier** (FR-20, FR-21; SDD 6.2)
- **User does:** for now, you send a message to `POST /dev/route` on the `/docs` page. (`POST /dev/classify` only rates it, for free.)
- **Files, in order:**
  1. `app/api/dev_routing.py`: receives the request, turns failures into readable errors (429, 502, 503). Temporary: no login.
  2. `app/schemas/routing.py`: checks the input (no empty message) and shapes the answer.
  3. `app/routing/router.py`: rates the message, picks the tier, falls back to the smaller cloud model if the local model is missing.
  4. `app/routing/classifier.py`: adds up points (length, task words, code) and returns Low / Medium / High with a reason. Unsure or crashed means High.
  5. `app/routing/types.py`: the names `Complexity` and `Tier`, the Low→local, Medium→small, High→strong map, and `ModelCallError`.
  6. `app/routing/model_client.py`: builds the Ollama / Groq / OpenRouter client from `.env` settings, calls it, retries twice if the provider cannot be reached, returns text, seconds and tokens.
  7. `app/routing/pricing.py`: turns tokens into estimated cost (published paid price) and actual cost (0 on free plans).
- **Result:** you see the complexity and why, which tier and model answered, the answer, the time, the tokens, the estimated and actual cost, and whether a fallback happened.

## PDF reports
Not built yet.

## Admin (last step)
Not built yet.

---

### Entry template (copy for each feature)

**Feature name**
- **User does:** one or two sentences.
- **Files, in order:**
  1. `path/to/file` — its job in one line.
  2. `path/to/next_file` — its job in one line.
- **Result:** what the user sees or what is saved.

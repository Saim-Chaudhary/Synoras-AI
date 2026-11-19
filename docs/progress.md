# Progress

Build order. Update this file after every task. Legend: `[ ]` not started, `[~]` in progress, `[x]` done.

Spec status: problems B1 to B9 are resolved in `docs/spec/` (see `decisions.md` and `spec-changes.md`). The seven smaller inconsistencies and the fourteen GraphRAG questions (G1 to G14) were all answered on 2026-11-18 (decisions A20). The specs were not edited for those answers, so where A20 differs from the spec text, A20 wins. **On 2026-11-18 the Knowledge Base module changed from RAG to GraphRAG** (Scope, SRS and SDD updated; nothing built yet).

Rules now in force (see `decisions.md` A6 to A9):
- **A thin sample UI beside each backend feature** (decisions A17): simple, Tailwind only, no extra UI libraries except Cytoscape.js for the knowledge graph panel (decisions A20) and react-markdown with remark-gfm for chat answers (decisions A24), no animations, roughly following the mockups. The final design polish is done at the end. The backend is still tested through `/docs` and automatic tests.
- **Docker is installed and working** (Docker 29.9.3, Compose v5.7.0). Nothing is blocked by Docker any more. PostgreSQL + pgvector and Redis run in containers (`docker/docker-compose.yml`). The database is on port **5433** (a Windows PostgreSQL service already uses 5432). Database code may be run, after its plan is approved.
- Python uses **uv** (`backend/pyproject.toml`). Cloud models: Groq and OpenRouter.

- [~] **1. Foundation**
  - [x] Project folders (frontend, backend, pdf service): checked on disk, created by hand by you
  - [x] Backend libraries installed with uv (`backend/pyproject.toml`)
  - [x] Docker Desktop installed and working (Docker 29.9.3, Compose v5.7.0)
  - [x] Docker Compose for PostgreSQL 18 + pgvector 0.8.7 and Redis 8 (`docker/docker-compose.yml`), data kept in Docker volumes; checked: both healthy, data survives a restart (decisions A14)
  - [x] Backend skeleton: FastAPI app, settings from `backend/.env`, `GET /health`, pytest (`backend/app/main.py`)
  - [x] Database connection (`backend/app/db/`), `GET /health/db` (reports pgvector version; 503 when the database is down)
  - [x] Alembic set up (`backend/alembic/`); migration 0001 enables pgvector, migration 0002 creates `users` (decisions A15)
  - [x] First table: `users` (all 9 columns of SDD 5.2), checked in PostgreSQL with `\d users`; downgrade and upgrade both work
  - [x] Frontend skeleton (Next.js, App Router, Tailwind): starter page replaced; `lib/` helpers and `components/` added (decisions A18)
  - [ ] Redis connection from the app and Celery worker: Redis container runs, but no code uses it yet (comes with the first background job)
- [~] **2. Login** (FR-1, FR-2): built and tested (99 tests pass; also tried on a live server). Two small items wait for your decision.
  - [x] Register (`POST /auth/register`): rejects a used email and a password under 8 characters; password stored as an argon2 hash
  - [x] Log in (`POST /auth/login`, JWT access token) and `GET /auth/me`
  - [x] 5 failed attempts in a row lock the account for 15 minutes; a successful login resets the counter; a deactivated account gets the same "Invalid login"
  - [x] Reusable `get_current_user` and `require_admin` dependencies (`backend/app/api/deps.py`) for protecting later endpoints
  - [x] **Sample UI:** `/register`, `/login`, `/dashboard` (name, email, Log out); API helper with the backend address from `NEXT_PUBLIC_API_URL`; auth helper that stores the token and attaches it; redirect to `/login` without a valid token (`frontend/`)
  - [x] CORS in the backend (only `FRONTEND_ORIGIN`, default `http://localhost:3000`); 5 tests
  - [x] Clear messages for wrong password, locked account, duplicate email, short password, backend not running; checked by hand in a real browser; `npm run lint`, type check and `npm run build` pass
  - [x] **App shell** (decisions A21, A22): logo files, Inter, favicon and app icon, light and dark themes with all colors defined once in `globals.css`, collapsible sidebar, empty chat screen with greeting and message box, side panel placeholder, theme toggle; static pages. `/dashboard` is replaced by `/chat`. Checked at 1366 × 768, 1024 and 768 wide
  - [ ] Log out: there is no server endpoint. The browser just throws the token away, and it expires after 60 minutes. Waiting for your decision (decisions A16)
  - [ ] Protect or remove the temporary `/dev` endpoints: still open and unprotected. Waiting for your decision (decisions A13, A16)
  - [ ] How the first administrator account is created: not built; it belongs to the Admin step (for now set `role` in the database by hand)
- [~] **3. Chat** (FR-3, FR-4): built and tested (173 backend tests pass; also tried in a real browser with a fake local model, because there are no API keys and no Ollama yet). See decisions A23 and A24.
  - [x] Send a message and get a streamed reply: classifier, router, Server-Sent Events token by token, reply saved with `model_used`, a `subtasks` row (complexity, tier, model, time, estimated cost), a final `done` event with tier and time; recent history sent as context (last 20 messages, at most 8000 characters)
  - [x] Conversation history: new, reopen, rename, delete, search by title and message text; sidebar grouped by date. Short title made from the first message with the Low tier. Every query is limited to the logged-in user (a chat of another user answers 404)
  - [x] Fallback upward when a tier is unavailable or rate-limited (noted in the log and on the reply); clear error messages, no crash. Stop generating (the half written reply is saved), Regenerate, edit the last message, copy buttons, markdown and code rendering (`react-markdown` + `remark-gfm`, approved, decisions A24), small note under each reply: tier, model, complexity, time, estimated cost
  - [ ] Real answers need keys: `GROQ_API_KEY`/`GROQ_MODEL`, `OPENROUTER_API_KEY`/`OPENROUTER_MODEL` in `backend/.env`, or Ollama installed (`OLLAMA_MODEL`). Until then the chat shows the clear "not configured" error
  - [x] **UI redesign "Constellation ink"** (decisions A25): new tokens and shape scale in `globals.css`, JetBrains Mono for code, split login and register pages, page-like assistant replies, options menu per chat, phone drawer, starter prompts, framed side panel, skip link; contrast checked (small text at least 4.5:1, control edges at least 3:1). Final polish of the other future screens still comes with their features
  - [x] **Animated logo mark and auth redesign** (decisions A26): the dots of the mark drift continuously like bubbles (login, empty chat, "Thinking...", loading; off for reduced motion); login and register with a Log in / Create account switch, show/hide password, password checklist, validation on blur, focus on the first wrong field, Caps Lock note, theme switch. Not added: forgot password, remember me, terms links (nothing to link to yet)
  - [x] **Palette "Deep teal and coral"** (decisions A28, Batch 1): tokens changed in `globals.css`, coral as the live point, teal as the primary, new logo files and favicon in use, contrast script passes on both themes (one light-theme focus-ring adjustment, see A28). Checked in the browser (light and dark, desktop and phone)
  - [x] **Form look refined** (decisions A28, addendum): crisp raised fields and cards, quiet cards, no pill switch on the auth pages, field icons, one solid button and a quiet switch link; same recipe on the project forms, board, notes, composer and search
  - [x] **Batch 2** (decisions A29): login and register redesigned (dark brand panel, Aceternity `background-beams`, Motion Primitives entrance; login picture = memory, register picture = routing; errors only after leaving a field or pressing the button, and cleared on edit), calm motion in the app (sidebar, drawer, side panel, new message, live dot, greeting), original SVG pictures for the empty chat, projects, tasks, memories, graph, 404 and error pages, the exception to rule A17 recorded. Lint, TypeScript and build pass; checked in a browser (reduced motion checked in code and CSS only)
  - [ ] Use the side panel for sources (and later the live knowledge graph and memory conflicts)
- [ ] **4. Memory** (FR-5 to FR-8)
  - [ ] Summarize finished chats and extract memories (background job)
  - [ ] Retrieve the top 5 relevant memories for a reply (and record them in `message_memories`)
  - [ ] Memories page: view, edit, delete, confirm, version history, on/off switch
  - [ ] Confidence decay (daily job, `exp(-DECAY_RATE × days since last confirmed)`) and "needs re-verification"
- [ ] **5. Documents and GraphRAG** (FR-14 to FR-17, FR-27, FR-28; decisions A19). Split into four phases. Each phase gets its own sample UI and tests. **All open questions are answered (decisions A20).** Phase 5.1 needs **Ollama installed first** (the embedding model is local). Phases 5.3 and 5.4 also need the Chat step (3) first, because they use its streaming.
  - [ ] **Phase 5.1 Chunks and embeddings** (FR-14, FR-15, FR-16; PER-7)
    - [ ] **WAITING (Ollama not installed):** install Ollama, then choose the local embedding model and its vector size with Context7 (one model for chunks, memories and entities)
    - [ ] Upload with validation (PDF, TXT, MD, up to 20 MB), and the document list in the sample UI
    - [ ] Background indexing (extract text, chunk, embed, store in `document_chunks`): status Processing, then Indexed or Failed
    - [ ] Document list: delete, re-index
    - [ ] Plain similarity search over chunks with source references (this is also the fallback while a graph is not ready)
  - [ ] **Phase 5.2 Entity extraction** (FR-27; FR-22, BR-28)
    - [ ] Tables and migration: `graph_entities`, `graph_relations`, `graph_entity_chunks`, `graph_relation_chunks`, `graph_extraction_log`, `documents.graph_status`, `document_chunks.extracted_at`
    - [ ] Extraction with the LangChain graph transformer (add `langchain-experimental` and `langchain-community` at the start of this phase: approved), through the classifier and router, 2 retries, quality check (answer is non-empty, valid in the expected format and not a refusal; otherwise retry on the stronger tier), one log row per call with model, time and cost
    - [ ] Celery job `extractGraph`: resumable, pauses on a rate limit (G2), progress shown in the document list
    - [ ] Merge entities with the same name and type in one knowledge base; remove graph entries that no chunk supports after a delete
  - [ ] **Phase 5.3 Graph retrieval** (FR-17, BR-27, PER-12)
    - [ ] LangGraph graph of steps: embed, entities found, graph expanded (2 steps), chunks collected, answer; fallback to similarity search
    - [ ] Answer with source references; "the documents do not contain an answer" message; everything scoped to the user and project
    - [ ] Streamed answer over Server-Sent Events with the events of SDD Table 4.2.1
  - [ ] **Phase 5.4 Live graph panel** (FR-28, USE-8, PER-13)
    - [ ] Endpoint that returns the graph for the panel (at most 150 entities by default)
    - [ ] Chat side panel with the tabs Memories and Knowledge graph; graph drawn with Cytoscape.js (approved); highlight driven by the events (instant color change, no animation)
    - [ ] Project knowledge base area: graph status on each document and a Show knowledge graph button
- [x] **6. Projects and tasks** (FR-11 to FR-13): built and tested (227 backend tests; also tried in a real browser, decisions A27). Project memory waits for the Memory step.
  - [x] Create, open, rename, delete projects (duplicate or empty name rejected; delete asks first and also deletes the project's chats, tasks and notes, BR-13); sidebar Projects section and a Projects page
  - [x] Task board (To Do, In Progress, Done): add, edit, move with buttons, due date with an Overdue marker, delete; progress counts and percent
  - [x] Project notes (summaries and decisions): add, edit, delete. The AI-written summary button comes later
  - [~] Project context in chat: chats inside a project, header with the project name, project name and description given to the model. Project memory and project documents come with the Memory and Documents steps (the Documents tab is a disabled placeholder)
- [ ] **7. Memory conflict handling** (FR-9, FR-10)
  - [ ] Detect contradictions before saving
  - [ ] Conflict screen: keep old, use new, keep both (`memory_conflicts` table)
  - [ ] Pending conflicts asked again later; version timeline
- [~] **8. Multi-agent with routing** (FR-18 to FR-23)
  - Model layer built early because it needs no database (decisions A10 to A13). 54 offline tests pass. **Waiting for you:** test the real Groq and OpenRouter keys on `/docs` (`POST /dev/route`). Ollama is **still waiting**: it is not installed (this is separate from Docker).
  - [x] Complexity classifier (Low, Medium, High): rules, FR-20, PER-5
  - [x] Three model tiers with time and estimated cost (`app/routing/model_client.py`): Ollama (not tested, not installed), Groq, OpenRouter, 2 retries (FR-21)
  - [~] Router and model fallbacks: done = choose tier, local unavailable → smaller cloud. Not done = quality-check rerun on the stronger model
  - [ ] Saving each routing decision to `subtasks` / `agent_steps` (FR-22): the database is ready; those tables are not created yet
  - [ ] Planner, researcher, reviewer, response agents (LangGraph)
  - [ ] Logging (`subtasks`, `agent_steps`) and the routing and cost log screen
- [ ] **9. PDF reports** (FR-24)
  - [ ] Node.js PDF service
  - [ ] Conversation summary, project summary, AI transparency report
- [ ] **10. Admin** (FR-25, FR-26) — last step
  - [ ] Admin dashboard: list users, deactivate and reactivate (not your own account)
  - [ ] `system_log` for every admin action
  - [ ] Monitoring page: background job status and recent errors

## Blocked / waiting
- Docker: **no longer blocked** (installed and working; database and Redis containers are running).
- Ollama (local model): not installed yet. Until then the Low tier falls back to the smaller cloud model. It is also needed for the local embedding model of the Knowledge Base step (decisions A20).
- Your real-key test of Groq and OpenRouter on `/docs` (`POST /dev/route`).
- Your decision on the `AGENTS.md` "feedback" block that `next dev` added (keep it, or remove `agentFeedback: true` from `frontend/next.config.ts`): see decisions A18.
- Final design polish of all screens: at the end of the project (decisions A17).

## Optional, later
- [ ] Password reset (needs an email service; not in version 1.0)
- [ ] Testing the memory conflict detector (target 85% precision, 80% recall) and routing savings (target 30%)

# Progress

Build order. Update this file after every task. Legend: `[ ]` not started, `[~]` in progress, `[x]` done.

Spec status: problems B1 to B9 are resolved in `docs/spec/` (see `decisions.md` and `spec-changes.md`). Seven smaller open inconsistencies are waiting for your approval (bottom of `spec-changes.md`). Ask before building a part they touch.

Rules now in force (see `decisions.md` A6 to A9):
- **Backend first.** Test every feature through FastAPI's `/docs` page. No real frontend screens until you say so; the mockups are reference only.
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
  - [ ] **POSTPONED (until you say so):** Frontend skeleton (Next.js)
  - [ ] Redis connection from the app and Celery worker: Redis container runs, but no code uses it yet (comes with the first background job)
- [ ] **2. Login** (FR-1, FR-2)
  - [ ] Register
  - [ ] Log in and log out
  - [ ] 5 failed attempts locks the account for 15 minutes
- [ ] **3. Chat** (FR-3, FR-4)
  - [ ] Send a message and get a streamed reply
  - [ ] Conversation history: new, reopen, search, delete
- [ ] **4. Memory** (FR-5 to FR-8)
  - [ ] Summarize finished chats and extract memories (background job)
  - [ ] Retrieve the top 5 relevant memories for a reply (and record them in `message_memories`)
  - [ ] Memories page: view, edit, delete, confirm, version history, on/off switch
  - [ ] Confidence decay (daily job, `exp(-DECAY_RATE × days since last confirmed)`) and "needs re-verification"
- [ ] **5. Documents and RAG** (FR-14 to FR-17)
  - [ ] Upload with validation (PDF, TXT, MD, up to 20 MB)
  - [ ] Background indexing (extract, chunk, embed, store)
  - [ ] Document list: delete, re-index
  - [ ] Ask questions with source references
- [ ] **6. Projects and tasks** (FR-11 to FR-13)
  - [ ] Create, open, rename, delete projects
  - [ ] Task board (To Do, In Progress, Done)
  - [ ] Project notes (summaries and decisions)
  - [ ] Project context and project memory in chat
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
- Ollama (local model): not installed yet. Until then the Low tier falls back to the smaller cloud model.
- Your real-key test of Groq and OpenRouter on `/docs` (`POST /dev/route`).
- The Next.js frontend and all real screens: postponed to the end, on your word.

## Optional, later
- [ ] Password reset (needs an email service; not in version 1.0)
- [ ] Testing the memory conflict detector (target 85% precision, 80% recall) and routing savings (target 30%)

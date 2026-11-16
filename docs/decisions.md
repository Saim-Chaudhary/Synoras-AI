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

### A6. Docker, PostgreSQL and Redis are blocked until you install Docker
- **Status:** Approved (by you)
- **Decision:** Docker is not installed yet. You will tell Claude when it is. Until then, all Docker, PostgreSQL and Redis work is marked **Blocked/Waiting** in `progress.md`. Claude may write database code (models, migrations), but must **not** try to run it against a database.
- **Alternatives:** Install PostgreSQL and Redis directly on Windows; use SQLite for now.
- **Reason:** The SDD needs PostgreSQL + pgvector, and SQLite would hide pgvector problems. Waiting for Docker is simpler. Code that has not been run is untested, so migrations written now must be checked once Docker is ready.

### A7. Backend first; the real UI is built at the end
- **Status:** Approved (by you)
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
- Which local model to run in Ollama (when you install it), and which embedding model to use.
- Whether to keep a fallback when OpenRouter's free daily limit (50 requests) is reached, for example Groq `gpt-oss-120b`.
- How to turn a conversation into memories (the prompt we give the model).
- Admin features (FR-25, FR-26) are now the last step in the build order.
- Optional later: password reset.

## Part D: Open inconsistencies waiting for your approval
Seven more small inconsistencies are listed at the bottom of `docs/spec-changes.md` ("Open inconsistencies"). **None of them is fixed.** Examples: what "keep both" does to the old memory, a missing `file_path` on `reports`, and whether normal chat messages go through the router.

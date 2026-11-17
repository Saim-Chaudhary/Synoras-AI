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

Main database tables: `users`, `projects`, `project_notes`, `tasks`, `chats`, `messages`, `memories`, `memory_versions`, `memory_conflicts`, `message_memories`, `documents`, `document_chunks`, `subtasks`, `agent_steps`, `reports`, `system_log` (see SDD Section 5.2).

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
  backend/         the server brain (FastAPI, Python)
    app/
      api/         the URLs the website can call (one file per feature)
      core/        settings, security helpers (password hashing, tokens)
      db/          database connection and migrations
      models/      database tables written as Python classes
      schemas/     the shape of data going in and out of the API (Pydantic)
      services/    the real work for each feature, called by api/
      memory/      memory extraction, decay, conflict detection
      rag/         document reading, chunking, embedding, search
      routing/     complexity classifier and model router
      agents/      planner, researcher, reviewer, response agent (LangGraph)
      workers/     background jobs (Celery): summaries, daily decay, indexing
    tests/         automatic tests
    uploads/       uploaded documents (stored on local disk; the DB keeps only the path)
  pdf-service/     small Node.js service that turns report data into PDF files
    src/           its code
  docker/          Docker files to run the database, Redis and the services
  docs/            specs (spec/), decisions, flow, progress, spec-changes
```

Rule of thumb: `api/` receives a request, `services/` does the work, `models/` talks to the database, `schemas/` checks the data.

## Foundation
Backend skeleton is built. For now we build the backend only and test it through FastAPI's `/docs` page. Docker is now installed, but the PostgreSQL and Redis containers are not set up yet, so anything that needs them still waits for that step (see `progress.md`).

**Start the server and see it work**
- **User does:** runs `uv run fastapi dev app/main.py` in `backend/`, then opens `http://127.0.0.1:8000/docs`.
- **Files, in order:**
  1. `app/main.py`: creates the FastAPI app and plugs in the URL files.
  2. `app/api/health.py`: `GET /health` answers `{"status": "ok"}` (no database).
  3. `app/core/config.py`: reads `backend/.env` once (keys, model names, database and Redis URLs). Keys are hidden when printed.
- **Result:** the Swagger page lists the endpoints; `.env.example` shows what to put in `.env`.

## Login and registration
Not built yet.

## Chat
Not built yet.

## Memory
Not built yet.

## Documents and RAG
Not built yet.

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

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

Synoras AI is a final-year project (COMSATS Sahiwal). The specs are in `docs/spec/` (`Scope.md`, `SRS.md`, `SDD.md`, converted from the original `.docx` files, which are kept in `docs/`). The Markdown specs are now the **source of truth**: the Word files are out of date, and every change made to the specs is listed in `docs/spec-changes.md`. If you change a spec, add it to that file too.

Built so far (backend only): FastAPI skeleton with `/health` and `/health/db`, settings, the model layer (complexity classifier, router, Ollama/Groq/OpenRouter client) with temporary `/dev` test endpoints, and the database: PostgreSQL 18 + pgvector and Redis in Docker, SQLAlchemy connection, Alembic, and the `users` table. See `docs/progress.md`.

Commands:
- Start the database and Redis (project root): `docker compose -f docker/docker-compose.yml up -d`. Stop: `... down` (data is kept; **never add `-v`**, it deletes the data).
- The database is on port **5433** (Windows already uses 5432) and addresses use `127.0.0.1`, not `localhost` (IPv6 problem). User, password and database name are all `synoras`-based: see `backend/.env.example`.
- From `backend/`: `uv run alembic upgrade head` (apply migrations), `uv run alembic revision --autogenerate -m "message"` (new migration; always read the generated file), `uv run alembic downgrade -1` (undo one).
- Start the server: `uv run fastapi dev app/main.py`, then open `http://127.0.0.1:8000/docs`.
- Run the tests: `uv run pytest` (fake models, no keys, no tokens used; tests marked `integration` use the real database and skip themselves if the container is not running).
- Settings come from `backend/.env` (copy `backend/.env.example`). Never commit `.env`. Do not save `.env` with a BOM (PowerShell's `Set-Content -Encoding utf8` adds one).
- There is no lint command yet.

## Working rules (set by the user)

- The user is a **solo beginner** and must be able to explain every line in their project defense. Explain everything in simple words. The three-person team and the library versions in the documents are only paperwork.
- **Before every task**, read `docs/spec/`, `docs/decisions.md`, `docs/flow.md` and `docs/progress.md`.
- **Never write code before showing a plan and getting the user's approval.**
- Work in small steps, one feature at a time.
- **After every task**, update `docs/decisions.md`, `docs/flow.md` and `docs/progress.md`.
- Follow the SDD for tables, algorithms and screens. If you must deviate, record why in `docs/decisions.md`.
- **Backend first.** The final UI is built at the end. Treat the mockups in the spec as reference only, test features through FastAPI's `/docs` page, and **do not build real frontend screens until the user says so**.
- **Docker is installed and working** (Docker 29.9.3, Compose v5.7.0). Docker, PostgreSQL and Redis work is no longer blocked, and database code may be run once its plan is approved. New tables go through a model in `backend/app/models/` plus an Alembic migration (never `create_all()`). Ollama (the local model) is still not installed, so the Low tier falls back to the smaller cloud model.
- **Python uses uv.** Run from `backend/`: `uv add <package>`, `uv run <command>`. Never use plain `pip`. Libraries are already installed (see `backend/pyproject.toml`). Cloud models are Groq (`langchain-groq`) and OpenRouter (through `langchain-openai`); the local model is Ollama (`langchain-ollama`).
- **Use Context7** to check the current docs of any library before writing code with it, and use the latest stable versions (not the versions in the Scope document). If Context7 is not connected or not authenticated, tell the user instead of guessing from memory.

## What the system is

A web app where users chat with an AI that keeps long-term memory, organizes work in project workspaces, answers from uploaded documents (RAG), and splits complex requests across cooperating agents. Stack: Next.js + React + TypeScript + Tailwind (frontend), FastAPI (backend), LangChain/LangGraph (agents), PostgreSQL + pgvector (only database, including embeddings), Redis + Celery (background jobs), Ollama (local model), a separate Node.js + PDFKit service (reports), Docker.

## Architecture (big picture)

Layered client-server design; each layer talks only to its neighbours:

- **Client**: Next.js, talks to the backend over HTTPS REST plus streamed chat replies.
- **Application (FastAPI)**: auth, chat/conversations, memory service, projects/tasks, knowledge base/RAG, agent orchestrator, complexity classifier + model router, routing/execution logger.
- **Background**: a Celery worker (via Redis) runs conversation summarization, the daily confidence-decay job, and document indexing. A separate Node.js service builds PDFs from validated JSON.
- **Data**: PostgreSQL + pgvector; uploaded files live on local disk and the DB stores only the path.
- **Model layer**: Low-complexity subtasks → local model (Ollama); Medium → smaller cloud model; High → stronger cloud model.

Cross-cutting behaviours that span many files and must stay consistent:

- **Memory lifecycle**: a conversation ends or is idle 30 min → background job summarizes it and extracts facts → each fact is compared (by embedding) with similar stored memories → no contradiction: save with confidence 1.0; contradiction: store a `pending` row in `memory_conflicts`, **pause and ask the user** (keep old / use new / keep both). Memories are never overwritten without user confirmation (BR-3, BR-4); replaced text goes to `memory_versions`. Status values in the database: `current`, `needs_reverification`, `past` (deleting a memory really removes it). A daily job sets `confidence = exp(-DECAY_RATE × days since last_confirmed)` (DECAY_RATE is a setting, starts at 0.01/day); confidence is stored 0 to 1 and shown as a percentage; a memory used in a reply while below 50% becomes `needs_reverification`. Each reply records the memories it used in `message_memories`. Personal and project memory are stored and retrieved separately (top 5 by vector similarity).
- **Routing**: planner splits the request into subtasks → classifier rates each Low/Medium/High (failure or uncertainty ⇒ High) → router picks the model (local unavailable ⇒ smaller cloud; Low/Medium result failing a quality check ⇒ rerun on the stronger model; cloud unreachable ⇒ retry 2×) → reviewer loops with researcher at most 2 rounds → response agent combines. Every subtask/agent step is logged with complexity, model, time and estimated cost.
- **Privacy**: every query is scoped to the logged-in user (BR-1, BR-14, BR-18, BR-20, BR-21, BR-23). The admin can manage accounts and see job/error status but can never read memories, conversations or documents (BR-25).
- **Auth**: passwords hashed, minimum 8 characters; 5 failed logins in a row locks the account 15 minutes.
- **Documents**: PDF/TXT/MD only, max 20 MB; status Processing → Indexed or Failed; every document answer lists its source documents/sections.

## Requirement IDs

The specs use stable IDs (FR-1…FR-26, UC-1…UC-13, BR-1…BR-26, USE-n, PER-n). Reference them in plans, decisions and commit messages. The SDD's traceability matrix (Section 7) maps each FR to classes, tables and algorithms.

## Spec fixes and open problems

Problems B1 to B9 (missing columns/tables, status names, decay formula, and others) are **resolved** in the specs; see `docs/decisions.md`. Seven smaller inconsistencies are still **open** at the bottom of `docs/spec-changes.md` (for example what "keep both" does to the old memory, a missing `reports.file_path`, and how a normal chat message is routed). **Do not apply a fix for these until the user approves it**, and ask before building anything that depends on one.

Build order (see `docs/progress.md`; backend first, UI at the end): foundation, login, chat, memory, documents and RAG, projects and tasks, memory conflict handling, multi-agent with routing, PDF reports, admin (last). Password reset is an optional later feature (no email service in version 1.0).

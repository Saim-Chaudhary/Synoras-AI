<p align="center">
  <img src="docs/assets/banner.svg" alt="Synoras AI" width="100%">
</p>

<h2 align="center">🚧 Something cool is coming 🚧</h2>

<p align="center">
  <img src="https://img.shields.io/badge/status-under%20construction-7c5cff?style=for-the-badge" alt="Status: under construction">
  <img src="https://img.shields.io/badge/type-Final%20Year%20Project-22d3ee?style=for-the-badge" alt="Final Year Project">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS">
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI">
  <img src="https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white" alt="Python">
  <img src="https://img.shields.io/badge/LangChain-1C3C3C?style=flat-square&logo=langchain&logoColor=white" alt="LangChain">
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis">
  <img src="https://img.shields.io/badge/Node.js-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker">
</p>

---

## What is Synoras AI?

Most AI chat tools forget you the moment the conversation ends. **Synoras AI** is being built to be different:

- 🧠 **Memory that stays honest.** It remembers useful things from your chats, lets that memory fade if it is never confirmed, and asks you before changing anything that contradicts it.
- 📁 **Project workspaces.** Chats, tasks and notes for each project live together.
- 📄 **Ask your own documents.** Upload PDF, TXT or Markdown files and get answers with sources.
- 🤝 **A team of AI agents.** Planning, research, review and answer-writing are shared between agents, and each small job goes to a model of the right size to save cost and time.
- 🧾 **PDF reports** of your work, including how the AI reached its answers.

## Status

The project is in its early build phase and is not ready to use yet. The backend is being built first and tested through FastAPI's `/docs` page. The real user interface comes at the end.

| Part | State |
|---|---|
| Backend skeleton (FastAPI, settings, health check, tests) | Done |
| Model layer: complexity classifier, tier router, Ollama / Groq / OpenRouter client | Built, offline tests pass; real key test in progress |
| Database (PostgreSQL 18 + pgvector in Docker), migrations (Alembic), `users` table, Redis container | Done |
| Background jobs (Celery) | Not started |
| Login, chat, memory, documents, projects, multi-agent, PDF reports, admin | Not started |
| Web interface (Next.js) | Planned for the end |

Details and the build order are in [`docs/progress.md`](docs/progress.md).

## How the model routing works

Each message is rated **Low**, **Medium** or **High** by a small rule-based classifier, then sent to a model of the right size. When the rating is uncertain, the stronger model is used.

| Rating | Model | Where it runs |
|---|---|---|
| Low | Ollama (local) | Your own machine |
| Medium | Groq `gpt-oss-20b` | Cloud, free tier |
| High | OpenRouter free model | Cloud, free tier |

Every answer comes back with the time it took and an estimated cost.

## Run the backend

You need [uv](https://docs.astral.sh/uv/) and Docker. First start the database and Redis, from the project root:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Then, from the `backend/` folder:

```bash
uv sync
cp .env.example .env     # then add your own Groq and OpenRouter keys
uv run alembic upgrade head   # builds the database tables
uv run pytest
uv run fastapi dev app/main.py
```

Then open <http://127.0.0.1:8000/docs>. The `/dev` endpoints there are temporary test tools with no login: use them only on your own machine.

## Stack

Next.js · React · TypeScript · Tailwind CSS · FastAPI · LangChain / LangGraph · PostgreSQL + pgvector · Redis · Celery · Ollama · Groq · OpenRouter · Node.js · Docker

## Project documents

The requirements and design live in [`docs/spec/`](docs/spec/) (Scope, SRS, SDD). Working notes: [`decisions.md`](docs/decisions.md), [`flow.md`](docs/flow.md), [`progress.md`](docs/progress.md).

---

<p align="center"><sub>Built as a final year project. Stay tuned. ✨</sub></p>

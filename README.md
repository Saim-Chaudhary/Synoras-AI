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
| Register and login (argon2 passwords, JWT tokens, 15-minute lock after 5 wrong passwords) | Done |
| Background jobs (Celery) | Not started |
| Chat, memory, documents, projects, multi-agent, PDF reports, admin | Not started |
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

## Run it on a new computer

### 1. Install these once

| Tool | Why | Get it |
|---|---|---|
| Git | download the project | <https://git-scm.com/downloads> |
| Docker Desktop | runs the database and Redis (open it and wait until it says it is running) | <https://www.docker.com/products/docker-desktop/> |
| uv | installs Python 3.14 and the libraries for you (you do not need to install Python yourself) | <https://docs.astral.sh/uv/getting-started/installation/> |

### 2. Download the project

```bash
git clone https://github.com/Saim-Chaudhary/Synoras-AI.git
cd Synoras-AI
```

### 3. Create your settings file

The settings file `backend/.env` holds your secret keys, so it is **not** in git. Make it from the template:

```bash
# Windows (PowerShell)
Copy-Item backend/.env.example backend/.env

# macOS / Linux
cp backend/.env.example backend/.env
```

Open `backend/.env` in a text editor and fill in:

- `GROQ_API_KEY` and `OPENROUTER_API_KEY` (free keys from [console.groq.com](https://console.groq.com) and [openrouter.ai](https://openrouter.ai)).
- `JWT_SECRET`: any random text of at least 32 characters. To make one, run this in the `backend/` folder (after step 5's `uv sync`) and paste the result:

  ```bash
  uv run python -c "import secrets; print(secrets.token_urlsafe(48))"
  ```

Leave the other lines as they are: they already match the Docker setup.

### 4. Start the database and Redis

From the project folder (the one with `docker/` in it):

```bash
docker compose -f docker/docker-compose.yml up -d
```

The first time, Docker downloads the images (a few minutes). Check that both show `healthy`:

```bash
docker compose -f docker/docker-compose.yml ps
```

### 5. Set up and start the backend

From the project folder:

```bash
cd backend
uv sync                        # installs Python 3.14 and all libraries
uv run alembic upgrade head    # builds the database tables
uv run pytest                  # optional: runs the tests
uv run fastapi dev app/main.py
```

Open <http://127.0.0.1:8000/docs>. Try `GET /health` and `GET /health/db` (it should say `"database": "reachable"`). The `/dev` endpoints there are temporary test tools with no login: use them only on your own machine.

**Try the login on `/docs`:**

1. `POST /auth/register`: click *Try it out*, change the example to a real name, email and a password of 8+ characters, then *Execute*. You get your user and an `access_token`.
2. Copy the `access_token`, click the **Authorize** button (top right), paste it, and press *Authorize*.
3. `GET /auth/me` now returns your account. Without a token it returns 401.
4. `POST /auth/login` logs in again later. Five wrong passwords in a row lock the account for 15 minutes.

### Every day after that

```bash
docker compose -f docker/docker-compose.yml up -d     # from the project folder
cd backend
uv run fastapi dev app/main.py
```

When you finish, stop the containers (your data is kept):

```bash
docker compose -f docker/docker-compose.yml down
```

> **Never add `-v` to `down`.** It deletes the database data.

### Good to know

- **Each computer has its own database.** The data lives in a Docker volume on that machine and is not copied by git. A new computer starts empty: `alembic upgrade head` builds the tables, and you register your users again.
- **After you pull new code**, run `uv sync` and `uv run alembic upgrade head` in `backend/`, in case a library or table was added.
- **The database uses port 5433** (not the usual 5432) so it does not clash with a PostgreSQL installed on the computer. Redis uses 6379.
- **Problems?**
  - *"Cannot connect to the Docker daemon"*: Docker Desktop is not running. Open it and wait.
  - *"port is already allocated"*: another program uses 5433 or 6379. Close it, or change the left-hand port number in `docker/docker-compose.yml` and in `DATABASE_URL` in `backend/.env`.
  - *`/health/db` says `unreachable`*: run the `ps` command from step 4 and check that the database is `healthy`.
  - *A model call says "Free limit reached"*: free plans allow few requests (OpenRouter free models: 50 a day). Wait and try again.
- **Ollama (the local model) is optional for now.** Without it, simple messages use the Groq model instead.

## Stack

Next.js · React · TypeScript · Tailwind CSS · FastAPI · LangChain / LangGraph · PostgreSQL + pgvector · Redis · Celery · Ollama · Groq · OpenRouter · Node.js · Docker

## Project documents

The requirements and design live in [`docs/spec/`](docs/spec/) (Scope, SRS, SDD). Working notes: [`decisions.md`](docs/decisions.md), [`flow.md`](docs/flow.md), [`progress.md`](docs/progress.md).

---

<p align="center"><sub>Built as a final year project. Stay tuned. ✨</sub></p>

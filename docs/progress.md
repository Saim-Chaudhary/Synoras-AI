# Progress

Build order. Update this file after every task. Legend: `[ ]` not started, `[~]` in progress, `[x]` done.

Spec status: problems B1 to B9 are resolved in `docs/spec/` (see `decisions.md` and `spec-changes.md`). Seven smaller open inconsistencies are waiting for your approval (bottom of `spec-changes.md`). Ask before building a part they touch.

- [~] **1. Foundation**
  - [x] Project folders (frontend, backend, pdf service): checked on disk, created by hand by you
  - [ ] Docker setup for PostgreSQL + pgvector and Redis
  - [ ] Backend skeleton (FastAPI) and database connection
  - [ ] Frontend skeleton (Next.js)
  - [ ] First database tables and migrations
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
- [ ] **8. Multi-agent with routing** (FR-18 to FR-23)
  - [ ] Complexity classifier (Low, Medium, High)
  - [ ] Router and model fallbacks
  - [ ] Planner, researcher, reviewer, response agents (LangGraph)
  - [ ] Logging (`subtasks`, `agent_steps`) and the routing and cost log screen
- [ ] **9. PDF reports** (FR-24)
  - [ ] Node.js PDF service
  - [ ] Conversation summary, project summary, AI transparency report
- [ ] **10. Admin** (FR-25, FR-26) — last step
  - [ ] Admin dashboard: list users, deactivate and reactivate (not your own account)
  - [ ] `system_log` for every admin action
  - [ ] Monitoring page: background job status and recent errors

## Optional, later
- [ ] Password reset (needs an email service; not in version 1.0)
- [ ] Testing the memory conflict detector (target 85% precision, 80% recall) and routing savings (target 30%)

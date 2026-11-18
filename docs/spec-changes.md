# Spec changes

Every change made to `docs/spec/*.md` after the Word documents were converted. Use this list to update your Word documents later.
Section numbers follow the Word documents. "B1" etc. refer to the entries in `decisions.md`.

**Images that cannot be changed in Markdown (redraw them in the Word documents):**
- SDD Figure 4.1.1 (class diagram): add `Memory.lastAccessed`, `Memory.embedding`, a `MemoryConflict` class, a `ProjectNote` class, an `AgentStep` class, a `SystemLog` class, `User.autoMemory`, and `Message.modelUsed`.
- SDD Figure 4.3.1 (state diagram): states are now Current, Needs Re-verification, Past. Remove "Active", "Superseded" and "Deleted".
- SDD Figure 5.1.1 (ER diagram): add the new tables and columns listed under SDD Section 5.2 below.
- SDD Figure 3.2.2 (activity diagram): the daily job now uses the new formula.
- SDD Figure 8.1.1 and SRS Figure 6.1 (login mockup): remove or grey-out the "Reset password" link.
- **GraphRAG change (decisions A19):**
  - SDD Figure 3.2.4 (activity diagram) and Figure 4.2.2 (sequence diagram): add the second background job (entity extraction), the five GraphRAG steps (embed, entities found, graph expanded, chunks collected, answer), the event after each step, and the fallback to similarity search.
  - SDD Figure 4.1.1 (class diagram): add `GraphEntity` and `GraphRelation`, `Document.graphStatus` and `DocumentChunk.extractedAt`.
  - SDD Figure 4.4.2 (DFD level 1): the data store of process 5.0 Manage Documents now also holds the knowledge graph.
  - SDD Figure 5.1.1 (ER diagram): add `graph_entities`, `graph_relations`, `graph_entity_chunks`, `graph_relation_chunks`, `graph_extraction_log`, `documents.graph_status` and `document_chunks.extracted_at`.
  - SDD Figure 3.1.1 (architecture): the background tier also does entity extraction, and the answer stream uses Server-Sent Events.
  - SDD Figure 8.1.2, SRS Figure 6.2 and Scope Figure 16.2 (chat mockup): the right-hand panel has two tabs (Memories, Knowledge graph) showing a graph with highlighted nodes, and a "knowledge source" selector next to the message box.
  - SDD Figure 8.1.4, SRS Figure 6.4 and Scope Figure 16.4 (project mockup): each document card shows its graph status (for example "Graph: Extracting 12/40"), and there is a "Show knowledge graph" button.

## SDD (`docs/spec/SDD.md`)

| Section | Change | Reason |
|---|---|---|
| 3.2.2 Confidence Decay and Re-verification | Daily job now uses `confidence = exp(-DECAY_RATE × days since last confirmed)`, DECAY_RATE starts at 0.01/day, score stored 0 to 1 and shown as a percentage, last-used time kept for a possible later "lack of use" term | B4, B9: the formula was undefined |
| 4.1 Class Diagram (text) | A Project also has many Project Notes | B9: summaries and decisions need a home |
| 4.3 State Transition Diagram (text) | Statuses renamed Active→Current, Superseded→Past; "Deleted" removed (deleting removes the memory completely) | B2: names differed between documents |
| 5 Data Design (intro text) | Mentions the conflicts table, memory-used link table, log tables and project notes table | B3, B6, B8, B9 |
| 5.2 Data Dictionary: `agent_steps` | New table (step_id, message_id, agent_name, model_used, response_time, cost, status, created_at) | B8: BR-6 needs every agent step logged |
| 5.2 `chats` | Added `user_id` | B7: privacy of personal chats (BR-1) |
| 5.2 `documents` | Added `user_id`, `file_type`, `created_at` | B7: privacy of personal documents (BR-18, BR-20) |
| 5.2 `memories` | Added `embedding` and `last_accessed`; `confidence` description now gives the formula and says shown as a percentage; `status` values written as `current`, `needs_reverification`, `past`, and a deleted memory is removed | B1, B2, B4, B5, B9 |
| 5.2 `memory_conflicts` | New table (conflict_id, memory_id, new_statement, status, choice, created_at, resolved_at) | B3: pending conflicts need a place to live |
| 5.2 `memory_versions` | Added `reason` (edited or conflict_replaced) | B3: timeline and transparency report need the cause |
| 5.2 `message_memories` | New link table (message_id, memory_id) | B6: FR-6 says record the memories used per reply |
| 5.2 `messages` | Added `model_used` | B6: chat screen shows which model answered |
| 5.2 `project_notes` | New table (note_id, project_id, kind, title, content, created_at) | B9: FR-11 summaries and decisions |
| 5.2 `reports` | Added `user_id` | B7: reports of personal chats have no project |
| 5.2 `system_log` | New table (log_id, user_id, action, details, created_at) | B8: BR-26 and FR-26 |
| 5.2 `users` | Added `auto_memory` | B7: FR-5/FR-7 on/off switch needs storage |
| 6.2 Complexity Classification and Routing | Records each retrieved memory in `message_memories` and updates `lastAccessed`; saves one `agent_steps` row per agent step | B1, B6, B8 |
| 6.3 Memory Extraction and Conflict Resolution | Uses `user.autoMemory`, embeddings, new memories start with status "current" and `lastAccessed`; conflict row is created in `memory_conflicts` (pending), set to resolved with choice and time; "use new" saves the old text with reason `conflict_replaced` and recomputes the embedding; the "no choice" branch now returns early so the confidence is not reset | B1, B2, B3, B5 |
| 6.4 Confidence Decay and Re-verification | Replaced `decayFormula(...)` with `exp(-DECAY_RATE * days since lastConfirmed)`; status names `needs_reverification` and `current`; "edit" saves the old text with reason `edited` and recomputes the embedding | B2, B4, B5 |
| 7.1 Traceability Matrix | Updated rows FR-4, FR-5, FR-6, FR-7, FR-8, FR-9, FR-10, FR-11, FR-16, FR-22, FR-24, FR-25; added an ER row for FR-26 | Keep the matrix in line with the new tables, columns and status names |
| 8.1.1 Register / Log In Screen (text) | Reset-password link is an optional later feature | B9: no email service in version 1.0 |
| 8.2.1 Objects of the Register / Log In Screen | "Reset password link" row marked optional, later feature | B9 |
| 1 Introduction, 3 System Overview, 3.1 Architecture (text) | Knowledge Base and RAG became Knowledge Base and GraphRAG; background worker also does document indexing and graph extraction; PostgreSQL also stores the knowledge graph (no separate graph database); answer and graph events use Server-Sent Events; chat screen has a graph panel | A19 |
| 3.2.4 Document Upload and Question Answering (text) | Document is Indexed first; a second job extracts entities and relationships; questions are answered with GraphRAG steps that each send an event; fallback to similarity search | A19 |
| 4.1 Class Diagram (text) | Chunks mention Graph Entities; Graph Relations connect entities | A19 |
| 4.2.2 Sequence Diagram (text), new subsection Live Graph Events (GraphRAG), new Table 4.2.1 | Second job after indexing; GraphRAG steps; list of the events of the answer stream | A19 |
| 4.4.2 DFD Level 1 (text) | Manage Documents also stores the knowledge graph | A19 |
| 5 Data Design (text) | Describes the four graph tables, the extraction log, owners, one entity per knowledge base, and what happens on delete | A19 |
| 5.2 `documents` | Added `graph_status` (Pending, Extracting, Ready, Failed) | A19: the graph is built after Indexed |
| 5.2 `document_chunks` | Added `extracted_at` | A19: progress, and continuing after a stop |
| 5.2 `graph_entities`, `graph_relations` | New tables, with `user_id` and `project_id` (owner), and an embedding on entities | A19, BR-27 |
| 5.2 `graph_entity_chunks`, `graph_relation_chunks` | New link tables to the chunks that mention or support them | A19: source references |
| 5.2 `graph_extraction_log` | New table (log_id, document_id, chunk_id, user_id, complexity, model_used, response_time, cost, status, created_at) | A19, BR-28, FR-22 |
| 6.5 Document Processing | After Indexed it sets `graphStatus = Pending` and queues `extractGraph` | A19 |
| 6.6 Document Search and Answer | Rewritten as GraphRAG: embed, entities, expand (2 steps), chunks, answer; fallback for documents whose graph is not ready | A19, FR-17 |
| 6.8 Knowledge Graph Extraction | New algorithm `extractGraph` (classifier and router per chunk, quality check, entity merge, log) | A19, FR-27 |
| 7.1 Traceability Matrix | Rows marked with a diamond changed: FR-3, FR-15, FR-16, FR-17, FR-18, FR-22, FR-25, PER-3, PER-7; new rows FR-27, FR-28, USE-8, PER-12, PER-13 | A19 |
| 8.1.2 and 8.2.2 Chat Screen | Right panel has two tabs (Memories, Knowledge graph); knowledge source selector; graph view, live highlight, legend and limit, empty or not-ready message, source references | A19, FR-28 |
| 8.1.4 and 8.2.4 Project Workspace and Knowledge Base | Graph status on each document, Show knowledge graph button, retry graph, source and entity counts with answers | A19 |
| List of Figures, List of Tables | Figure 8.1.2 renamed; Table 4.2.1 added | A19 |

## SRS (`docs/spec/SRS.md`)

| Section | Change | Reason |
|---|---|---|
| 3.2 Table 3.13 (UC-13), alternative flow 13.2 | "Reset a User's password" marked optional, later feature | B9 |
| 4 Table 4.8 (FR-8) | Decay formula and DECAY_RATE (0.01/day) written in; score stored 0 to 1 and shown as a percentage; "lack of use" replaced by a stored last-used time that can be used later | B4, B9 |
| 4 Table 4.11 (FR-11) | Added: the User can add, edit, delete short project notes (summary or decision) | B9: the project notes table needs a requirement |
| 4 Table 4.25 (FR-25) | Password reset link marked optional, later feature | B9 |
| 6.1 UI-1 (Register / Log In) | Reset-password link removed from the required elements, marked optional, later feature | B9 |
| Purpose, Scope, Product Perspective, CO-2, CO-3 | GraphRAG instead of RAG; the database also holds the knowledge graph (no separate graph database); LangGraph also runs the GraphRAG steps | A19 |
| 3.2 Tables 3.7 to 3.9 (UC-7, UC-8, UC-9) | UC-7: second background job, graph status, new exception 7.0.E4, delete and re-index also handle graph entries, BR-27 and BR-28 added. UC-8: GraphRAG steps, graph events, new flow 8.2 (graph not ready). UC-9: the research agent uses the GraphRAG retrieval | A19 |
| 3.2 Table 3.11 (UC-11) | Trigger also includes a knowledge graph extraction job | A19 |
| 3.2 Table 3.13 (UC-13), 4 Table 4.25 (FR-25) | BR-25 also covers knowledge graphs | A19 |
| 4 FR-3, FR-15, FR-16, FR-17, FR-18, FR-22 | FR-3: retrieval events in the same stream. FR-15: Indexed and graph are separate. FR-16: delete and re-index include graph entries. FR-17: rewritten as GraphRAG (title now has GraphRAG), new dependency FR-27. FR-18: research agent uses GraphRAG. FR-22: also logs extraction calls | A19 |
| 4 new FR-27 (Table 4.17a), FR-28 (Table 4.17b); section title Knowledge Base and GraphRAG | Knowledge graph extraction; live knowledge graph panel; new BR-27 and BR-28 | A19 |
| Non-Functional Requirements: USE-8, PER-7, PER-12, PER-13 | USE-8 and PER-12, PER-13 are new; PER-7 now covers only indexing, not the graph | A19 (see open questions G1, G14) |
| 6.1 UI-2 and UI-4 | UI-2: right panel with Memories and Knowledge graph tabs. UI-4: graph status, graph button, entity counts | A19 |
| Software Interfaces SI-1, SI-2, SI-3, SI-6, new SI-9; Communications Interfaces CI-4 | Events over Server-Sent Events; the graph in PostgreSQL; the extraction job; embeddings for entities; the graph transformer; the same connection carries the events | A19 |
| List of Tables, Project Gantt Chart | Tables 4.17a and 4.17b listed; the Knowledge Base work is split into four phases | A19 |

## Scope (`docs/spec/Scope.md`)

| Section | Change | Reason |
|---|---|---|
| 7 Modules: Persistent Memory Management | "decreases with time and lack of use" changed to "decreases as time passes since the memory was last confirmed" | B4: agrees with the formula |
| 14 Concepts: Memory Confidence Decay | "how recently it was accessed or confirmed" changed to "how long ago it was last confirmed" | B4: agrees with the formula |
| Abstract, Introduction, Problem Solution, Objectives, Scope | RAG became GraphRAG (RAG that also uses a knowledge graph built from the documents, shown live) | A19 |
| Modules: Knowledge Base and GraphRAG | Rewritten: entity and relationship extraction by a background job through the router, graph stored in PostgreSQL, GraphRAG with LangGraph, live graph panel with streamed events | A19 |
| Tools and Technologies (Table 10.1) | Vector search row also covers entities; new rows: graph extraction (LangChain graph transformer, proposed), live updates (Server-Sent Events), graph visualization (Cytoscape.js, proposed) | A19 (open questions G6, G7) |
| Team Members, Data Gathering, Concepts, Screens | GraphRAG wording; test documents with known entities; new concepts Knowledge Graph, GraphRAG, Server-Sent Events; chat and project screen text | A19 |

## Privacy placeholders (all three spec files)

| Section | Change | Reason |
|---|---|---|
| Cover page and revision/supervisor block of Scope, SRS, SDD | Team member names and registration numbers replaced with `[Team Member 1-3]` and `[Registration No. 1-3]`; supervisor name replaced with `[Supervisor Name]` | The repo may become public. Put the real values back only in your Word documents |
| Scope 12 (Team Members table) | Same placeholders in the name and registration columns | Same reason |

## Not changed on purpose
- SRS Gantt and SDD introduction: the admin features (FR-25, FR-26) stay in the specs. Only the build order moved them to the last step (see `progress.md`).
- Library versions in the Scope technology table: you said they are paperwork.

---

# Open inconsistencies (NOT fixed, waiting for your approval)

I found these while applying the fixes. Tell me which ones to fix and how.

1. **"Keep both" behaviour.** SRS UC-4 flow 4.1 says the older memory is marked as a past fact with an end date. The SDD algorithm 6.3 only saves the new statement as a separate memory and does not mark the old one. *Proposed fix:* follow the SRS, so the old one gets status `past`.
2. **`reports` has no file path.** SDD algorithm 6.7 saves a report with its file path, but the `reports` table has no `file_path` column. *Proposed fix:* add `file_path VARCHAR(255)`.
3. **No column for the failure reason of a document.** FR-15 says to tell the user why indexing failed, but `documents` only has the status `Failed`. *Proposed fix:* add `status_message TEXT` to `documents`.
4. **Database version.** The Scope table says PostgreSQL 18.7 and pgvector 18.7 (pgvector has its own version numbers). The SRS says PostgreSQL 15 or later (OE-3). Python is 3.11.4 in the Scope and "3.11 or later" in the SRS (OE-2). *Proposed fix:* write "latest stable" in the Scope table, since you chose to use the latest versions.
5. **Which chat messages go through the router?** SRS UC-2 and FR-3 say a model is "selected" for every chat message, SDD 6.2 `handleRequest` runs the planning agent for every request, but SRS UC-9 says multi-agent is for "complex" requests. It is not stated how a normal short message is treated. *Proposed fix:* a simple chat message gets one classifier rating and one model call (no planner or reviewer); the full multi-agent pipeline runs only when the user asks for it or the classifier says High and the request needs several steps. Needs your decision when we reach step 8.
6. **Conflict timing.** FR-9 says conflicts are also checked "on information the User states in a conversation", but SDD 3.2.1 and algorithm 6.3 check only after the conversation ends (summary). *Proposed fix:* start with the after-conversation check only, and add the live check later if time allows.
7. **Conversation summaries.** FR-11 / SRS UC-5 say a project has "summaries", and project notes (summary or decision) now exist, but nothing says whether the system writes summaries by itself or only the user does. *Proposed fix:* the user writes them in version 1.0; the report can include them.

---

# Open questions from the GraphRAG change (NOT fixed, waiting for your approval)

These came up while changing the specs for GraphRAG (decisions A19). The specs already contain my proposal for each one, so you can read the whole picture, but **nothing is decided until you answer**. "G" means GraphRAG. G5, G6, G7 and G12 should be answered before any code is written for the Knowledge Base step.

1. **G1. The 2-minute rule (PER-7) cannot cover graph extraction.** A 20-page PDF is about 40 chunks, so about 40 model calls. Free plans allow few requests (Groq: 30 a minute, 8K tokens a minute, 200K tokens a day; OpenRouter free models: 50 requests a day). *Proposed (already written):* PER-7 only covers "Indexed" (text, chunks, embeddings). The graph is built afterwards with no fixed time limit, and the document can already be searched by similarity.
2. **G2. Free-tier limits against the amount of extraction.** Ollama is not installed, so "Low" extraction falls back to Groq, and a few documents a day could use up its 200K tokens a day. *Proposed:* start the extraction automatically after "Indexed", make it resumable (`document_chunks.extracted_at`), pause when a limit is hit (HTTP 429) and continue later, and show the progress (for example 12 of 40 sections). Other options: send several chunks in one call, or build the graph only when the user presses a button.
3. **G3. How to rate an extraction task, and what "quality check" means.** The classifier was written for chat messages. Also, BR-7 says "uncertain means High", which would send many chunks to the stronger OpenRouter model (50 requests a day). The "quality check" in FR-21 and UC-11 is not defined anywhere. *Proposed:* rate chunks by length and content (numbers, code, tables); for extraction only, treat "uncertain" as Medium instead of High (a documented exception to BR-7, because a weak result only makes a thinner graph); define the quality check as "valid structured result". Needs your decision.
4. **G4. Where extraction calls are logged.** `subtasks` and `agent_steps` both need a `message_id`, and an extraction call has no message. *Proposed:* a new table `graph_extraction_log` (written into the SDD). Open: should the routing log screen (FR-23) also list extraction calls? FR-23 is unchanged for now.
5. **G5. Embedding model and vector size are still undecided (decisions Part C).** Entities need embeddings too, and the `VECTOR` size is fixed when the table is created, so the same model must be chosen first for chunks, memories and entities (SI-6). A local embedding model needs Ollama (not installed); free cloud embedding options are not checked. This blocks the first phase.
6. **G6. The LangChain graph transformer adds dependencies.** It lives in `langchain-experimental` 0.4.2 (released 2026-05-22), which also needs `langchain-community`. Neither is in `pyproject.toml` yet. Context7 has no docs for it, so its API must be confirmed from the installed package. It is marked "experimental", and small free models may return poor structured results. *Proposed:* use it as you asked, behind one function, so we can switch to our own structured-output extraction (LangChain core, already installed, easier to log tokens and cost) if it does not work well. Needs your OK to add the two packages.
7. **G7. A graph drawing library is needed, which breaks rule A17 ("no extra UI libraries, no animations").** *Proposed:* Cytoscape.js (docs checked: highlight by adding a class to nodes and edges, layouts can run without animation). "Light up" would be an instant color change in the sample UI, and the glow or fade belongs to the final polish. Alternatives: react-force-graph (its layout is a moving physics simulation), or hand-drawn SVG (no library, but more code for you to explain).
8. **G8. How the live events travel.** *Proposed:* Server-Sent Events over a POST request (FastAPI 0.163 has `EventSourceResponse`), read in the browser with `fetch`. The browser's own `EventSource` cannot send the login header and only uses GET, and WebSocket is two-way, which is not needed. One stream carries the answer text and the graph events (events listed in SDD Table 4.2.1). The Chat step (FR-3) is not built yet, so this also fixes its streaming format.
9. **G9. How entities are merged.** *Proposed:* only the same name (ignoring capitals) and the same type, inside one knowledge base. No fuzzy matching in version 1.0, so "MIT" and "Massachusetts Institute of Technology" stay two entities. The personal knowledge base and each project have separate graphs, so the same real-world entity can appear in two graphs.
10. **G10. How far GraphRAG goes.** *Proposed:* only the entity-centred kind (find entities, follow relationships up to 2 steps, collect chunks). No community detection or whole-corpus summaries, so "summarize everything" questions stay weak. Starting values, to be tuned by experiment: 5 entities found by similarity, 2 steps, at most 50 entities and 20 chunks per answer, 150 nodes in the panel. If an entity is not found, or a document's graph is not ready, plain similarity search over chunks is used.
11. **G11. Re-index and cost.** Re-indexing creates new chunks, so their graph links are removed and the extraction runs again (more quota used). *Proposed:* re-extract after a re-index, and let "retry graph" continue only with the chunks that are not done.
12. **G12. Privacy.** Extraction sends your document text to cloud models. BR-18 and BR-20 only decide which *user* may see a document, not which provider reads it, and OpenRouter's data policy for free models is not verified (decisions A10). Options: a per-document "local only" setting (needs Ollama), a warning at upload, or cloud extraction only for documents the user allows. Decide before real documents are used.
13. **G13. Sources are not stored.** UC-8 POST-1 says the source references are "stored in the conversation", but no table stores them (this was already true before GraphRAG). GraphRAG adds the entities and relationships used. *Proposed (not added):* link tables per reply (chunks, entities, relationships), so a reopened conversation can show its sources, the highlight can be replayed, and the transparency report can list them. It is a fix and a new feature at the same time, so it needs your approval.
14. **G14. Bookkeeping.** New IDs were appended instead of renumbering: FR-27, FR-28, BR-27, BR-28, PER-12, PER-13, USE-8, SI-9, SRS Tables 4.17a and 4.17b, SDD Table 4.2.1 and section 6.8. The numbers in PER-12 (1 second for 10,000 entities), PER-13 (1 second per event) and USE-8 (150 entities) are my proposals. The SDD figure titles were kept (the diagrams must be redrawn, see the list at the top). Whether the routing log (FR-23) shows extraction entries is G4.

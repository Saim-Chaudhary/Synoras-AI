# Spec changes

Every change made to `docs/spec/*.md` after the Word documents were converted. Use this list to update your Word documents later.
Section numbers follow the Word documents. "B1" etc. refer to the entries in `decisions.md`.

**Images that cannot be changed in Markdown (redraw them in the Word documents):**
- SDD Figure 4.1.1 (class diagram): add `Memory.lastAccessed`, `Memory.embedding`, a `MemoryConflict` class, a `ProjectNote` class, an `AgentStep` class, a `SystemLog` class, `User.autoMemory`, and `Message.modelUsed`.
- SDD Figure 4.3.1 (state diagram): states are now Current, Needs Re-verification, Past. Remove "Active", "Superseded" and "Deleted".
- SDD Figure 5.1.1 (ER diagram): add the new tables and columns listed under SDD Section 5.2 below.
- SDD Figure 3.2.2 (activity diagram): the daily job now uses the new formula.
- SDD Figure 8.1.1 and SRS Figure 6.1 (login mockup): remove or grey-out the "Reset password" link.

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

## SRS (`docs/spec/SRS.md`)

| Section | Change | Reason |
|---|---|---|
| 3.2 Table 3.13 (UC-13), alternative flow 13.2 | "Reset a User's password" marked optional, later feature | B9 |
| 4 Table 4.8 (FR-8) | Decay formula and DECAY_RATE (0.01/day) written in; score stored 0 to 1 and shown as a percentage; "lack of use" replaced by a stored last-used time that can be used later | B4, B9 |
| 4 Table 4.11 (FR-11) | Added: the User can add, edit, delete short project notes (summary or decision) | B9: the project notes table needs a requirement |
| 4 Table 4.25 (FR-25) | Password reset link marked optional, later feature | B9 |
| 6.1 UI-1 (Register / Log In) | Reset-password link removed from the required elements, marked optional, later feature | B9 |

## Scope (`docs/spec/Scope.md`)

| Section | Change | Reason |
|---|---|---|
| 7 Modules: Persistent Memory Management | "decreases with time and lack of use" changed to "decreases as time passes since the memory was last confirmed" | B4: agrees with the formula |
| 14 Concepts: Memory Confidence Decay | "how recently it was accessed or confirmed" changed to "how long ago it was last confirmed" | B4: agrees with the formula |

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

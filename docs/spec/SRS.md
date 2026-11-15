**COMSATS University Islamabad,**

**Sahiwal Campus**

**SOFTWARE REQUIREMENTS SPECIFICATION**

**(SRS DOCUMENT)**

**for**

**Synoras AI**

Version 1.0

***By***

**[Team Member 1] [Registration No. 1]**

**[Team Member 2] [Registration No. 2]**

**[Team Member 3] [Registration No. 3]**

***Supervisor***

**[Supervisor Name]**

***Bachelor* *of Science in* *Computer Science (2023-**2027)***

# List of Figures

Figure 3.1: Use Case Diagram of Synoras AI 3

Figure 3.2: Use Case Diagram of the User 5

Figure 3.3: Use Case Diagram of the Administrator 6

Figure 3.4: Use Case Diagram of the Cloud LLM Provider and Local Model Runtime 7

Figure 6.1: Mockup of the Register / Log In screen 40

Figure 6.2: Mockup of the chat screen with memory panel 41

Figure 6.3: Mockup of the memory conflict resolution screen 42

Figure 6.4: Mockup of the project workspace with task board and knowledge base 43

Figure 6.5: Mockup of the multi-agent pipeline and routing log 44

Figure 6.6: Mockup of the AI transparency report 45

Figure 7.1: Gantt Chart of the Synoras AI 47

# List of Tables

Table 3.1: Use Case Description for UC-1 (Register / Log In) 8

Table 3.2: Use Case Description for UC-2 (Chat with AI) 9

Table 3.3: Use Case Description for UC-3 (Manage Memories) 11

Table 3.4: Use Case Description for UC-4 (Resolve Memory Conflict) 13

Table 3.5: Use Case Description for UC-5 (Manage Project Workspaces) 15

Table 3.6: Use Case Description for UC-6 (Manage Project Tasks) 16

Table 3.7: Use Case Description for UC-7 (Upload Documents) 17

Table 3.8: Use Case Description for UC-8 (Ask Questions from Documents) 18

Table 3.9: Use Case Description for UC-9 (Run Multi-Agent Task) 19

Table 3.10: Use Case Description for UC-10 (Generate PDF Report) 21

Table 3.11: Use Case Description for UC-11 (Route Subtask to Model) 22

Table 3.12: Use Case Description for UC-12 (View Routing & Cost Log) 24

Table 3.13: Use Case Description for UC-13 (Manage Users & Monitor System) 25

Table 4.1: Functional requirement FR-1 26

Table 4.2: Functional requirement FR-2 26

Table 4.3: Functional requirement FR-3 27

Table 4.4: Functional requirement FR-4 27

Table 4.5: Functional requirement FR-5 28

Table 4.6: Functional requirement FR-6 28

Table 4.7: Functional requirement FR-7 28

Table 4.8: Functional requirement FR-8 29

Table 4.9: Functional requirement FR-9 29

Table 4.10: Functional requirement FR-10 30

Table 4.11: Functional requirement FR-11 30

Table 4.12: Functional requirement FR-12 31

Table 4.13: Functional requirement FR-13 31

Table 4.14: Functional requirement FR-14 32

Table 4.15: Functional requirement FR-15 32

Table 4.16: Functional requirement FR-16 33

Table 4.17: Functional requirement FR-17 33

Table 4.18: Functional requirement FR-18 34

Table 4.19: Functional requirement FR-19 34

Table 4.20: Functional requirement FR-20 35

Table 4.21: Functional requirement FR-21 35

Table 4.22: Functional requirement FR-22 35

Table 4.23: Functional requirement FR-23 36

Table 4.24: Functional requirement FR-24 36

Table 4.25: Functional requirement FR-25 37

Table 4.26: Functional requirement FR-26 37

# Revision History

| **Name** | **Date** | **Reason for changes** | **Version** |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |

**Application Evaluation History**

| **Comments (by committee)** ***include the ones given at scope time both in doc and presentation** | **Action Taken** |
|---|---|
|  |  |
|  |  |

**Supervised By**

**[Supervisor Name]**

SignatureSignature

# Introduction:

This document describes the software requirements for Synoras AI, a web-based AI platform that remembers users across conversations and coordinates multiple AI agents to complete tasks. It is meant for the project team, the supervisor, and the evaluation committee, and it explains what the system must do, how it should behave, and what limits apply.

## Purpose:

This SRS specifies the requirements for Synoras AI, version 1.0. It covers the chat interface, persistent memory with confidence decay and conflict resolution, project workspaces, the knowledge base with Retrieval-Augmented Generation (RAG), multi-agent collaboration with complexity-based model routing, and PDF report generation. The document is the reference for design, implementation, and testing, so every feature built later should trace back to a requirement written here.

## Scope:

Synoras AI is a web application where users chat with an AI assistant that keeps useful information from earlier conversations. Instead of storing memories forever without checking them, the system gives each memory a confidence score that drops over time. When new information contradicts a stored memory, the system does not overwrite it. It asks the user which version is correct and keeps a history of the change [1], [2], [3], [4].

Users can organize their work in project workspaces, upload PDF, TXT, and Markdown files to a knowledge base, and ask questions answered from those documents through RAG. For complex requests, an orchestrator splits the work among research, planning, reviewing, and response agents. Before assigning each subtask, it estimates how difficult the subtask is and sends easy ones to a smaller or local model and harder ones to a stronger cloud model, which lowers cost and response time [5], [6], [7]. Users can also export summaries and project information as PDF reports.

# Overall Description:

## Product Perspective

Synoras AI is a new, standalone product. It does not replace an existing system or extend an earlier version. It sits between general-purpose AI chat tools, which answer one question at a time, and dedicated memory libraries, which store facts but leave the user out of the process. Synoras AI puts both in one web application: a chat assistant with long-term memory, project workspaces, a document knowledge base, and a team of cooperating agents.

The system has five main parts:

- A Next.js web frontend that users interact with [8].
- A FastAPI backend that handles authentication, memory logic, retrieval, and agent orchestration [9].
- A PostgreSQL [10] database with the pgvector [11] extension for structured data and vector search.
- A Redis-backed [12] Celery [13] worker for background jobs such as conversation summarizing and memory confidence updates.
- A Node.js service that generates PDF reports.

The backend talks to cloud language models through their APIs and to a smaller local model through a local runtime [14]. The orchestrator decides which one each subtask uses.

## Operating Environment

*OE-1:* *The system shall operate correctly in current versions of Google Chrome, Microsoft Edge, and Mozilla Firefox on Windows, Linux, and* *macOS**.*

*OE-2:* *The backend shall run on a Linux-based server or a development machine with Docker* *[15]* *installed, using Python 3.11 or later.*

*OE-3:* *The system shall use PostgreSQL 15 or later with the* *pgvector* *extension enabled.*

*OE-4:* *The system shall use* *Redis* *as the message broker and cache for background tasks.*

***OE-5:*** *The system shall be able to reach at least one cloud language model API over the internet. The local model runtime shall run on the same machine or the same local network as the backend.*

*OE-6:* *Uploaded documents shall be stored on the local disk of the server hosting the backend.*

## Design and Implementation Constraints

***CO-1:*** *The frontend shall be built with Next.js, React* *[16]**, and* *TypeScript* *[17]* *, styled with Tailwind CSS* *[18]**.*

***CO-2:*** *The backend shall be written in Python using* *FastAPI**, and the multi-agent workflows shall be implemented with* *LangGraph* *[19]**.*

***CO-3:*** *PostgreSQL with* *pgvector* *shall be the only database for structured data and* *embeddings**.*

***CO-4:*** *PDF reports shall be generated with a Node.js PDF-generation library.*

***CO-5:*** *The system shall use cloud model APIs, so performance, cost, and availability depend on the provider’s rate limits and pricing. The local model is limited by the hardware of the host machine.*

***CO-6:*** *The knowledge base shall accept only PDF, TXT, and Markdown files.*

***CO-7:*** *The project shall be completed within two academic semesters by a team of three students.*

# Requirement Identifying Technique:

Synoras AI is an interactive end-user application, so its requirements are identified through use cases. Each use case describes one goal a user or another actor wants to achieve with the system. The functional requirements in Section 4 are derived from these use cases [20].

## Use Case Diagram:

Figure 3.1: Use Case Diagram of Synoras AI

The diagram has four types of actors:

- **User** (primary): chats, manages memories, projects and documents, and generates reports.
- **Administrator**: manages users and monitors the system.
- **Cloud LLM Provider** (secondary): external API that handles complex subtasks.
- **Local Model Runtime** (secondary): local model that handles simple subtasks.

| **ID** | **Use Case** | **Actor** |
|---|---|---|
| UC-1 | Register / Log In | User, Administrator |
| UC-2 | Chat with AI | User |
| UC-3 | Manage Memories | User |
| UC-4 | Resolve Memory Conflict | User |
| UC-5 | Manage Project Workspaces | User |
| UC-6 | Manage Project Tasks | User |
| UC-7 | Upload Documents | User |
| UC-8 | Ask Questions from Documents | User |
| UC-9 | Run Multi-Agent Task | User |
| UC-10 | Generate PDF Report | User |
| UC-11 | Route Subtask to Model | System, Cloud LLM Provider, Local Model Runtime |
| UC-12 | View Routing & Cost Log | User |
| UC-13 | Manage Users & Monitor System | Administrator |

The main diagram above shows all actors and use cases together. The following diagrams show the same use cases from the point of view of one actor at a time, so it is clear what each actor can do in Synoras AI.

### Use Case Diagram of the User:

The User is the main actor of Synoras AI. The diagram shows the use cases a User performs: registering and logging in, chatting with the AI, managing memories, resolving memory conflicts, managing projects and tasks, uploading documents, asking questions from documents, running multi-agent tasks, generating PDF reports, and viewing the routing and cost log. Resolving a memory conflict extends the chat, and running a multi-agent task includes routing each subtask to a model.

Figure 3.2: Use Case Diagram of the User

### Use Case Diagram of the Administrator:

The Administrator logs in to the system and manages user accounts and monitors the system through the admin dashboard. The Administrator cannot read any User’s memories, conversations, or documents.

Figure 3.3: Use Case Diagram of the Administrator

### Use Case Diagram of the Model Providers:

The Cloud LLM Provider and the Local Model Runtime are secondary actors. They do not start any use case. They respond when the system routes a subtask to a model, which happens as part of running a multi-agent task.

Figure 3.4: Use Case Diagram of the Cloud LLM Provider and Local Model Runtime

## Use Case Description

This section describes each use case of Synoras AI in detail using a standard use case template. Every description lists the actors, a short summary, the event that starts the use case, the conditions before and after it runs, the normal flow of user actions and system responses, alternative flows for valid variations, and exceptions for error conditions. Business rules and assumptions are listed where they apply. The use cases are numbered UC-1 to UC-13 to match the use case diagram in Section 3.1. The functional requirements in Section 4 are derived from these descriptions.

Table 3.1: Use Case Description for UC-1 (Register / Log In)

| **Use Case ID** | UC-1 |
|---|---|
| **Use Case Name** | Register / Log In |
| **Actors** | Primary Actors: User, Administrator |
| **Description** | A new User creates an account, and a registered User or Administrator logs in to reach the system. Each account has its own memories, projects, and documents. |
| **Trigger** | The User opens Synoras AI and chooses to register or log in. |
| **Preconditions** | PRE-1. The User has a web browser and an internet connection. PRE-2. For login, the User already has an account. |
| **Postconditions** | POST-1. After registration, a new account exists and the User is logged in. POST-2. After login, a session is started and the User sees their own data only. |
| **Normal Flow** | **1.0 Log In** 1. The User opens the login page and enters email and password. 2. The system checks the credentials. (see 1.0.E1) 3. The system starts a session and opens the User's dashboard. **1.1 Register** 1. The User chooses to register and enters name, email, and password. (see 1.1.E1, 1.1.E2) 2. The system creates the account. 3. The system logs the User in. |
| **Alternative Flows** | **1.2 Log out** 1. The User chooses to log out. 2. The system ends the session and returns to the login page. |
| **Exceptions** | **1.0.E1 Wrong email or password** 1. The system informs the User that the credentials are incorrect. 2a. If the User retries, return to step 1 of 1.0. 2b. Else if the account has 5 failed attempts in a row, the system locks login for 15 minutes. **1.1.E1 Email already registered** 1. The system informs the User and offers the login page. **1.1.E2 Invalid input (bad email format or short password)** 1. The system shows what must be corrected and keeps the other fields. |
| **Business Rules** | BR-9. Passwords shall be stored only in hashed form. BR-10. Passwords shall be at least 8 characters long. |
| **Assumptions** | 1. Each email address belongs to one account. |

Table 3.2: Use Case Description for UC-2 (Chat with AI)

| **Use Case ID** | UC-2 |
|---|---|
| **Use Case Name** | Chat with AI |
| **Actors** | Primary Actor: User Secondary Actors: Cloud LLM Provider, Local Model Runtime |
| **Description** | The User sends a message in a conversation. The system retrieves memories relevant to the message, builds a reply with the chosen model, and streams it back. The exchange is stored in the conversation history. |
| **Trigger** | The User submits a message in the chat interface. |
| **Preconditions** | PRE-1. The User is logged in. PRE-2. A conversation is open, or the User starts a new one. |
| **Postconditions** | POST-1. The message and the reply are stored in the conversation history. POST-2. The last-accessed time of every memory used in the reply is updated. POST-3. The conversation is marked for summarization when it ends or becomes inactive. |
| **Normal Flow** | **2.0 Send a Message** 1. The User types a message and submits it. (see 2.0.E1) 2. The system retrieves memories relevant to the message from the User's personal memory and the active project's memory. (see 2.1) 3. The system builds a prompt from the message, the recent conversation, and the retrieved memories. 4. The system selects a model for the request (see UC-11) and sends the prompt. 5. The system streams the reply to the User. (see 2.0.E2) 6. The system stores both messages and updates the last-accessed time of the memories used. 7. The system checks the message for information that contradicts a stored memory. (see 2.2) |
| **Alternative Flows** | **2.1 No relevant memories found** 1. The system builds the prompt from the message and recent conversation only. 2. Return to step 4 of the normal flow. **2.2 Conflicting information detected** 1. The system starts UC-4 (Resolve Memory Conflict). 2. After the conflict is resolved, the conversation continues. |
| **Exceptions** | **2.0.E1 The message is empty** 1. The system does not send it and asks the User to type something. **2.0.E2 The selected model is unavailable** 1. The system informs the User and keeps the message. 2a. If the User retries, return to step 4. 2b. Else the conversation stays open without a reply. |
| **Business Rules** | BR-1. The system shall retrieve only the logged-in User's own memories. BR-2. A memory with confidence below 50% shall be marked as needing re-verification when it is used in a reply. |
| **Assumptions** | 1. The User has an internet connection. 2. At least one language model is reachable. |

Table 3.3: Use Case Description for UC-3 (Manage Memories)

| **Use Case ID** | UC-3 |
|---|---|
| **Use Case Name** | Manage Memories |
| **Actors** | Primary Actor: User |
| **Description** | The User views the memories the system has stored, with their confidence scores and dates. The User can edit or delete a memory, view its version history, and turn automatic memory collection on or off. |
| **Trigger** | The User opens the Memories page. |
| **Preconditions** | PRE-1. The User is logged in. |
| **Postconditions** | POST-1. Any edit, deletion, or setting change the User confirmed is saved. POST-2. An edited memory keeps its earlier text in the version history. |
| **Normal Flow** | **3.0 View and Manage Memories** 1. The User opens the Memories page. 2. The system lists the User's memories, separated into personal and project memories, each with its confidence score and last-confirmed date. 3. The User selects a memory to view its details and version history. 4. The User chooses to edit it, delete it, or confirm it. (see 3.1, 3.2, 3.3) 5. The system saves the change and shows the updated list. |
| **Alternative Flows** | **3.1 Edit a memory** 1. The User changes the text and saves. 2. The system keeps the old text in the version history and resets the confidence score. 3. Return to step 5 of the normal flow. **3.2 Delete a memory** 1. The User chooses delete and confirms. (see 3.0.E1) 2. The system removes the memory. 3. Return to step 5 of the normal flow. **3.3 Confirm a memory that needs re-verification** 1. The User marks the memory as still correct. 2. The system resets its confidence score. 3. Return to step 5 of the normal flow. **3.4 Turn automatic memory collection on or off** 1. The User changes the setting. 2. The system saves it and applies it to future conversations. |
| **Exceptions** | **3.0.E1 The User cancels the deletion** 1. The system keeps the memory unchanged. **3.0.E2 Saving fails** 1. The system informs the User and keeps the earlier version. |
| **Business Rules** | BR-11. Personal memory and project memory shall be stored and shown separately. BR-12. A deleted memory shall not be used in later replies. |
| **Assumptions** | 1. The User understands that deleting a memory cannot be undone. |

Table 3.4: Use Case Description for UC-4 (Resolve Memory Conflict)

| **Use Case ID** | UC-4 |
|---|---|
| **Use Case Name** | Resolve Memory Conflict |
| **Actors** | Primary Actor: User |
| **Description** | When new information contradicts a stored memory, the system does not overwrite the memory. It shows both versions and asks the User which one is current. The User can keep the old one, use the new one, or keep both as history. The change is saved in a version history. |
| **Trigger** | The system detects that new information contradicts a stored memory. |
| **Preconditions** | PRE-1. The User is logged in. PRE-2. At least one memory is stored. PRE-3. A conflict was detected during a conversation or while summarizing one. |
| **Postconditions** | POST-1. The version the User chose is marked as current. POST-2. The other version stays in the version history with its dates, marked as past. POST-3. The confidence score of the current memory is reset. POST-4. The change appears in the memory timeline. |
| **Normal Flow** | **4.0 Resolve a Conflict** 1. The system detects that new information conflicts with a stored memory. 2. The system pauses the memory update and shows the stored memory (with its confidence and date) next to the new statement. 3. The User chooses to keep the old memory, use the new one, or keep both. (see 4.1, 4.2) 4. The system updates the memory according to the choice. The old version is marked as past and the new one as current. 5. The system saves the change in the version history. 6. The system resets the confidence score of the current memory. 7. The system confirms the update and returns the User to the conversation. |
| **Alternative Flows** | **4.1 The User keeps both versions** 1. The system keeps both entries and marks the older one with an end date as a past fact. 2. Return to step 5 of the normal flow. **4.2 The User keeps the old memory** 1. The system discards the new statement. 2. The system treats the old memory as confirmed and resets its confidence. 3. Return to step 7 of the normal flow. |
| **Exceptions** | **4.0.E1 The User closes the prompt without choosing** 1. The system leaves the stored memory unchanged and saves the new statement as pending. 2. The system asks again in a later conversation. **4.0.E2 Saving the change fails** 1. The system makes no change and informs the User. 2. The conflict stays pending. |
| **Business Rules** | BR-3. The system shall never overwrite or replace a memory without the User's confirmation. BR-4. A replaced memory shall never be deleted automatically. It stays in the version history. |
| **Assumptions** | 1. The User answers conflict prompts. 2. The conflict check can occasionally flag two memories that do not really conflict. The User's confirmation handles those cases. |

Table 3.5: Use Case Description for UC-5 (Manage Project Workspaces)

| **Use Case ID** | UC-5 |
|---|---|
| **Use Case Name** | Manage Project Workspaces |
| **Actors** | Primary Actor: User |
| **Description** | The User creates, opens, renames, and deletes project workspaces. Each workspace holds its own conversations, tasks, summaries, decisions, documents, and memories. |
| **Trigger** | The User opens the Projects page. |
| **Preconditions** | PRE-1. The User is logged in. |
| **Postconditions** | POST-1. The workspace list reflects the change the User made. |
| **Normal Flow** | **5.0 Create a Project** 1. The User chooses to create a new project. 2. The User enters a project name and an optional description. (see 5.0.E1) 3. The system creates the workspace with its own empty conversations, tasks, documents, and memory. 4. The system opens the new workspace. |
| **Alternative Flows** | **5.1 Open a project** 1. The User selects a project from the list. 2. The system opens it and shows its conversations, tasks, decisions, and summaries. **5.2 Rename a project** 1. The User edits the name and saves. 2. The system updates the project list. **5.3 Delete a project** 1. The User chooses delete and confirms. (see 5.0.E2) 2. The system deletes the project and everything stored in it. |
| **Exceptions** | **5.0.E1 The project name is empty or already used** 1. The system asks the User to enter a different name. **5.0.E2 The User cancels the deletion** 1. The system keeps the project unchanged. |
| **Business Rules** | BR-13. Deleting a project shall also delete its conversations, tasks, documents, and project memories, and shall require confirmation. BR-14. A project shall be visible only to the User who created it. |
| **Assumptions** | 1. Each User works on a limited number of projects at a time. |

Table 3.6: Use Case Description for UC-6 (Manage Project Tasks)

| **Use Case ID** | UC-6 |
|---|---|
| **Use Case Name** | Manage Project Tasks |
| **Actors** | Primary Actor: User |
| **Description** | The User creates tasks inside a project, moves them between To Do, In Progress, and Done, and edits or deletes them to track progress. |
| **Trigger** | The User opens the task board of a project. |
| **Preconditions** | PRE-1. The User is logged in. PRE-2. A project workspace is open. |
| **Postconditions** | POST-1. The task board shows the User's latest changes. POST-2. Task progress is available for project summaries and reports. |
| **Normal Flow** | **6.0 Create and Track a Task** 1. The User chooses to add a task. 2. The User enters a title, an optional description, and an optional due date. (see 6.0.E1) 3. The system adds the task to the To Do column. 4. The User moves the task to In Progress or Done as work continues. (see 6.1) 5. The system saves each status change. |
| **Alternative Flows** | **6.1 Edit a task** 1. The User changes the title, description, or due date and saves. 2. The system updates the task. **6.2 Delete a task** 1. The User chooses delete and confirms. 2. The system removes the task from the board. |
| **Exceptions** | **6.0.E1 The task title is empty** 1. The system asks the User to enter a title. **6.0.E2 Saving fails** 1. The system informs the User and keeps the task in its earlier state. |
| **Business Rules** | BR-15. Every task shall belong to exactly one project. BR-16. A task shall have exactly one status: To Do, In Progress, or Done. |
| **Assumptions** | 1. Tasks are managed by the User only. The system does not assign tasks to other users. |

Table 3.7: Use Case Description for UC-7 (Upload Documents)

| **Use Case ID** | UC-7 |
|---|---|
| **Use Case Name** | Upload Documents |
| **Actors** | Primary Actor: User |
| **Description** | The User uploads a PDF, TXT, or Markdown file to the knowledge base. The system extracts the text, splits it into sections, creates embeddings, and indexes it so it can be searched later. |
| **Trigger** | The User chooses to upload a document in the knowledge base. |
| **Preconditions** | PRE-1. The User is logged in. PRE-2. The User has a PDF, TXT, or Markdown file ready. |
| **Postconditions** | POST-1. The document is stored and listed with the status "Indexed". POST-2. The document's embeddings are stored and can be searched. |
| **Normal Flow** | **7.0 Upload a Document** 1. The User selects a file and chooses the knowledge base (personal or a project). 2. The system checks the file type and size. (see 7.0.E1, 7.0.E2) 3. The system stores the file and shows it with the status "Processing". 4. A background job extracts the text, splits it into sections, and creates embeddings. (see 7.0.E3) 5. The system saves the embeddings and changes the status to "Indexed". |
| **Alternative Flows** | **7.1 Delete a document** 1. The User chooses delete and confirms. 2. The system removes the file and its embeddings. **7.2 Re-index a document** 1. The User chooses re-index. 2. The system repeats steps 4 and 5 of the normal flow. |
| **Exceptions** | **7.0.E1 Unsupported file type** 1. The system rejects the file and lists the accepted types: PDF, TXT, and Markdown. **7.0.E2 File is larger than the size limit** 1. The system rejects the file and states the limit. **7.0.E3 Text cannot be extracted (for example, a scanned PDF with no text)** 1. The system marks the document as "Failed" and tells the User why. |
| **Business Rules** | BR-17. Only PDF, TXT, and Markdown files shall be accepted. BR-18. A document shall be searchable only by the User, or the project members, who own it. |
| **Assumptions** | 1. Uploaded PDFs contain selectable text. 2. The file size limit is 20 MB. |

Table 3.8: Use Case Description for UC-8 (Ask Questions from Documents)

| **Use Case ID** | UC-8 |
|---|---|
| **Use Case Name** | Ask Questions from Documents |
| **Actors** | Primary Actor: User Secondary Actors: Cloud LLM Provider, Local Model Runtime |
| **Description** | The User asks a question about the uploaded documents. The system finds the most relevant sections and uses Retrieval-Augmented Generation (RAG) to write an answer based on them, with references to the sources. |
| **Trigger** | The User asks a question in the chat and selects the knowledge base as the source. |
| **Preconditions** | PRE-1. The User is logged in. PRE-2. At least one document is indexed. |
| **Postconditions** | POST-1. The answer and its source references are shown to the User and stored in the conversation. |
| **Normal Flow** | **8.0 Ask a Question** 1. The User types a question and selects the knowledge base. 2. The system converts the question into an embedding. 3. The system searches the indexed documents for the most similar sections. (see 8.1) 4. The system selects a model for the request (see UC-11) and sends the question with the retrieved sections. 5. The model writes an answer based on those sections. (see 8.0.E1) 6. The system shows the answer with references to the source documents and sections. |
| **Alternative Flows** | **8.1 No relevant sections found** 1. The system tells the User that the documents do not contain an answer. 2. The use case ends. |
| **Exceptions** | **8.0.E1 The selected model is unavailable** 1. The system informs the User and offers to retry. |
| **Business Rules** | BR-19. Every document-based answer shall list the documents it used. BR-20. The system shall use only documents the User is allowed to access. |
| **Assumptions** | 1. The answer quality depends on how well the documents were indexed. |

Table 3.9: Use Case Description for UC-9 (Run Multi-Agent Task)

| **Use Case ID** | UC-9 |
|---|---|
| **Use Case Name** | Run Multi-Agent Task |
| **Actors** | Primary Actor: User Secondary Actors: Cloud LLM Provider, Local Model Runtime |
| **Description** | The User submits a complex request. An orchestrator splits the work among a planning agent, a research agent, a reviewer agent, and a response agent, and returns a final answer. The system logs which model handled each step. |
| **Trigger** | The User submits a request that needs several steps, or chooses to run it as a multi-agent task. |
| **Preconditions** | PRE-1. The User is logged in. PRE-2. A chat or project workspace is open. PRE-3. At least one language model is reachable. |
| **Postconditions** | POST-1. The final response is shown to the User and stored. POST-2. An execution log is stored with the agent, model, response time, and estimated cost for each step. |
| **Normal Flow** | **9.0 Run a Multi-Agent Task** 1. The User submits the request. 2. The orchestrator passes the request to the planning agent. 3. The planning agent divides the request into smaller subtasks. 4. For each subtask, the orchestrator chooses a model (see UC-11). 5. The research agent collects relevant information from the knowledge base and the stored memories. (see 9.1) 6. The reviewer agent checks the findings for quality and completeness. (see 9.2) 7. The response agent combines the reviewed findings into one structured answer. 8. The system shows the answer to the User and stores the execution log. (see 9.0.E1, 9.0.E2) |
| **Alternative Flows** | **9.1 No relevant documents found** 1. The research agent works from the model's general knowledge and notes that no uploaded source was used. 2. Return to step 6 of the normal flow. **9.2 The reviewer finds gaps** 1. The reviewer sends the findings back to the research agent with a note on what is missing. 2. Return to step 5 of the normal flow. |
| **Exceptions** | **9.0.E1 An agent step fails or times out** 1. The orchestrator retries the step up to 2 times. 2. If it still fails, the system shows the User a partial result and says which step failed. **9.0.E2 No model is reachable** 1. The system stops the task and informs the User. |
| **Business Rules** | BR-5. The reviewer and research agents shall loop at most 2 times for one task. BR-6. Every agent step shall be written to the execution log. |
| **Assumptions** | 1. The knowledge base has already been indexed if the User wants answers from documents. 2. A single task fits within the context limits of the selected models. |

Table 3.10: Use Case Description for UC-10 (Generate PDF Report)

| **Use Case ID** | UC-10 |
|---|---|
| **Use Case Name** | Generate PDF Report |
| **Actors** | Primary Actor: User |
| **Description** | The User creates a downloadable PDF report from information in Synoras AI. Report types are conversation summary, project summary, and AI transparency report, which shows the memories used, the conflicts resolved, and the models chosen for each subtask. |
| **Trigger** | The User chooses "Generate report" on a conversation or project. |
| **Preconditions** | PRE-1. The User is logged in. PRE-2. The conversation or project has stored information. |
| **Postconditions** | POST-1. A PDF file is created and available for download. |
| **Normal Flow** | **10.0 Generate a Report** 1. The User selects a conversation or project and chooses a report type. 2. The system collects the required information. (see 10.0.E1) 3. The system validates the data and sends it to the PDF generation service. 4. The service creates the PDF. (see 10.0.E2) 5. The system offers the PDF for download. |
| **Alternative Flows** | **10.1 Regenerate a report** 1. The User requests the same report again after the project changed. 2. The system creates a new PDF with the latest information. |
| **Exceptions** | **10.0.E1 There is no data for the chosen report** 1. The system informs the User that nothing is available to report. **10.0.E2 PDF generation fails** 1. The system informs the User and offers to retry. |
| **Business Rules** | BR-21. A report shall contain only the requesting User's own data. BR-22. Data shall be validated before it is passed to the PDF service. |
| **Assumptions** | 1. Reports are generated on request and are not scheduled. |

Table 3.11: Use Case Description for UC-11 (Route Subtask to Model)

| **Use Case ID** | UC-11 |
|---|---|
| **Use Case Name** | Route Subtask to Model |
| **Actors** | Primary Actor: System (Orchestrator) Secondary Actors: Cloud LLM Provider, Local Model Runtime |
| **Description** | Before a subtask runs, the orchestrator estimates how complex it is and picks a model to match. Simple subtasks go to a smaller or local model. Harder ones go to a stronger cloud model. The decision, response time, and estimated cost are logged. |
| **Trigger** | The orchestrator is about to run a subtask, from a chat message (UC-2) or a multi-agent task (UC-9). |
| **Preconditions** | PRE-1. The subtask has been defined. PRE-2. The routing settings (complexity thresholds and model list) are loaded. |
| **Postconditions** | POST-1. The subtask has run on the selected model. POST-2. A log entry is stored with the subtask, its complexity level, the model used, the response time, and the estimated cost. |
| **Normal Flow** | **11.0 Route a Subtask** 1. The orchestrator passes the subtask to the complexity classifier. (see 11.0.E2) 2. The classifier rates the subtask as Low, Medium, or High, based on task type, input length, and the reasoning it needs. 3. The orchestrator selects a model: Low goes to the local model, Medium to a smaller cloud model, High to a stronger cloud model. 4. The orchestrator sends the subtask to the selected model. (see 11.1) 5. The model returns its result. (see 11.0.E1, 11.2) 6. The system stores the log entry. |
| **Alternative Flows** | **11.1 The local model is unavailable** 1. The orchestrator sends the Low subtask to a smaller cloud model instead. 2. Return to step 5 of the normal flow. **11.2 The result of a Low or Medium subtask fails the quality check** 1. The orchestrator runs the subtask again on a stronger cloud model. 2. Return to step 6 of the normal flow. |
| **Exceptions** | **11.0.E1 The cloud provider cannot be reached** 1. The system retries up to 2 times. 2a. If the subtask is Low complexity, it continues on the local model. 2b. Else the system informs the User that the task could not be completed. **11.0.E2 The classifier fails to produce a rating** 1. The orchestrator treats the subtask as High complexity and uses the stronger cloud model. |
| **Business Rules** | BR-7. When the complexity is uncertain, the system shall use the stronger model. BR-8. Every routing decision shall be logged. |
| **Assumptions** | 1. The local model can handle Low complexity subtasks at acceptable quality. 2. Estimated cost is calculated from the provider's published token prices. |

Table 3.12: Use Case Description for UC-12 (View Routing & Cost Log)

| **Use Case ID** | UC-12 |
|---|---|
| **Use Case Name** | View Routing & Cost Log |
| **Actors** | Primary Actor: User |
| **Description** | The User opens the log of routing decisions to see which model handled each subtask, how complex the subtask was, how long it took, and its estimated cost. The page also shows total cost against an "always use the strongest model" baseline. |
| **Trigger** | The User opens the Routing Log page for a session or project. |
| **Preconditions** | PRE-1. The User is logged in. PRE-2. At least one subtask has been routed. |
| **Postconditions** | POST-1. The log is displayed. Stored data is unchanged. |
| **Normal Flow** | **12.0 View the Log** 1. The User opens the Routing Log page and selects a session or project. 2. The system loads the log entries. (see 12.1) 3. The system shows each entry with the subtask, complexity level, model used, response time, and estimated cost. 4. The system shows the total cost, average response time, and the estimated saving against the baseline. |
| **Alternative Flows** | **12.1 No log entries exist** 1. The system shows a message that no tasks have been routed yet. **12.2 Filter the log** 1. The User filters by date, complexity level, or model. 2. The system shows the matching entries and updates the totals. |
| **Exceptions** | **12.0.E1 The log cannot be loaded** 1. The system informs the User and offers to retry. |
| **Business Rules** | BR-23. The log shall show only the logged-in User's own entries. BR-24. The baseline comparison shall be labeled as an estimate. |
| **Assumptions** | 1. Cost values are estimated from the providers' published token prices. |

Table 3.13: Use Case Description for UC-13 (Manage Users & Monitor System)

| **Use Case ID** | UC-13 |
|---|---|
| **Use Case Name** | Manage Users & Monitor System |
| **Actors** | Primary Actor: Administrator |
| **Description** | The Administrator manages user accounts and checks the health of the system, including background jobs and recent errors. |
| **Trigger** | The Administrator opens the admin dashboard. |
| **Preconditions** | PRE-1. The Administrator is logged in with an administrator account. |
| **Postconditions** | POST-1. Account changes the Administrator made are saved. POST-2. The action is recorded in the system log. |
| **Normal Flow** | **13.0 Manage Users** 1. The Administrator opens the admin dashboard. 2. The system lists user accounts with their status. 3. The Administrator selects an account and chooses to deactivate or reactivate it. (see 13.0.E1) 4. The system saves the change and records it in the system log. |
| **Alternative Flows** | **13.1 Monitor the system** 1. The Administrator opens the monitoring page. 2. The system shows the status of background jobs and recent errors. **13.2 Reset a User's password (optional, later feature; not part of version 1.0 because it needs an email service)** 1. The Administrator chooses to reset the password of an account. 2. The system sends the User a reset link. |
| **Exceptions** | **13.0.E1 The Administrator tries to deactivate their own account** 1. The system blocks the action and informs the Administrator. |
| **Business Rules** | BR-25. The Administrator shall not be able to read a User's memories, conversations, or documents. BR-26. Every administrator action shall be written to the system log. |
| **Assumptions** | 1. At least one administrator account exists from the start. |

# Functional Requirements:

This section lists the functional requirements of Synoras AI, grouped by system feature. Each requirement has a unique identifier (FR-1, FR-2, and so on) and is written from the system’s perspective (“the system shall...”). The requirements come from the use cases in Section 3, and each one names its source use case and the business rules that apply to it. Priority is High for requirements that the project’s core features depend on, Medium for requirements that are important but do not block other work, and Low for supporting requirements.

## User Authentication:

This feature lets people create accounts and log in, so each User’s memories, projects, and documents stay private. It covers registration, login, logout, and temporary lockout after repeated failed attempts. It is derived from use case UC-1.

Table 4.1: Functional requirement FR-1

| **Identifier** | **FR-1** |
|---|---|
| **Title** | User Registration |
| **Requirement** | The system shall allow a new User to create an account by entering a name, email address, and password. The system shall reject an email that is already registered and shall show which input is invalid. |
| **Source** | UC-1; Project team |
| **Rationale** | Each User needs a separate account so that memories, projects, and documents stay private. |
| **Business Rule** | BR-10: Passwords shall be at least 8 characters long. |
| **Dependencies** | None |
| **Priority** | High |

Table 4.2: Functional requirement FR-2

| **Identifier** | **FR-2** |
|---|---|
| **Title** | User Login and Logout |
| **Requirement** | The system shall allow a registered User or Administrator to log in with email and password and to log out. After 5 failed login attempts in a row, the system shall lock login for that account for 15 minutes. |
| **Source** | UC-1; Project team |
| **Rationale** | Controlled access protects stored memories and documents. |
| **Business Rule** | BR-9: Passwords shall be stored only in hashed form. |
| **Dependencies** | FR-1 |
| **Priority** | High |

## AI Chat and Conversation Management:

This feature is the main way Users talk to Synoras AI. It covers sending messages, receiving streamed replies built with the User’s relevant memories, and storing, searching, and reopening conversations. It is derived from use case UC-2.

Table 4.3: Functional requirement FR-3

| **Identifier** | **FR-3** |
|---|---|
| **Title** | Send Messages and Receive Streamed Replies |
| **Requirement** | When a logged-in User submits a message, the system shall build a prompt from the message, the recent conversation, and the retrieved memories, send it to the selected model, and stream the reply to the User as it is generated. The system shall not send an empty message. If the selected model is unavailable, the system shall inform the User, keep the message, and offer a retry. |
| **Source** | UC-2; Project team |
| **Rationale** | Streaming makes the assistant feel responsive, and the memory-based prompt is what lets it continue earlier work. |
| **Business Rule** | BR-1: The system shall retrieve only the logged-in User’s own memories. |
| **Dependencies** | FR-2, FR-6, FR-21 |
| **Priority** | High |

Table 4.4: Functional requirement FR-4

| **Identifier** | **FR-4** |
|---|---|
| **Title** | Conversation History |
| **Requirement** | The system shall store every conversation. The User shall be able to start a new conversation, reopen an earlier one, search conversations by keyword, and delete a conversation. |
| **Source** | UC-2; Project team |
| **Rationale** | Users need to find and continue earlier discussions. |
| **Business Rule** | BR-1 (see FR-3) |
| **Dependencies** | FR-3 |
| **Priority** | Medium |

## Persistent Memory Management:

This feature lets the system remember useful information between conversations and keep it reliable. It covers extracting memories from conversations, retrieving relevant memories, letting the User manage them, lowering confidence scores over time, detecting conflicting information, and resolving conflicts with a version history. It is derived from use cases UC-2, UC-3, and          UC-4.

Table 4.5: Functional requirement FR-5

| **Identifier** | **FR-5** |
|---|---|
| **Title** | Conversation Summarization and Memory Extraction |
| **Requirement** | When a conversation ends or has been inactive for 30 minutes, the system shall summarize it as a background job, extract the useful information, and store it as memories. The system shall not extract memories when the User has turned automatic memory collection off. |
| **Source** | UC-2, UC-3; Project team |
| **Rationale** | This is how the system keeps context between conversations without making the User repeat information. |
| **Business Rule** | BR-11: Personal memory and project memory shall be stored separately. |
| **Dependencies** | FR-3, FR-7 |
| **Priority** | High |

Table 4.6: Functional requirement FR-6

| **Identifier** | **FR-6** |
|---|---|
| **Title** | Memory Retrieval |
| **Requirement** | Before replying to a message, the system shall retrieve the most relevant memories (by default, the top 5) from the User’s personal memory and the active project’s memory using vector similarity. The system shall record which memories were used for each reply and shall update their last-accessed time. If no memory is relevant, the system shall continue with the message and recent conversation only. |
| **Source** | UC-2; Project team |
| **Rationale** | Relevant memories make replies personal, and the record of memories used supports the transparency report. |
| **Business Rule** | BR-1, BR-11 |
| **Dependencies** | FR-5 |
| **Priority** | High |

Table 4.7: Functional requirement FR-7

| **Identifier** | **FR-7** |
|---|---|
| **Title** | Memory Management |
| **Requirement** | The User shall be able to view all stored memories with their confidence score and last-confirmed date, edit a memory, delete a memory after confirmation, confirm that a memory is still correct, view a memory’s version history, and turn automatic memory collection on or off. An edited memory shall keep its earlier text in the version history. |
| **Source** | UC-3; Project team |
| **Rationale** | The User must stay in control of what the system remembers. |
| **Business Rule** | BR-11; BR-12: A deleted memory shall not be used in later replies. |
| **Dependencies** | FR-5 |
| **Priority** | High |

Table 4.8: Functional requirement FR-8

| **Identifier** | **FR-8** |
|---|---|
| **Title** | Memory Confidence Scoring and Decay |
| **Requirement** | The system shall assign every memory a confidence score when it is created. A background job shall recalculate the scores at least once a day, lowering each score as time passes since the memory was last confirmed, using the formula confidence = exp(-DECAY_RATE × days since last confirmed), where DECAY_RATE is a configurable setting (initial value 0.01 per day). The score shall be stored as a number from 0 to 1 and shown to the User as a percentage. The system shall also store the time each memory was last used, so that lack of use can be added to the formula if testing shows it is needed. The score shall be reset when the User confirms, edits, or resolves a conflict for that memory. When a memory with a score below 50% is used in a reply, the system shall mark it as needing re-verification. |
| **Source** | UC-2, UC-3; Project team |
| **Rationale** | Stored information can become outdated. A falling score shows which memories need checking, instead of the system treating old facts as always true. |
| **Business Rule** | BR-2: A memory with confidence below 50% shall be marked as needing re-verification when it is used in a reply. |
| **Dependencies** | FR-5, FR-7 |
| **Priority** | High |

Table 4.9: Functional requirement FR-9

| **Identifier** | **FR-9** |
|---|---|
| **Title** | Memory Conflict Detection |
| **Requirement** | Before saving a new memory, the system shall compare it with similar stored memories and decide whether it contradicts any of them. When it does, the system shall pause the update and start the conflict resolution flow (FR-10) instead of saving or overwriting anything. The system shall run this check on memories extracted from summaries and on information the User states in a conversation. |
| **Source** | UC-2, UC-4; Project team |
| **Rationale** | Silent overwriting loses history, and ignoring contradictions leaves wrong facts in memory. |
| **Business Rule** | BR-3: The system shall never overwrite or replace a memory without the User’s confirmation. |
| **Dependencies** | FR-5, FR-6 |
| **Priority** | High |

Table 4.10: Functional requirement FR-10

| **Identifier** | **FR-10** |
|---|---|
| **Title** | Memory Conflict Resolution and Version History |
| **Requirement** | When a conflict is detected, the system shall show the stored memory (with its confidence and date) next to the new statement and ask the User to keep the old memory, use the new one, or keep both. The system shall apply the User’s choice, mark the replaced version as past in the version history, reset the confidence of the current memory, and show the change in the memory timeline. If the User does not choose, the system shall leave the memory unchanged, save the new statement as pending, and ask again in a later conversation. |
| **Source** | UC-4; Project team |
| **Rationale** | The User decides which version is correct, and the history shows how information changed over time. |
| **Business Rule** | BR-3; BR-4: A replaced memory shall never be deleted automatically. It stays in the version history. |
| **Dependencies** | FR-9 |
| **Priority** | High |

## Project Workspaces:

This feature lets Users organize their work into separate projects. It covers creating and managing projects, a task board for each project, and using project context in conversations. It is derived from use cases UC-5, UC-6, and UC-2.

Table 4.11: Functional requirement FR-11

| **Identifier** | **FR-11** |
|---|---|
| **Title** | Project Management |
| **Requirement** | The User shall be able to create a project with a name and an optional description, open it, rename it, and delete it after confirmation. The system shall reject an empty or duplicate project name. Each project shall have its own conversations, tasks, summaries, decisions, documents, and memories. The User shall be able to add, edit, and delete short project notes of type summary or decision. |
| **Source** | UC-5; Project team |
| **Rationale** | Separate workspaces keep each project’s information organized and prevent it from mixing with other work. |
| **Business Rule** | BR-13: Deleting a project shall also delete its conversations, tasks, documents, and project memories, and shall require confirmation. BR-14: A project shall be visible only to the User who created it. |
| **Dependencies** | FR-2 |
| **Priority** | High |

Table 4.12: Functional requirement FR-12

| **Identifier** | **FR-12** |
|---|---|
| **Title** | Project Task Board |
| **Requirement** | Within a project, the User shall be able to add a task with a title, an optional description, and an optional due date, move it between To Do, In Progress, and Done, edit it, and delete it. The system shall reject a task without a title. |
| **Source** | UC-6; Project team |
| **Rationale** | Basic task tracking lets the User follow progress inside the same workspace, and the status feeds project reports. |
| **Business Rule** | BR-15: Every task shall belong to exactly one project. BR-16: A task shall have exactly one status: To Do, In Progress, or Done. |
| **Dependencies** | FR-11 |
| **Priority** | Medium |

Table 4.13: Functional requirement FR-13

| **Identifier** | **FR-13** |
|---|---|
| **Title** | Project Context in Conversations |
| **Requirement** | When the User chats inside a project, the system shall store the project’s conversations, decisions, and summaries under that project and shall use the project’s memories, along with the User’s personal memories, when replying. |
| **Source** | UC-5, UC-2; Project team |
| **Rationale** | The assistant needs the context of the specific project to give relevant help. |
| **Business Rule** | BR-11 |
| **Dependencies** | FR-6, FR-11 |
| **Priority** | Medium |

## Knowledge Base and RAG:

This feature lets Users upload documents and ask questions answered from them. It covers uploading and validating files, indexing them, managing the document list, and answering questions with references to the sources. It is derived from use cases UC-7 and UC-8.

Table 4.14: Functional requirement FR-14

| **Identifier** | **FR-14** |
|---|---|
| **Title** | Document Upload and Validation |
| **Requirement** | The User shall be able to upload a document to the personal knowledge base or to a project. The system shall accept only PDF, TXT, and Markdown files of up to 20 MB, and shall reject any other file with a message that states the accepted types or the size limit. |
| **Source** | UC-7; Project team |
| **Rationale** | Limiting file types and size keeps processing reliable. |
| **Business Rule** | BR-17: Only PDF, TXT, and Markdown files shall be accepted. |
| **Dependencies** | FR-2 |
| **Priority** | High |

Table 4.15: Functional requirement FR-15

| **Identifier** | **FR-15** |
|---|---|
| **Title** | Document Processing and Indexing |
| **Requirement** | After an upload is accepted, the system shall show the document with the status “Processing”, and a background job shall extract its text, split it into sections, create embeddings, and store them. The system shall then change the status to “Indexed”. If no text can be extracted, the system shall set the status to “Failed” and tell the User why. |
| **Source** | UC-7; Project team |
| **Rationale** | Indexing makes the document searchable. Background processing keeps the interface responsive. |
| **Business Rule** | None |
| **Dependencies** | FR-14 |
| **Priority** | High |

Table 4.16: Functional requirement FR-16

| **Identifier** | **FR-16** |
|---|---|
| **Title** | Document Management |
| **Requirement** | The User shall be able to view the list of uploaded documents with their status, delete a document together with its embeddings after confirmation, and re-index a document. |
| **Source** | UC-7; Project team |
| **Rationale** | Users need to remove outdated documents and recover from failed indexing. |
| **Business Rule** | BR-18: A document shall be searchable only by the User, or the project members, who own it. |
| **Dependencies** | FR-15 |
| **Priority** | Medium |

Table 4.17: Functional requirement FR-17

| **Identifier** | **FR-17** |
|---|---|
| **Title** | Document-Based Question Answering with Sources |
| **Requirement** | When the User asks a question and selects the knowledge base, the system shall find the most similar sections in the indexed documents the User may access, send them with the question to the selected model, and show the answer together with references to the documents and sections it used. If no relevant section is found, the system shall tell the User that the documents do not contain an answer. |
| **Source** | UC-8; Project team |
| **Rationale** | Answers based on the User’s own documents, with sources, can be checked by the User. |
| **Business Rule** | BR-19: Every document-based answer shall list the documents it used. BR-20: The system shall use only documents the User is allowed to access. |
| **Dependencies** | FR-15, FR-21 |
| **Priority** | High |

## Multi-Agent Collaboration and Model Routing:

This feature handles complex requests by splitting the work among specialized agents and choosing a suitable model for each subtask. It covers multi-agent task execution, failure handling, complexity classification, model selection with fallback, logging of every routing decision, and a log view for the User. It is derived from use cases UC-9, UC-11, and UC-12.

Table 4.18: Functional requirement FR-18

| **Identifier** | **FR-18** |
|---|---|
| **Title** | Multi-Agent Task Execution |
| **Requirement** | When the User submits a complex request, the orchestrator shall pass it to a planning agent that divides it into subtasks, a research agent that collects information from the knowledge base and memories, a reviewer agent that checks the findings, and a response agent that writes the final answer. If the reviewer finds gaps, it shall send the findings back to the research agent, up to 2 times for one task. |
| **Source** | UC-9; Project team |
| **Rationale** | Splitting a complex request among specialized agents improves quality on tasks that need planning, research, and checking. |
| **Business Rule** | BR-5: The reviewer and research agents shall loop at most 2 times for one task. |
| **Dependencies** | FR-6, FR-17, FR-20 |
| **Priority** | High |

Table 4.19: Functional requirement FR-19

| **Identifier** | **FR-19** |
|---|---|
| **Title** | Agent Failure Handling |
| **Requirement** | When an agent step fails or times out, the system shall retry it up to 2 times. If it still fails, the system shall show the User a partial result and name the step that failed. If no model is reachable, the system shall stop the task and inform the User. |
| **Source** | UC-9; Project team |
| **Rationale** | Failures should never leave the User waiting without information. |
| **Business Rule** | BR-6: Every agent step shall be written to the execution log. |
| **Dependencies** | FR-18 |
| **Priority** | Medium |

Table 4.20: Functional requirement FR-20

| **Identifier** | **FR-20** |
|---|---|
| **Title** | Subtask Complexity Classification |
| **Requirement** | Before a subtask runs, the system shall rate its complexity as Low, Medium, or High based on the task type, the input length, and the reasoning the task needs. If the classifier fails or the rating is uncertain, the system shall treat the subtask as High. |
| **Source** | UC-11; Project team |
| **Rationale** | The rating decides which model is used, so simple work does not use an expensive model. |
| **Business Rule** | BR-7: When the complexity is uncertain, the system shall use the stronger model. |
| **Dependencies** | None |
| **Priority** | High |

Table 4.21: Functional requirement FR-21

| **Identifier** | **FR-21** |
|---|---|
| **Title** | Model Selection and Fallback |
| **Requirement** | The system shall send Low subtasks to the local model, Medium subtasks to a smaller cloud model, and High subtasks to a stronger cloud model. If the local model is unavailable, it shall send the Low subtask to a smaller cloud model. If the result of a Low or Medium subtask fails a quality check, it shall run the subtask again on a stronger cloud model. If the cloud provider cannot be reached, the system shall retry up to 2 times and continue Low subtasks on the local model. |
| **Source** | UC-11; Project team |
| **Rationale** | Matching the model to the difficulty lowers cost and response time, and the fallbacks protect quality and availability. |
| **Business Rule** | BR-7 |
| **Dependencies** | FR-20 |
| **Priority** | High |

Table 4.22: Functional requirement FR-22

| **Identifier** | **FR-22** |
|---|---|
| **Title** | Routing and Execution Logging |
| **Requirement** | For every routed subtask and every agent step, the system shall store a log entry with the subtask, its complexity level, the model used, the response time, and the estimated cost. |
| **Source** | UC-9, UC-11; Project team |
| **Rationale** | The log is the data used to measure how much routing saves and to explain each routing decision. |
| **Business Rule** | BR-6, BR-8: Every routing decision shall be logged. |
| **Dependencies** | FR-21 |
| **Priority** | High |

Table 4.23: Functional requirement FR-23

| **Identifier** | **FR-23** |
|---|---|
| **Title** | Routing and Cost Log View |
| **Requirement** | The User shall be able to open the routing log for a session or project, filter it by date, complexity level, or model, and see the total cost, average response time, and estimated saving compared with always using the strongest model. When there are no entries, the system shall show a message saying so. |
| **Source** | UC-12; Project team |
| **Rationale** | Showing the routing decisions and their results makes the system’s behavior visible to the User. |
| **Business Rule** | BR-23: The log shall show only the logged-in User’s own entries. BR-24: The baseline comparison shall be labeled as an estimate. |
| **Dependencies** | FR-22 |
| **Priority** | Medium |

## PDF Report Generation:

This feature lets Users export results as PDF files. It covers conversation summaries, project summaries, and an AI transparency report that shows the memories used, the conflicts resolved, and the models chosen. It is derived from use case UC-10.

Table 4.24: Functional requirement FR-24

| **Identifier** | **FR-24** |
|---|---|
| **Title** | PDF Report Generation |
| **Requirement** | The User shall be able to generate a PDF report for a conversation or project. The available report types shall be conversation summary, project summary, and AI transparency report, which lists the memories used with their confidence, the conflicts resolved, and the model chosen for each subtask. The system shall validate the data before generating the PDF and offer the file for download. If there is no data to report or generation fails, the system shall tell the User and offer a retry where it applies. |
| **Source** | UC-10; Project team |
| **Rationale** | Reports let the User keep and share results outside the system, and the transparency report shows how the system reached its answers. |
| **Business Rule** | BR-21: A report shall contain only the requesting User’s own data. BR-22: Data shall be validated before it is passed to the PDF service. |
| **Dependencies** | FR-8, FR-10, FR-12, FR-22 |
| **Priority** | Medium |

## Administration:

This feature lets the Administrator run the system. It covers managing user accounts and monitoring background jobs and errors, without access to any User’s private data. It is derived from use case UC-13.

Table 4.25: Functional requirement FR-25

| **Identifier** | **FR-25** |
|---|---|
| **Title** | User Account Management |
| **Requirement** | The Administrator shall be able to view user accounts with their status, deactivate and reactivate an account, and, as an optional later feature, send a password reset link to a User. The system shall block an Administrator from deactivating their own account. The system shall not give the Administrator access to any User’s memories, conversations, or documents. |
| **Source** | UC-13; Project team |
| **Rationale** | Account control is needed to run the system, and the privacy rule protects User data. |
| **Business Rule** | BR-25: The Administrator shall not be able to read a User’s memories, conversations, or documents. BR-26: Every administrator action shall be written to the system log. |
| **Dependencies** | FR-2 |
| **Priority** | Medium |

Table 4.26: Functional requirement FR-26

| **Identifier** | **FR-26** |
|---|---|
| **Title** | System Monitoring |
| **Requirement** | The Administrator shall be able to view the status of background jobs and recent system errors. |
| **Source** | UC-13; Project team |
| **Rationale** | Background jobs such as summarization, indexing, and confidence updates must be checked when something goes wrong. |
| **Business Rule** | BR-26 |
| **Dependencies** | FR-25 |
| **Priority** | Low |

# Non-Functional Requirements:

This section lists the non-functional requirements of Synoras AI, which describe how well the system must work rather than what it must do. They are grouped into usability and performance. Each requirement is specific and can be verified by a test, and each has a unique identifier (USE-1 for usability and PER-1 for performance).

## Usability:

Usability requirements cover how easy the system is to learn and use, how errors are shown, and how clearly the memory and routing features are presented to the User.

**USE-1:** A new User shall be able to register, log in, and send a first message within 3 minutes without help or instructions.

**USE-2:** The memory conflict prompt shall show the stored memory and the new statement side by side, and the User shall be able to resolve the conflict with a single selection (keep old, use new, or keep both).

**USE-3:** The memories list shall show each memory’s confidence score and its status (current, needs re-verification, or past) without the User opening the memory.

**USE-4:** Every document-based answer shall show its source references next to the answer, so the User can check a source without leaving the conversation.

**USE-5:** The User shall be able to reopen any earlier conversation from the history in no more than 2 clicks.

**USE-6:** Error messages shall say in plain language what went wrong and what the User can do next. They shall not show technical codes or stack traces.

**USE-7:** The interface shall be usable in current desktop browsers at a screen size of 1366 × 768 pixels, and on tablets with a screen width of at least 768 pixels.

## Performance:

Performance requirements cover response time, processing time, and capacity. The response times for model replies assume that the model provider is available.

**PER-1:** 95% of pages that do not wait for a model reply shall load completely within 3 seconds over an internet connection of 10 Mbps or faster.

**PER-2:** For 90% of messages, the first part of the streamed reply shall appear within 3 seconds of the User submitting the message.

**PER-3:** Memory retrieval shall return the most relevant memories within 1 second for a User with up to 10,000 stored memories.

**PER-4:** The conflict check on a new memory shall finish within 3 seconds, so that a conflict prompt can be shown without a noticeable delay.

**PER-5:** The complexity classifier shall rate a subtask within 1 second.

**PER-6:** A background job shall recalculate the confidence scores of 10,000 memories within 1 minute.

**PER-7:** A PDF document of up to 20 pages shall be processed and indexed within 2 minutes of upload.

**PER-8:** A PDF report of up to 20 pages shall be generated within 10 seconds of the User’s request.

**PER-9:** The system shall support at least 20 Users using it at the same time without the response times in PER-1 and PER-2 getting worse.

**PER-10:** On the project’s evaluation set of test tasks, complexity-based routing shall lower the total estimated cost by at least 30% compared with sending every subtask to the strongest model, while the answer quality stays within 5% of the strongest-model results.

**PER-11:** On the project’s evaluation set of contradicting and non-contradicting memory pairs, the conflict detector shall reach at least 85% precision and 80% recall.

# External Interface Requirements:

This section describes how Synoras AI connects to its users, to other software, to hardware, and to the network. The user interfaces are shown as mockups, which are rough layout sketches. The final design may differ in colors, spacing, and wording, but each screen shall keep the elements described here.

## User Interfaces:

Synoras AI is used through a web browser. All screens share one top navigation bar with the logo, links to Chat, Projects, Memories, Knowledge Base, and Reports, and a user menu.

### UI-1 (Register / Log In):

The login screen shall have email and password fields, a Log In button, and a button to create an account. A link to reset the password is an optional later feature and is not part of version 1.0. The mockup below shows the layout.

Figure 6.1: Mockup of the Register / Log In screen

### UI-2 (Chat):

The chat screen shall have three areas: a list of conversations on the left, the conversation with a message box in the center, and a memory panel on the right. The memory panel shall show each memory with its confidence bar and status. Under each reply, the screen shall show how many memories were used and which model answered. When a reply relies on a memory that needs re-verification, the screen shall offer buttons to confirm it or update it. The mockup below shows the layout.

Figure 6.2: Mockup of the chat screen with memory panel

### UI-3 (Memory Conflict):

When new information conflicts with a stored memory, the system shall show the stored memory and the new statement side by side, three buttons (Keep old, Use new, Keep both), and a timeline of the memory’s earlier versions. The mockup below shows the layout.

Figure 6.3: Mockup of the memory conflict resolution screen

### UI-4 (Project Workspace and Knowledge Base):

The project screen shall have a list of projects on the left, a task board with the columns To Do, In Progress, and Done, and a knowledge base area below it. The knowledge base area shall show the uploaded documents with their status, an upload button, and a box to ask a question about the documents. Answers shall show the source of the information. The mockup below shows the layout.

Figure 6.4: Mockup of the project workspace with task board and knowledge base

### UI-5 (Agent Pipeline and Routing Log):

For multi-agent tasks, the system shall show the four agents in order (planning, research, reviewer, response) with the model each one used. Below it, the system shall show a routing log table with the time, subtask, complexity, model used, and cost and time for every subtask, and a summary of total cost, average time, and estimated saving. The mockup below shows the layout.

Figure 6.5: Mockup of the multi-agent pipeline and routing log

### UI-6 (Reports):

The reports screen shall let the User choose a report type, preview it, and download it as a PDF. The AI transparency report shall list the memories used with their scores, the conflicts resolved, the model routing summary, and the agents involved. The mockup below shows the layout.

Figure 6.6: Mockup of the AI transparency report

### UI-7 (General rules):

All screens shall use the same navigation bar, buttons, and colors. Every action that deletes data shall ask the User to confirm. Error messages shall appear next to the field or action that caused them.

## Software Interfaces:

**SI-1 (Frontend to backend):** The Next.js frontend shall communicate with the FastAPI backend through a REST API using JSON. Streamed chat replies shall be sent to the frontend as they are generated.

**SI-2 (Backend to database):** The backend shall store structured data, memories, version histories, logs, and embeddings in PostgreSQL 15 or later with the pgvector extension, and shall search embeddings by vector similarity.

**SI-3 (Backend to Redis and background worker):** The backend shall send background jobs to a Celery worker through Redis. The jobs are conversation summarization, memory confidence updates, and document indexing.

**SI-4 (Backend to cloud language models):** The backend shall send prompts to cloud language model providers through their web APIs and receive the replies. The API keys shall be stored in server configuration and shall never be sent to the browser.

**SI-5 (Backend to local model):** The backend shall send prompts to a local model through a local runtime that exposes an HTTP interface on the same machine or the same local network.

**SI-6 (Embeddings):** The system shall use an embedding model to convert documents, memories, and questions into vectors. The same embedding model shall be used for storing and searching.

**SI-7 (PDF service):** The backend shall send validated report data to a separate Node.js service that creates the PDF with a PDF-generation library and returns the file.

**SI-8 (File storage):** The system shall store uploaded documents on the local disk of the server and shall keep only the file path and details in the database.

## Hardware Interfaces:

Synoras AI does not use any special hardware devices. The hardware needs are:

**HI-1:** Users shall access the system from a computer or tablet with a keyboard or touch input, a screen of at least 1366 x 768 pixels, and a current web browser.

**HI-2:** The server hosting the backend, database, Redis, and PDF service shall have at least 8 GB of RAM and 20 GB of free disk space.

**HI-3:** The machine running the local model shall have enough memory for the chosen model, at least 16 GB of RAM. A graphics card (GPU) is optional but improves response time.

## Communications Interfaces:

**CI-1:** All communication between the browser and the backend shall use HTTPS.

**CI-2:** Communication between the backend and cloud model providers shall use HTTPS with an API key. If a provider cannot be reached, the system shall follow the retry rules in FR-21.

**CI-3:** The backend, database, Redis, PDF service, and local model runtime shall communicate over a private network or the same machine, and the database and Redis shall not be reachable from the internet.

**CI-4:** Streamed replies shall use a connection that keeps open while the reply is generated. If the connection drops, the system shall keep the message and let the User retry.

**CI-5:** The system shall need an internet connection for cloud models. Chat requests rated Low complexity can still be answered by the local model without one.

**CI-6:** The browser, the backend, and the PDF service shall exchange data in JSON format, except for the final PDF file, which shall be sent as a file download.

# Project Gantt Chart:

The project will be completed in about eight months, from October 2026 to May 2027, in four phases. The Gantt chart below shows each activity with its start, end, and length in days.

Planning and Design (October to early November 2026): requirements analysis, literature review, system architecture, and UI/UX design. This phase produces the SRS, the system design, and the interface mockups.

Core Development (November 2026 to January 2027): the AI chat workspace, persistent memory, project workspaces, the knowledge base with RAG, and the memory confidence decay and conflict resolution mechanism. The basic memory is built first, and the decay and conflict mechanism is added on top of it.

Advanced Features (January to March 2027): multi-agent collaboration, complexity-aware model routing, and PDF report generation. The router starts after the multi-agent pipeline is running, because it assigns models to the agents’ subtasks.

Testing and Delivery (March to May 2027): system integration, two evaluation activities, security and performance testing, deployment, final documentation, and the final presentation. The memory conflict evaluation measures how accurately conflicts are detected, and the routing evaluation measures cost and response time against always using the strongest model.

Figure 7.1: Gantt Chart of the Synoras AI

# References:

[1] H. Chao, Y. Bai, R. Sheng, T. Li, and Y. Sun, "STALE: Can LLM Agents Know When Their Memories Are No Longer Valid?," *arXiv preprint arXiv:2605.06527,* 2026. [Online]. Available: https://arxiv.org/abs/2605.06527.

[2] J. Hu and S. Ramachandran, "The Memory Trust Gap: Capability-Dependent Failures in Persistent-Memory Agents," *arXiv preprint arXiv:2609.01852,* 2026. [Online]. Available: https://arxiv.org/abs/2609.01852.

[3] Z. Wang, "TOKI: A Bitemporal Operator Algebra for Contradiction Resolution in LLM-Agent Persistent Memory," *arXiv preprint arXiv:2606.06240,* 2026. [Online]. Available: https://arxiv.org/abs/2606.06240.

[4] C. Lam, J. Li, L. Zhang, and K. Zhao, "Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework," *arXiv preprint arXiv:2603.11768,* 2026. [Online]. Available: https://arxiv.org/abs/2603.11768.

[5] I. Ong *et al.*, "RouteLLM: Learning to Route LLMs with Preference Data," in *International Conference on Learning Representations (ICLR 2025)*, 2025. [Online]. Available: https://arxiv.org/abs/2406.18665. [Online]. Available: https://arxiv.org/abs/2406.18665

[6] X. Wang *et al.*, "MixLLM: Dynamic Routing in Mixed Large Language Models," in *Proceedings of the 2025 Conference of the Nations of the Americas Chapter of the Association for Computational Linguistics: Human Language Technologies (Volume 1: Long Papers)*, Albuquerque, New Mexico, 2025: Association for Computational Linguistics, pp. 10912–10922. [Online]. Available: https://aclanthology.org/2025.naacl-long.545/. [Online]. Available: https://aclanthology.org/2025.naacl-long.545/

[7] T. Shnitzer *et al.*, "Large Language Model Routing with Benchmark Datasets," *arXiv preprint arXiv:2309.15789,* 2023. [Online]. Available: https://arxiv.org/abs/2309.15789.

[8] Vercel, "Next.js Documentation." [Online]. Available: https://nextjs.org/docs.

[9] FastApi, "FastAPI Documentation." [Online]. Available: https://fastapi.tiangolo.com.

[10] S. Q. L. G. D. G. Postgre, "PostgreSQL Documentation." [Online]. Available: https://www.postgresql.org/docs.

[11] A. Kane, "pgvector: Open-source vector similarity search for Postgres." [Online]. Available: https://github.com/pgvector/pgvector.

[12] Redis, "Redis Documentation." [Online]. Available: https://redis.io/docs.

[13] P. Celery, "Celery Documentation." [Online]. Available: https://docs.celeryq.dev.

[14] Ollama, "Ollama." [Online]. Available: https://ollama.com.

[15] Docker, "Docker Documentation." [Online]. Available: https://docs.docker.com.

[16] S. Meta Open, "React Documentation." [Online]. Available: https://react.dev.

[17] Microsoft, "TypeScript Documentation." [Online]. Available: https://www.typescriptlang.org/docs.

[18] L. Tailwind, "Tailwind CSS Documentation." [Online]. Available: https://tailwindcss.com/docs.

[19] LangChain, "LangGraph Documentation." [Online]. Available: https://docs.langchain.com/oss/python/langgraph/overview.

[20] K. Wiegers and J. Beatty, *Software Requirements*, 3rd ed. Redmond, WA: Microsoft Press, 2013.

# COMSATS University Islamabad,

# Sahiwal Campus

**SOFTWARE DESIGN**

**DESCRIPTION**

**(SDD DOCUMENT)**

**for**

**Synoras AI**

Version 1.0

***By***

**[Team Member 1] [Registration No. 1]**

**[Team Member 2] [Registration No. 2]**

**[Team Member 3] [Registration No. 3]**

***Supervisor***

**[Supervisor Name]**

***Bachelor* *of Science in* *Computer Science (2023-**202***

# List of Figures

**Figure 3.1.1: System Architecture of Synoras AI 3**

**Figure 3.2.1: Activity Diagram: Memory Extraction and Conflict Resolution 4**

**Figure 3.2.2: Activity Diagram: Confidence Decay and Re-verification 5**

**Figure 3.2.3: Activity Diagram: Multi-Agent Task with Complexity-Aware Routing 6**

**Figure 3.2.4: Activity Diagram: Document Upload and Question Answering 7**

**Figure 4.1.1: Class Diagram of Synoras AI 8**

**Figure 4.2.1: Sequence Diagram: Chat with Memory 9**

**Figure 4.2.2: Sequence Diagram: Document Upload and Question Answering 10**

**Figure 4.3.1: State Transition Diagram of a Memory Item 11**

**Figure 4.4.1: Data Flow Diagram Level 0 (Context Diagram) 12**

**Figure 4.4.2: Data Flow Diagram Level 1 13**

**Figure 5.1.1: Entity Relationship Diagram of Synoras AI 14**

**Figure 8.1.1: Register / Log In Screen 26**

**Figure 8.1.2: Chat Screen with Memory Panel and Knowledge Graph Panel 27**

**Figure 8.1.3: Memory Conflict Resolution Screen 28**

**Figure 8.1.4: Project Workspace with Task Board and Knowledge Base 29**

**Figure 8.1.5: Multi-Agent Pipeline and Routing Log Screen 30**

**Figure 8.1.6: Reports Screen (AI Transparency Report) 31**

# List of Tables

**Table 4.2.1: Events of the Answer Stream 10**

**Table 5.2.1: Data Dictionary of Synoras AI 15**

**Table 7.1.1: Requirements Traceability Matrix 22**

**Table 8.2.1: Objects and Actions of the Register / Log In Screen 32**

**Table 8.2.2: Objects and Actions of the Chat Screen 32**

**Table 8.2.3: Objects and Actions of the Memory Conflict Screen 33**

**Table 8.2.4: Objects and Actions of the Project Workspace and Knowledge Base Screen 33**

**Table 8.2.5: Objects and Actions of the Agent Pipeline and Routing Log Screen 34**

**Table 8.2.6: Objects and Actions of the Reports Screen 34**

# Revision History

| **Name** | **Date** | **Reason for Changes** | **Version** |
|---|---|---|---|
|  |  |  |  |
|  |  |  |  |

# Application Evaluation History

| **Comments (by committee)** ***include the ones given at scope time both in doc and presentation** | **Action Taken** |
|---|---|
|  |  |
|  |  |

**Supervised By**

**[Supervisor Name]**

SignatureSignature

# Introduction:

This document describes the software design of Synoras AI, a web-based AI platform that remembers users across conversations and coordinates multiple AI agents to complete tasks. It is based on the Software Requirements Specification (SRS) version 1.0 and shows how the requirements written there will be built. The document is meant for the project team, the supervisor, and the evaluation committee.

The scope covered so far includes six modules:

- **AI Chat and Conversation Management:** a chat interface with streamed replies and stored conversation history.
- **Persistent Memory Management:** summarizing conversations into memories, giving each memory a confidence score that decreases over time, and asking the user to resolve conflicting information while keeping a version history.
- **AI Project Workspace:** projects with their own conversations, tasks, summaries, and decisions.
- **Knowledge Base and GraphRAG:** uploading PDF, TXT, and Markdown files, building a knowledge graph from them, and answering questions from them with GraphRAG (Retrieval-Augmented Generation that uses the graph), with a live view of the graph while an answer is written.
- **Multi-Agent Collaboration:** research, planning, reviewing, and response agents managed by an orchestrator that routes each subtask to a local model, a smaller cloud model, or a stronger cloud model based on its complexity, and logs the cost and response time.
- **PDF Report Generation and System Security:** downloadable reports, together with authentication, authorization, input validation, and memory separation.

The sections that follow describe the design methodology, the system architecture, the design models, the data design, the main algorithms, the traceability to the SRS, and the user interface.

# Design methodology and software process model:

**Design methodology.** Synoras AI follows an object-oriented design (OOP). The system works with clear real-world entities such as users, conversations, memories, projects, documents, agents, and model routers. Each of these maps naturally to a class with its own data and behavior. This makes the design easier to understand, test, and extend. Object-oriented design also fits the chosen technologies: the backend is written in Python and the frontend in TypeScript, and both support classes and modules. The design is described with standard UML diagrams: class, sequence, state, and activity diagrams, together with an entity-relationship diagram for the database.

Software process model. The project follows the Agile model, which was also chosen in the scope document. Work is divided into short sprints, and each sprint builds, tests, and reviews selected modules. Agile suits this project for three reasons. First, parts of the system, such as the confidence-decay rate and the complexity classifier, need experiments and adjustment, so the design must be able to change after testing. Second, the supervisor can review working results at the end of each sprint and give feedback early. Third, the core modules (chat, memory, knowledge base) can be built first, followed by the memory-conflict logic, the multi-agent module, and model routing, so each one gets enough testing before final integration.

# System Overview:

Synoras AI is a web application with a browser frontend, a Python backend, and a set of background and data services. Users chat with an AI assistant that remembers earlier conversations. Each memory has a confidence score that drops over time, and when new information contradicts a stored memory, the system asks the user which version to keep and records the change in a version history. Users can also organize work in project workspaces, upload documents to a knowledge base, and ask questions answered from those documents through GraphRAG, a form of Retrieval-Augmented Generation (RAG) that uses a knowledge graph built from the documents. For complex requests, an orchestrator divides the work among research, planning, reviewing, and response agents. Before each subtask runs, a classifier rates its complexity and a router sends it to a local model, a smaller cloud model, or a stronger cloud model. The system logs the model used, the response time, and the estimated cost of every routed subtask, and users can export summaries and reports as PDF files.

## Architectural Design:

Synoras AI uses a layered, client-server architecture, shown in the diagram below. Each layer has one job and talks only to the layers next to it, which keeps the system easy to test and change.

- **Client layer:** a Next.js web application built with React, TypeScript, and Tailwind CSS. It shows the chat, memory, project, knowledge base, routing log, and admin screens, and it talks to the backend over HTTPS using REST calls and streamed responses (Server-Sent Events carry the answer together with the live knowledge graph events). The chat screen has a knowledge graph panel.
- **Application layer:** a FastAPI backend with eight parts: authentication and authorization, the chat and conversation service, the memory service (extraction, confidence decay, and conflict detection), the project and task service, the knowledge base and GraphRAG service (document indexing, knowledge graph extraction, and graph retrieval), the agent orchestrator (built with LangChain and LangGraph), the complexity classifier and model router, and the routing and execution logger.
- **Background and report services:** a Celery worker runs long jobs such as conversation summaries, the daily confidence updates, document indexing, and knowledge graph extraction, and a Node.js service generates PDF reports.
- **Data layer:** PostgreSQL with pgvector stores users, memories, version histories, projects, logs, embeddings, and the knowledge graph (entities and relationships; there is no separate graph database). Redis acts as a cache and job queue, and uploaded documents are stored on the local disk.
- **Model layer:** a local model run through Ollama for low-complexity subtasks, a smaller cloud model for medium ones, and a stronger cloud model for high-complexity ones.

The orchestrator sends each subtask to the router, and the router chooses the model and writes the result to the log. Because each service has its own responsibility, a model can be replaced or a service improved without changing the rest of the system.

The architecture of Synoras AI is shown in the figure below.

Figure 3.1.1: System Architecture of Synoras AI

## Process flow/Representation:

This section shows the major processes of Synoras AI as activity diagrams. Each diagram follows one process from start to finish, with the decisions and the actions of each actor. Login and registration are not shown, because they follow a standard flow. The first diagram covers how memories are extracted from conversations and how conflicting information is resolved.

### Memory Extraction and Conflict Resolution:

When a conversation ends or has been inactive for 30 minutes, a background job summarizes it and extracts useful information. Each new piece of information is compared with similar stored memories. If it does not contradict anything, it is saved with full confidence. If it does, the update pauses and the user reviews the old and new versions and chooses to keep the old one, use the new one, or keep both. The system then writes a version history entry and resets the confidence score.

Figure 3.2.1: Activity Diagram: Memory Extraction and Conflict Resolution

### Confidence Decay and Re-verification:

A daily background job recalculates the confidence score of every stored memory with the formula confidence = exp(-DECAY_RATE × days since the memory was last confirmed), so a memory that is not confirmed fades a little each day. DECAY_RATE is a setting (initial value 0.01 per day). The score is stored as a number from 0 to 1 and shown to the user as a percentage. The time a memory was last used is stored too, so "lack of use" can be added to the formula later if testing shows it is needed. When a memory is used in a reply and its score is below 50%, the system marks it as needing re-verification and asks the user to confirm or edit it. Confirming or editing resets the score and records a version history entry. If the user ignores the request, the memory stays marked and the system asks again the next time it is used. The process is shown in the figure below.

Figure 3.2.2: Activity Diagram: Confidence Decay and Re-verification

### Multi-Agent Task with Complexity-Aware Routing:

When a user submits a complex request, the planning agent splits it into subtasks. For each subtask, the classifier rates the complexity as low, medium, or high, and the router sends it to the local model, a smaller cloud model, or a stronger cloud model. The reviewer agent checks every result, and a result that fails is run again on the stronger model. Each subtask is logged with its model, response time, and estimated cost. The response agent then combines the results into one answer, as shown in the figure below.

Figure 3.2.3: Activity Diagram: Multi-Agent Task with Complexity-Aware Routing

### Document Upload and Question Answering:

When a user uploads a document, the system first checks the file type and size. A valid file is saved on the local disk, and a background job extracts its text, splits it into chunks, and stores the embeddings in pgvector. The document is then "Indexed" and can already be searched by similarity. A second background job extracts the entities and relationships from each chunk, using the model the complexity router picks for it, and stores them as a knowledge graph; the document list shows its progress. When the user asks a question about the documents, the system uses GraphRAG as a graph of steps: it finds the entities most similar to the question, follows their relationships to related entities, collects the chunks that support them, and the model writes an answer with source references. Each step sends an event to the browser, so the knowledge graph panel can highlight what is being used while the answer is written. If the graph of a document is not ready, its chunks are found by similarity search instead. If no relevant chunk is found, the system replies that no answer was found, as shown in the figure on the next page.

Figure 3.2.4: Activity Diagram: Document Upload and Question Answering

# Design models:

This section presents the design models of Synoras AI. The class diagram shows the main classes and how they are related. The sequence diagrams show how the objects work together over time, and the state transition diagram shows how a memory item changes during its life.

## Class Diagram:

The class diagram below shows the main classes of Synoras AI. A User owns many Memory items and many Projects. Each Project contains many Tasks, Chats, Documents, Project Notes (summaries and decisions), and Reports. Each Document is split into many Document Chunks for search. A Chunk can mention many Graph Entities, and Graph Relations connect pairs of Graph Entities; together they make the knowledge graph of a User or of a Project. Each Chat holds many Messages. A complex Message is divided into Subtasks that are classified, run, and reviewed. The symbols 1 and * show that one object is linked to many objects.

Figure 4.1.1: Class Diagram of Synoras AI

## Sequence Diagrams:

The sequence diagrams below show how the parts of Synoras AI work together over time. Each box at the top is a part of the system, the dashed lines show time going downward, and the arrows show the messages sent between the parts. A dashed arrow is a reply.

### Chat with Memory:

When the user sends a message, the web app passes it to the backend API. The backend loads the user’s saved memories and chat history from the database and sends the request with this context to the AI agents. The agents send a prompt to the AI model and return the answer to the backend. The backend then saves the chat and any new memory in the database and streams the reply back to the web app, which shows it to the user.

Figure 4.2.1: Sequence Diagram: Chat with Memory

### Document Upload and Question Answering:

When the user uploads a document, the web app sends it to the backend API, which queues a background job for the worker. The worker extracts the text, splits it into chunks, saves the vectors in the database, and reports that the document is ready. The worker then runs a second job that extracts entities and relationships from each chunk with the model chosen by the router, and saves them in the database. When the user later asks a question, the backend runs the GraphRAG steps: it searches for the entities closest to the question, follows their relationships, collects the supporting chunks, and sends them with the question to the AI model. The backend streams the model’s answer, together with its sources and an event after each step, to the web app (see Live Graph Events below). The web app shows the answer and highlights the entities and relationships that were used in the knowledge graph panel.

Figure 4.2.2: Sequence Diagram: Document Upload and Question Answering

### Live Graph Events (GraphRAG):

The answer to a question about the documents is sent to the browser as one stream of Server-Sent Events. The stream is started by a POST request, so the login token can be sent in the request header. It carries the retrieval events and the answer text in the order in which they happen. The knowledge graph panel uses the events to highlight entities and relationships, so the user sees what is being used while the answer is written.

Table 4.2.1: Events of the Answer Stream

| **Event** | **Sent when** | **Content** |
|---|---|---|
| retrieval_started | The question has been received | The knowledge base used (personal or a project) and whether its graph is ready |
| entities_found | The entities closest to the question are found | Entity IDs, names, and similarity scores |
| graph_expanded | The relationships have been followed | IDs of the entities and relationships reached, and how many steps away each one is |
| chunks_collected | The supporting chunks are collected | Chunk IDs with the document name and page |
| model_selected | The router has chosen the model | The model name and the complexity level |
| token | The model writes a part of the answer | The next piece of the answer text |
| sources | The answer is complete | The documents and sections used, and how many entities and relationships were used |
| done | The stream ends | Message ID, model used, response time, and estimated cost |
| error | Something fails | A plain message for the user and whether a retry is possible |

## State Transition Diagram:

The state transition diagram below shows the life of a memory item in Synoras AI. A memory starts as Current when it is saved. Its confidence decays over time, and when a memory with confidence below 50% is used in a reply, it moves to Needs Re-verification. If the user confirms or edits it, the memory becomes Current again. If a conflict is found and the user picks the new version, the old memory becomes Past and stays in the version history. The user can also delete a memory, which removes it completely, so no status is kept for a deleted memory.

Figure 4.3.1: State Transition Diagram of a Memory Item

## Data Flow Diagram:

The data flow diagrams show how data moves through Synoras AI. Circles are processes, dark boxes are outside parties, and the open boxes are data stores. The arrows show the data that flows between them.

### Level 0 (Context Diagram):

The context diagram shows Synoras AI as one process. The user sends login details, messages, documents, and requests, and receives the login result, projects, memories, answers, and reports. The admin manages users and receives logs and job status. The system sends prompts to the AI models and receives their responses.

Figure 4.4.1: Data Flow Diagram Level 0 (Context Diagram)

### Level 1:

Level 1 breaks the system into six processes. Manage Access handles login and user records, and gives the admin the logs and job status. Manage Projects saves the user’s projects and tasks and returns the project list. Chat and Route Tasks sends prompts to the AI models, saves chats and subtask logs, shows the routing log on request, and passes new facts to the memory store. Manage Memory updates the saved memories and versions, and lets the user view, edit, and delete them. Manage Documents stores document chunks, vectors, and the knowledge graph (entities and relationships), and answers questions with GraphRAG and the help of the AI models. Generate Reports builds the PDF report from the project content and saves it. A data store with a double line on its left edge, and an outside party marked with a star, appears more than once in the diagram.

Figure 4.4.2: Data Flow Diagram Level 1

# Data Design:

The information in Synoras AI is stored in a PostgreSQL database. Each main item of the system, such as users, projects, tasks, chats, messages, memories, documents, and reports, is kept as a table, and the tables are linked using primary keys and foreign keys. A user owns many projects and many memories, and a memory can also belong to one project. A project holds many tasks, chats, documents, and reports, and each chat holds many messages. A complex message is divided into subtasks, and the model, response time, and estimated cost of each subtask are saved. When a memory is replaced, its old content is saved in a separate version table, so the full history is kept. Conflicts that wait for the user's choice are kept in a conflicts table, the memories used in each reply are kept in a link table, and every agent step and every administrator action is saved in its own log table. Short project notes (summaries and decisions) are kept in a project notes table. The knowledge graph made from the documents is kept in four tables: graph entities, graph relations, and two link tables that connect each entity and each relation to the document chunks it comes from. Every entity and relation has its owner (the user and, for a project, the project), so each knowledge base has its own graph. Every call that extracts entities and relationships is saved in a graph extraction log table.

Uploaded documents are split into chunks. The text of each chunk and its embedding are stored in the document chunks table using the pgvector extension, which allows similarity search. The name and description of each entity also have an embedding, so entities can be found by their similarity to a question. An entity is stored once for each knowledge base (personal or one project): the same name and type is linked to every chunk that mentions it. When a document is deleted, its chunks and chunk links are deleted, and entities and relations that no other chunk supports are deleted with them. The uploaded files themselves are stored on the local disk, and the database keeps only their paths. Redis is used as a temporary store for background jobs and is not part of the permanent data.

## Entity Relationship Diagram:

Figure 5.1.1: Entity Relationship Diagram of Synoras AI

## Data Dictionary:

The table below lists the entities of the system in alphabetical order, with their attributes, types, and descriptions.

Table 5.2.1: Data Dictionary of Synoras AI

| **Entity** | **Attribute** | **Type** | **Description** |
|---|---|---|---|
| **agent_steps** | step_id | INTEGER (PK) | Unique ID of the agent step |
|  | message_id | INTEGER (FK) | Message (request) that the step belongs to |
|  | agent_name | VARCHAR(20) | Planning, Research, Reviewer, or Response |
|  | model_used | VARCHAR(50) | Model that ran the step |
|  | response_time | FLOAT | Time taken by the step, in seconds |
|  | cost | FLOAT | Estimated cost of the step |
|  | status | VARCHAR(20) | Success, Retried, or Failed |
|  | created_at | TIMESTAMP | Date and time the step ran |
| **chats** | chat_id | INTEGER (PK) | Unique ID of the chat |
|  | user_id | INTEGER (FK) | User that owns the chat |
|  | project_id | INTEGER (FK) | Project that the chat belongs to (empty for a chat outside a project) |
|  | title | VARCHAR(150) | Title of the chat |
|  | created_at | TIMESTAMP | Date and time the chat was created |
| **document_chunks** | chunk_id | INTEGER (PK) | Unique ID of the chunk |
|  | document_id | INTEGER (FK) | Document that the chunk comes from |
|  | text | TEXT | Text content of the chunk |
|  | embedding | VECTOR | Embedding of the text, used for similarity search |
|  | page_no | INTEGER | Page number the chunk was taken from |
|  | extracted_at | TIMESTAMP | Date and time entities and relationships were extracted from this chunk (empty until the extraction has run on it; used to show progress and to continue after a stop) |
| **documents** | document_id | INTEGER (PK) | Unique ID of the document |
|  | user_id | INTEGER (FK) | User that owns the document |
|  | project_id | INTEGER (FK) | Project that the document belongs to (empty for the personal knowledge base) |
|  | file_name | VARCHAR(200) | Original name of the uploaded file |
|  | file_path | VARCHAR(255) | Location of the file on local disk |
|  | status | VARCHAR(20) | Processing state: Processing, Indexed, or Failed |
|  | file_type | VARCHAR(10) | PDF, TXT, or MD |
|  | created_at | TIMESTAMP | Date and time the document was uploaded |
|  | graph_status | VARCHAR(20) | Knowledge graph state: Pending, Extracting, Ready, or Failed. It is separate from status: a document can be searched by similarity as soon as its status is Indexed |
| **graph_entities** | entity_id | INTEGER (PK) | Unique ID of the entity |
|  | user_id | INTEGER (FK) | User that owns the entity |
|  | project_id | INTEGER (FK) | Project of the entity (empty for the personal knowledge base) |
|  | name | VARCHAR(200) | Name of the entity as found in the text, for example "Ohm's law" |
|  | entity_type | VARCHAR(50) | Kind of entity, for example Person, Organization, Concept, Place, or Event |
|  | description | TEXT | Short description built from the chunks that mention the entity |
|  | embedding | VECTOR | Embedding of the name and description, used to find the entity by similarity to a question |
|  | created_at | TIMESTAMP | Date and time the entity was first found |
| **graph_entity_chunks** | entity_id | INTEGER (FK) | Entity that is mentioned |
|  | chunk_id | INTEGER (FK) | Chunk that mentions the entity |
| **graph_extraction_log** | log_id | INTEGER (PK) | Unique ID of the log entry |
|  | document_id | INTEGER (FK) | Document the chunk belongs to |
|  | chunk_id | INTEGER (FK) | Chunk that was processed |
|  | user_id | INTEGER (FK) | User that owns the document |
|  | complexity | VARCHAR(10) | Rating given by the classifier: Low, Medium, or High |
|  | model_used | VARCHAR(50) | Model that ran the extraction |
|  | response_time | FLOAT | Time taken by the extraction call, in seconds |
|  | cost | FLOAT | Estimated cost of the call |
|  | status | VARCHAR(20) | Success, Retried, or Failed |
|  | created_at | TIMESTAMP | Date and time of the call |
| **graph_relation_chunks** | relation_id | INTEGER (FK) | Relation that is described |
|  | chunk_id | INTEGER (FK) | Chunk that supports the relation |
| **graph_relations** | relation_id | INTEGER (PK) | Unique ID of the relation |
|  | user_id | INTEGER (FK) | User that owns the relation |
|  | project_id | INTEGER (FK) | Project of the relation (empty for the personal knowledge base) |
|  | source_entity_id | INTEGER (FK) | Entity the relation starts from |
|  | target_entity_id | INTEGER (FK) | Entity the relation points to |
|  | relation_type | VARCHAR(100) | Kind of relation, for example "works for" or "is part of" |
|  | description | TEXT | Short sentence that describes the relation |
|  | created_at | TIMESTAMP | Date and time the relation was first found |
| **memories** | memory_id | INTEGER (PK) | Unique ID of the memory |
|  | user_id | INTEGER (FK) | User that the memory belongs to |
|  | project_id | INTEGER (FK) | Project of a project memory (empty for a personal memory) |
|  | content | TEXT | The remembered fact or preference |
|  | embedding | VECTOR | Embedding of the content, used for similarity search and conflict detection |
|  | confidence | FLOAT | Confidence score from 0 to 1 (shown to the user as a percentage). Calculated as exp(-DECAY_RATE × days since last_confirmed) |
|  | status | VARCHAR(30) | Stored as current, needs_reverification, or past (shown as Current, Needs Re-verification, Past). A deleted memory is removed from the table |
|  | version | INTEGER | Current version number of the memory |
|  | last_confirmed | TIMESTAMP | Date and time the User last confirmed the memory |
|  | last_accessed | TIMESTAMP | Date and time the memory was last used in a reply (starts as the creation time) |
| **memory_conflicts** | conflict_id | INTEGER (PK) | Unique ID of the conflict |
|  | memory_id | INTEGER (FK) | Stored (old) memory that the new statement contradicts |
|  | new_statement | TEXT | The new information that conflicts with the stored memory |
|  | status | VARCHAR(20) | Pending or Resolved |
|  | choice | VARCHAR(20) | Keep old, Use new, or Keep both (empty while pending) |
|  | created_at | TIMESTAMP | Date and time the conflict was detected |
|  | resolved_at | TIMESTAMP | Date and time the User resolved it (empty while pending) |
| **memory_versions** | version_id | INTEGER (PK) | Unique ID of the saved version |
|  | memory_id | INTEGER (FK) | Memory that this version belongs to |
|  | old_content | TEXT | Content of the memory before it was replaced |
|  | changed_at | TIMESTAMP | Date and time the memory was changed |
|  | reason | VARCHAR(30) | Why the old content was saved: edited or conflict_replaced |
| **message_memories** | message_id | INTEGER (FK) | Reply (message) that used the memory |
|  | memory_id | INTEGER (FK) | Memory that was used in the reply |
| **messages** | message_id | INTEGER (PK) | Unique ID of the message |
|  | chat_id | INTEGER (FK) | Chat that the message belongs to |
|  | sender | VARCHAR(20) | Who sent the message: user or assistant |
|  | text | TEXT | Text of the message |
|  | model_used | VARCHAR(50) | Model that wrote the reply (empty for a user message) |
|  | created_at | TIMESTAMP | Date and time the message was sent |
| **project_notes** | note_id | INTEGER (PK) | Unique ID of the note |
|  | project_id | INTEGER (FK) | Project that the note belongs to |
|  | kind | VARCHAR(20) | Summary or Decision |
|  | title | VARCHAR(150) | Title of the note |
|  | content | TEXT | Text of the summary or decision |
|  | created_at | TIMESTAMP | Date and time the note was created |
| **projects** | project_id | INTEGER (PK) | Unique ID of the project |
|  | user_id | INTEGER (FK) | User that owns the project |
|  | title | VARCHAR(150) | Name of the project |
|  | description | TEXT | Short description of the project |
|  | created_at | TIMESTAMP | Date and time the project was created |
| **reports** | report_id | INTEGER (PK) | Unique ID of the report |
|  | user_id | INTEGER (FK) | User that owns the report |
|  | project_id | INTEGER (FK) | Project that the report was made for |
|  | title | VARCHAR(150) | Title of the report |
|  | format | VARCHAR(10) | File format of the report, such as PDF |
|  | created_at | TIMESTAMP | Date and time the report was generated |
| **subtasks** | subtask_id | INTEGER (PK) | Unique ID of the subtask |
|  | message_id | INTEGER (FK) | Message that the subtask came from |
|  | description | TEXT | What the subtask has to do |
|  | complexity | VARCHAR(10) | Rating given by the classifier: Low, Medium, or High |
|  | model_used | VARCHAR(50) | Model that ran the subtask |
|  | response_time | FLOAT | Time taken to run the subtask, in seconds |
|  | cost | FLOAT | Estimated cost of running the subtask |
| **system_log** | log_id | INTEGER (PK) | Unique ID of the log entry |
|  | user_id | INTEGER (FK) | Administrator who did the action (empty for a system error) |
|  | action | VARCHAR(100) | What happened, such as an account change or a failed background job |
|  | details | TEXT | Extra information about the action or error |
|  | created_at | TIMESTAMP | Date and time of the entry |
| **tasks** | task_id | INTEGER (PK) | Unique ID of the task |
|  | project_id | INTEGER (FK) | Project that the task belongs to |
|  | title | VARCHAR(150) | Title of the task |
|  | status | VARCHAR(20) | To Do, In Progress, or Done |
|  | due_date | DATE | Optional due date of the task |
| **users** | user_id | INTEGER (PK) | Unique ID of the user |
|  | name | VARCHAR(100) | Full name of the user |
|  | email | VARCHAR(150) | Email address used to log in |
|  | password_hash | VARCHAR(255) | Encrypted (hashed) password |
|  | role | VARCHAR(20) | Role of the user: User or Administrator |
|  | status | VARCHAR(20) | Account status: Active or Deactivated |
|  | auto_memory | BOOLEAN | Whether automatic memory collection is on (true) or off (false). Default: true |
|  | failed_attempts | INTEGER | Number of failed logins in a row |
|  | locked_until | TIMESTAMP | End of the 15-minute login lock, if any |

# Algorithm & Implementation:

This section summarizes the main algorithms of Synoras AI in pseudocode. Each algorithm matches a method of the classes in Section 4.1 and a process in the diagrams of Sections 3.2 and 4.4.

## User Registration and Login

| FUNCTION register(name, email, password) IF email is already registered THEN RETURN error "Email already used" IF length of password < 8 THEN RETURN error "Password is too short" save user with name, email, hash(password), role = "User", status = "Active" END FUNCTION FUNCTION login(email, password) user = find user in database by email IF user does not exist OR user.status == "Deactivated" THEN RETURN error "Invalid login" END IF IF user.lockedUntil is later than now() THEN RETURN error "Login is locked, try again later" END IF IF hash(password) does not match user.passwordHash THEN user.failedAttempts = user.failedAttempts + 1 IF user.failedAttempts == 5 THEN user.lockedUntil = now() + 15 minutes user.failedAttempts = 0 END IF RETURN error "Invalid login" END IF user.failedAttempts = 0 RETURN access token for user.userId and user.role END FUNCTION |
|---|

## Complexity Classification and Routing:

This algorithm splits a request into subtasks, rates each one, sends it to the matching model, reviews the result, and logs it.

| FUNCTION handleRequest(request, userId, projectId) memories = retrieve the top 5 relevant memories (by embedding similarity) from the user's personal memory and the project memory; record each one in message_memories and set its lastAccessed = now() context = memories + recent conversation subtasks = planningAgent.split(request, context) results = empty list FOR EACH subtask IN subtasks complexity = classifier.rate(subtask)          // Low, Medium, or High IF classifier fails OR rating is uncertain THEN complexity = "High" END IF IF complexity == "Low" THEN model = local model (smaller cloud model if the local model is unavailable) ELSE IF complexity == "Medium" THEN model = smaller cloud model ELSE model = stronger cloud model END IF startTime = now() result = run subtask on model            // retry up to 2 times on failure IF complexity is "Low" or "Medium" AND result fails the quality check THEN model = stronger cloud model result = run subtask on model END IF rounds = 0 WHILE reviewerAgent finds gaps in result AND rounds < 2 result = researchAgent.improve(subtask, gaps) rounds = rounds + 1 END WHILE save subtask, complexity, model, response time, estimated cost in the log; also save one agent_steps row for every agent step with its model, response time, estimated cost, and status add result to results END FOR RETURN responseAgent.combine(results) END FUNCTION |
|---|

## Memory Extraction and Conflict Resolution:

After a conversation ends, new facts are extracted. A fact that contradicts a stored memory is never saved automatically. The user chooses, and the old version stays in the history.

| FUNCTION saveMemories(userId, projectId, conversation) IF user.autoMemory is false THEN RETURN facts = memoryAgent.extractFacts(summary of conversation) FOR EACH fact IN facts old = most similar stored memory of the user (by embedding) IF old does not exist OR fact does not contradict old THEN save fact as a new memory with its embedding, confidence = 1.0 (100%), status = "current", version = 1, lastConfirmed = now(), lastAccessed = now() ELSE create a row in memory_conflicts with memoryId = old.memoryId, newStatement = fact, status = "pending" pause the update                      // nothing is saved or overwritten END IF END FOR END FUNCTION FUNCTION resolveConflict(conflict, choice) IF choice == "keep old" THEN discard the new statement ELSE IF choice == "use new" THEN save old.content in the memory versions table as a past version (reason = "conflict_replaced") old.content = conflict.newStatement old.embedding = embed(old.content) old.version = old.version + 1 ELSE IF choice == "keep both" THEN save conflict.newStatement as a separate memory ELSE                                          // no choice made keep the memory unchanged leave conflict.status = "pending" and ask again in a later conversation RETURN END IF conflict.status = "resolved", conflict.choice = choice, conflict.resolvedAt = now() reset the confidence of the current memory to 1.0 (100%) old.lastConfirmed = now() END FUNCTION |
|---|

## Confidence Decay and Re-verification:

A scheduled job lowers the confidence of every memory as time passes. A memory with confidence below 50% is marked for re-verification.

| FUNCTION decayMemories()                         // runs once a day FOR EACH memory IN all memories memory.confidence = exp(-DECAY_RATE * days since memory.lastConfirmed)          // DECAY_RATE is a setting, initial value 0.01 per day. Calculated from the dates, so running it twice never decays twice END FOR END FUNCTION FUNCTION onMemoryUsed(memory)                    // called when a memory is used in a reply memory.lastAccessed = now() IF memory.confidence < 0.5 THEN memory.status = "needs_reverification" END IF END FUNCTION FUNCTION reverify(memory, userAnswer) IF userAnswer == "confirm" THEN reset memory.confidence to 1.0 (100%) ELSE IF userAnswer == "edit" THEN save memory.content in the memory versions table (reason = "edited") memory.content = edited text memory.embedding = embed(memory.content) memory.version = memory.version + 1 reset memory.confidence to 1.0 (100%) ELSE IF userAnswer == "delete" THEN delete memory RETURN ELSE RETURN                                   // ignored: stays needs_reverification END IF memory.status = "current" memory.lastConfirmed = now() END FUNCTION |
|---|

## Document Processing:

After an upload, a background job extracts the text, splits it into chunks, and stores the embeddings. When the document is Indexed, a second background job builds its knowledge graph (see 6.8).

| FUNCTION uploadDocument(file, userId, projectId) IF file type is not PDF, TXT, or Markdown OR file size > 20 MB THEN RETURN error that states the accepted types and the size limit END IF path = save file on local disk document = create document record with status = "Processing" queue background job processDocument(document) END FUNCTION FUNCTION processDocument(document)               // runs in the background worker text = extract text from the file at document.filePath IF no text can be extracted THEN document.status = "Failed" RETURN END IF chunks = split text into chunks FOR EACH chunk IN chunks vector = embeddingModel.embed(chunk.text) save chunk.text, vector, and page number in the chunks table END FOR document.status = "Indexed" document.graphStatus = "Pending" queue background job extractGraph(document) END FUNCTION |
|---|

## Document Search and Answer:

To answer a question, the system uses GraphRAG. It runs as a LangGraph graph of steps, and after each step it sends an event to the browser (see Table 4.2.1). It finds the entities most similar to the question in the knowledge graphs the user may access, follows their relationships, collects the chunks that support them, and gives those chunks to the model.

| FUNCTION answerQuestion(question, userId, projectId)          // a LangGraph graph of steps; each step sends an event to the browser questionVector = embeddingModel.embed(question)          // step 1: embed the question seeds = closest entities found by vector search in graph_entities, only in the knowledge bases that userId or the project is allowed to access          // step 2: entities found nodes, edges = start at the seeds and follow graph_relations up to 2 steps away, keep at most MAX_NODES entities          // step 3: graph expanded chunks = chunks linked to those entities and relations (through graph_entity_chunks and graph_relation_chunks), ranked by similarity to the question, keep the best MAX_CHUNKS          // step 4: chunks collected FOR EACH document in these knowledge bases whose graphStatus is not "Ready" chunks = chunks + the closest chunks of that document found by vector search in document_chunks END FOR IF chunks is empty THEN RETURN "The documents do not contain an answer" END IF model = router picks the model for the question (see 6.2) answer = model.run(question, chunks, the relationships between the entities)          // step 5: answer, streamed piece by piece RETURN answer with the file name and page of each chunk used, and the IDs of the entities and relationships used END FUNCTION |
|---|

## Report Generation:

This algorithm collects the content of a project and asks the PDF service to build the report.

| FUNCTION generateReport(userId, source, reportType) // reportType: conversation summary, project summary, or AI transparency report data = load the data of userId for the chosen source and reportType IF data is empty THEN RETURN "There is no data to report" validate data file = pdfService.createPdf(reportType, data) IF file could not be created THEN RETURN error with a retry option save report record with title, format = "PDF", and file path RETURN file for download END FUNCTION |
|---|

## Knowledge Graph Extraction:

After a document is Indexed, a background job reads each chunk with a language model and stores the entities and relationships it finds. Every call goes through the complexity classifier and the router, and is logged with its model, response time, and estimated cost.

| FUNCTION extractGraph(document)               // runs in the background worker document.graphStatus = "Extracting" FOR EACH chunk IN document's chunks WHERE chunk.extractedAt is empty complexity = classifier.rate(chunk.text)          // Low, Medium, or High IF classifier fails OR rating is uncertain THEN complexity = "High" END IF model = router picks the model for the complexity     // same rules as 6.2: the cheapest tier first, a smaller cloud model if the local model is unavailable startTime = now() result = graphTransformer.extract(chunk.text, model)     // entities and relationships; retry up to 2 times on failure IF complexity is "Low" or "Medium" AND result fails the quality check THEN model = stronger cloud model result = graphTransformer.extract(chunk.text, model) END IF IF result still failed THEN save the failure in the log and continue with the next chunk END IF FOR EACH entity IN result.entities e = find the entity with the same name and type in the same knowledge base (userId, projectId) IF e does not exist THEN create it with embedding = embeddingModel.embed(name + description) END IF link e to chunk END FOR FOR EACH relation IN result.relations find or create the relation between its two entities, and link it to chunk END FOR chunk.extractedAt = now() save chunk, complexity, model, response time, and estimated cost in graph_extraction_log END FOR IF every chunk has an extractedAt THEN document.graphStatus = "Ready" ELSE document.graphStatus = "Failed" with the reason END IF END FUNCTION |
|---|

# Software Requirements Traceability Matrix:

The table below shows how each requirement of the SRS is met by this design document. For each requirement it lists the design elements that meet it and the sections where they are described. One requirement can be met by several design elements, and one design element can meet several requirements.

## Traceability Matrix:

Rows marked with ◆ were changed by the GraphRAG change (see decisions A19 and spec-changes.md). FR-27 and FR-28 are new.

Table 7.1.1: Requirements Traceability Matrix

| **Req. Number** | **Ref. Item** | **Design Component** | **Component Items** |
|---|---|---|---|
| **FR-1** | Class Diagram | User | register() |
|  | ER Diagram | users | user_id, name, email, password_hash |
|  | Algorithm | 6.1 User Registration and Login | register() |
| **FR-2** | Class Diagram | User | login(), logout() |
|  | ER Diagram | users | status, failed_attempts, locked_until |
|  | Algorithm | 6.1 User Registration and Login | login() |
| **FR-3 ◆** | Class Diagram | Chat, Message | sendMessage(), save() |
|  | Sequence Diagram | Chat with Memory | Send message, Stream reply |
|  | Algorithm | 6.2 Complexity Classification and Routing | handleRequest() |
|  | Sequence Diagram | Live Graph Events (GraphRAG) | Answer stream events (Table 4.2.1) |
| **FR-4** | Class Diagram | Chat, Message | startChat() |
|  | ER Diagram | chats, messages | chat_id, user_id, title, sender, text |
|  | DFD Level 1 | 3.0 Chat and Route Tasks | D2 Projects, Tasks, Chats, Messages |
| **FR-5** | Activity Diagram | Memory Extraction and Conflict Resolution | Summarize the conversation, Extract candidate memories |
|  | Class Diagram | Memory | save() |
|  | ER Diagram | users, memories | auto_memory; embedding, last_accessed |
|  | Algorithm | 6.3 Memory Extraction and Conflict Resolution | saveMemories() |
| **FR-6** | Sequence Diagram | Chat with Memory | Load memories |
|  | ER Diagram | memories, message_memories | content, embedding, confidence, last_accessed, project_id; message_id, memory_id |
|  | Algorithm | 6.2 Complexity Classification and Routing | handleRequest() (memory retrieval) |
| **FR-7** | Class Diagram | Memory | confirm() |
|  | State Transition Diagram | Memory Item | Current, Needs Re-verification (a deleted memory is removed) |
|  | ER Diagram | users, memories, memory_versions | auto_memory; status, last_confirmed; old_content, reason |
|  | DFD Level 1 | 4.0 Manage Memory | D3 Memories, Versions |
| **FR-8** | Activity Diagram | Confidence Decay and Re-verification | Daily job, Score below 50% |
|  | Class Diagram | Memory | decay() |
|  | ER Diagram | memories | confidence, last_confirmed, last_accessed, status |
|  | State Transition Diagram | Memory Item | Needs Re-verification |
|  | Algorithm | 6.4 Confidence Decay and Re-verification | decayMemories(), onMemoryUsed() |
| **FR-9** | Activity Diagram | Memory Extraction and Conflict Resolution | Compare with similar stored memories |
|  | ER Diagram | memory_conflicts | memory_id, new_statement, status |
|  | Algorithm | 6.3 Memory Extraction and Conflict Resolution | saveMemories() |
| **FR-10** | Class Diagram | Memory | resolveConflict() |
|  | ER Diagram | memory_conflicts, memory_versions | status, choice, resolved_at; version_id, memory_id, old_content, changed_at, reason |
|  | State Transition Diagram | Memory Item | Past |
|  | Algorithm | 6.3 Memory Extraction and Conflict Resolution | resolveConflict() |
| **FR-11** | Class Diagram | Project | create(), update(), delete() |
|  | ER Diagram | projects, project_notes | project_id, user_id, title; note_id, kind, content |
|  | DFD Level 1 | 2.0 Manage Projects | D2 Projects, Tasks, Chats, Messages |
| **FR-12** | Class Diagram | Task | addTask(), moveTask(), delete() |
|  | ER Diagram | tasks | task_id, project_id, title, status, due_date |
|  | DFD Level 1 | 2.0 Manage Projects | Project details, Project list |
| **FR-13** | Class Diagram | Project, Chat | Project holds many Chats |
|  | ER Diagram | chats, memories | project_id |
|  | Algorithm | 6.2 Complexity Classification and Routing | handleRequest() (project memory) |
| **FR-14** | Activity Diagram | Document Upload and Question Answering | Validate file type and size |
|  | Class Diagram | Document | upload() |
|  | Algorithm | 6.5 Document Processing | uploadDocument() |
| **FR-15 ◆** | Sequence Diagram | Document Upload and Question Answering | Queue job, Save vectors, Second job (graph) |
|  | Class Diagram | DocumentChunk | store() |
|  | ER Diagram | document_chunks, documents | text, embedding, page_no, extracted_at; graph_status |
|  | Algorithm | 6.5 Document Processing | processDocument() (queues extractGraph()) |
| **FR-16 ◆** | Class Diagram | Document | delete(), process() |
|  | ER Diagram | documents, graph_entities, graph_relations, graph_entity_chunks, graph_relation_chunks | user_id, file_type, status, graph_status, file_path, created_at (graph entries that no other document supports are removed with the document) |
|  | DFD Level 1 | 5.0 Manage Documents | D4 Documents, Chunks, Knowledge graph |
| **FR-17 ◆** | Activity Diagram | Document Upload and Question Answering | Find entities, expand the graph, collect chunks, answer |
|  | Sequence Diagram | Document Upload and Question Answering | Find entities, expand, collect chunks, Answer, sources |
|  | Class Diagram | Document, GraphEntity | search(), expand() |
|  | ER Diagram | graph_entities, graph_relations, graph_entity_chunks, graph_relation_chunks | embedding; source_entity_id, target_entity_id; entity_id, relation_id, chunk_id |
|  | Algorithm | 6.6 Document Search and Answer | answerQuestion() |
| **FR-18 ◆** | Activity Diagram | Multi-Agent Task with Complexity-Aware Routing | Planning agent, Reviewer agent, Response agent |
|  | Class Diagram | Subtask | run(), review() |
|  | Algorithm | 6.2 Complexity Classification and Routing | handleRequest() |
|  | Algorithm | 6.6 Document Search and Answer | answerQuestion() (the research agent uses the GraphRAG retrieval) |
| **FR-19** | Activity Diagram | Multi-Agent Task with Complexity-Aware Routing | Rerun on the stronger model |
|  | Algorithm | 6.2 Complexity Classification and Routing | retry up to 2 times |
| **FR-20** | Class Diagram | Subtask | classify() |
|  | Activity Diagram | Multi-Agent Task with Complexity-Aware Routing | Classifier rates the complexity |
|  | Algorithm | 6.2 Complexity Classification and Routing | handleRequest() |
| **FR-21** | Architecture Diagram | AI Orchestration and Model Router | Local, smaller cloud, and stronger cloud models |
|  | Activity Diagram | Multi-Agent Task with Complexity-Aware Routing | Low, Medium, High decision |
|  | Algorithm | 6.2 Complexity Classification and Routing | handleRequest() |
| **FR-22 ◆** | Class Diagram | Subtask | modelUsed, cost |
|  | ER Diagram | subtasks, agent_steps, graph_extraction_log | model_used, response_time, cost; agent_name, status; complexity, model_used, response_time, cost, status |
|  | DFD Level 1 | 3.0 Chat and Route Tasks | D6 Subtask Logs |
|  | Algorithm | 6.2 Complexity Classification and Routing | log of each subtask |
|  | Algorithm | 6.8 Knowledge Graph Extraction | log of each extraction call |
| **FR-23** | ER Diagram | subtasks | complexity, model_used, cost |
|  | DFD Level 1 | 3.0 Chat and Route Tasks | Log request, Routing log |
|  | Screen Image | 8.1.5 Agent Pipeline and Routing Log Screen | Routing log table, Session summary |
| **FR-24** | Class Diagram | Report | generate(), download() |
|  | ER Diagram | reports | report_id, user_id, project_id, title, format |
|  | DFD Level 1 | 6.0 Generate Reports | D5 Reports |
|  | Algorithm | 6.7 Report Generation | generateReport() |
| **FR-25 ◆** | ER Diagram | users, system_log | status; action, created_at |
|  | DFD Level 1 | 1.0 Manage Access | User management |
| **FR-26** | ER Diagram | system_log | action, details, created_at |
|  | DFD Level 1 | 1.0 Manage Access | Logs, job status |
| **FR-27 ◆** | Activity Diagram | Document Upload and Question Answering | Extract entities and relationships (second background job) |
|  | Sequence Diagram | Document Upload and Question Answering | Second job: extract, save graph |
|  | Class Diagram | GraphEntity, GraphRelation | extract(), link() |
|  | ER Diagram | graph_entities, graph_relations, graph_entity_chunks, graph_relation_chunks, graph_extraction_log; documents, document_chunks | name, entity_type, embedding; source_entity_id, target_entity_id, relation_type; model_used, response_time, cost; graph_status, extracted_at |
|  | Algorithm | 6.8 Knowledge Graph Extraction | extractGraph() |
| **FR-28 ◆** | Sequence Diagram | Live Graph Events (GraphRAG) | Answer stream events (Table 4.2.1) |
|  | Screen Image | 8.1.2 Chat Screen with Memory Panel and Knowledge Graph Panel | Knowledge graph tab |
|  | Screen Objects | 8.2.2 Objects and Actions of the Chat Screen | Knowledge graph tab rows |
|  | Algorithm | 6.6 Document Search and Answer | An event after each step |
| **USE-1 to USE-7** | Screen Image | 8.1 Screen Images | All six screens |
|  | Screen Objects | 8.2 Screen Objects and Actions | All six tables |
| **USE-8 ◆** | Screen Objects | 8.2.2 Objects and Actions of the Chat Screen | Knowledge graph tab: legend and limit |
| **PER-1, PER-9** | Architecture Diagram | Application Tier and Background Tier | Docker, Redis, Celery |
| **PER-2** | Sequence Diagram | Chat with Memory | Stream reply |
| **PER-3 ◆** | ER Diagram | memories, document_chunks, graph_entities | pgvector similarity search |
| **PER-4, PER-11** | Activity Diagram | Memory Extraction and Conflict Resolution | Compare with similar stored memories |
|  | Algorithm | 6.3 Memory Extraction and Conflict Resolution | saveMemories() |
| **PER-5, PER-10** | Activity Diagram | Multi-Agent Task with Complexity-Aware Routing | Classifier and router |
|  | Algorithm | 6.2 Complexity Classification and Routing | handleRequest() |
| **PER-6** | Activity Diagram | Confidence Decay and Re-verification | Daily scheduled job |
|  | Algorithm | 6.4 Confidence Decay and Re-verification | decayMemories() |
| **PER-7 ◆** | Activity Diagram | Document Upload and Question Answering | Background job (indexing only; the graph job has no fixed limit) |
|  | Algorithm | 6.5 Document Processing | processDocument() |
| **PER-8** | Architecture Diagram | Background Tier | Node.js PDF service |
|  | Algorithm | 6.7 Report Generation | generateReport() |
| **PER-12 ◆** | Algorithm | 6.6 Document Search and Answer | Steps 2 to 4 (entities, expansion, chunks) |
| **PER-13 ◆** | Sequence Diagram | Live Graph Events (GraphRAG) | An event after each step |

# Human Interface Design:

This section describes Synoras AI from the user’s point of view. The user works in a web browser, and all screens share one top navigation bar with the logo, links to Chat, Projects, Memories, Knowledge Base, and Reports, and a user menu. Through these screens the user logs in, chats with the AI, manages memories and projects, uploads documents and asks questions about them, views the routing log, and downloads reports. Every action that deletes data asks the user to confirm, and error messages appear next to the field or action that caused them.

## Screen Images:

The screens below show the main parts of the interface. They are mockups, so the final design may differ in colors, spacing, and wording.

### Register / Log In Screen:

The user enters an email and password and clicks Log In. A button opens the registration form. A reset-password link is an optional feature for later and is not part of version 1.0, because it needs an email service.

Figure 8.1.1: Register / Log In Screen

### Chat Screen:

The chat screen has a list of conversations on the left, the conversation with a message box in the center, and a side panel on the right with two tabs, Memories and Knowledge graph. The Memories tab shows each memory with its confidence bar and status. The Knowledge graph tab shows the knowledge graph of the selected knowledge base (the user's personal one, or the project's): entities are circles colored by type, and relationships are lines between them. While an answer from the knowledge base is being written, the entities and relationships the system is using are highlighted step by step: first the entities found for the question, then those reached by following relationships. Under each reply, the screen shows how many memories were used and which model answered; for an answer from the knowledge base it also shows the sources and how many entities and relationships were used. When a reply relies on a memory that needs re-verification, buttons let the user confirm or update it.

Figure 8.1.2: Chat Screen with Memory Panel and Knowledge Graph Panel

### Memory Conflict Screen:

When new information conflicts with a stored memory, the screen shows the stored memory and the new statement side by side. The user chooses Keep old, Use new, or Keep both, and a timeline shows the earlier versions of the memory.

Figure 8.1.3: Memory Conflict Resolution Screen

### Project Workspace and Knowledge Base Screen:

The project screen has a list of projects on the left and a task board with the columns To Do, In Progress, and Done. Below it, the knowledge base area shows the uploaded documents with their status and knowledge graph status (for example "Graph: Extracting, 12 of 40 sections"), an upload button, a button to open the knowledge graph panel, and a box to ask a question about the documents. Answers show the source of the information and how many entities and relationships were used, and the knowledge graph panel highlights them.

Figure 8.1.4: Project Workspace with Task Board and Knowledge Base

### Agent Pipeline and Routing Log Screen:

For multi-agent tasks, the screen shows the four agents in order (planning, research, reviewer, and response) with the model each one used. Below it, a routing log table shows the time, subtask, complexity, model used, and cost and time of each subtask, with a summary of the total cost, average time, and estimated saving.

Figure 8.1.5: Multi-Agent Pipeline and Routing Log Screen

### Reports Screen:

The user chooses a report type, previews it, and downloads it as a PDF. The AI transparency report lists the memories used with their scores, the conflicts resolved, the model routing summary, and the agents involved.

Figure 8.1.6: Reports Screen (AI Transparency Report)

## Screen Objects and Actions:

The tables below list the objects on each screen, the action the user can take on each object, and the feedback the system shows.

### Register / Log In Screen:

This screen lets a user log in or create an account. The table lists its fields and buttons, and what happens when the user uses them.

Table 8.2.1: Objects and Actions of the Register / Log In Screen

| **Screen object** | **Action** | **Feedback shown to the user** |
|---|---|---|
| Email field | Type the email address | An error appears next to the field if the email is invalid or not registered |
| Password field | Type the password | An error appears if the password is wrong. After 5 failed attempts in a row, a message says login is locked for 15 minutes |
| Log In button | Click to log in | The Chat screen opens |
| Reset password link (optional, later feature) | Not available in version 1.0 | Planned for later, when an email service exists |
| Create an account button | Click to register | The registration form opens (name, email, password of at least 8 characters) |

### Chat Screen:

This screen is where the user talks to the AI. The table lists the conversation list, message box, reply details, and the side panel (memories and knowledge graph), and what the user sees when using them.

Table 8.2.2: Objects and Actions of the Chat Screen

| **Screen object** | **Action** | **Feedback shown to the user** |
|---|---|---|
| Conversation list (left) | Click a conversation to reopen it, start a new one, search by keyword, or delete one | The selected conversation opens in the center. A deleted conversation asks for confirmation first |
| Message box and Send button | Type a message and click Send | The reply appears word by word as it is generated. An empty message is not sent. If the model is unavailable, the message is kept and a retry is offered |
| Reply details (under each reply) | Read the details | Shows how many memories were used and which model answered |
| Side panel tabs (right) | Switch between Memories and Knowledge graph | The chosen tab is shown |
| Memories tab | View the memories with their confidence bar and status | Updates after each conversation |
| Still correct and Update it buttons | Click when a reply used a memory that needs re-verification | Still correct resets the confidence. Update it lets the user edit the memory |
| Knowledge source selector (next to the message box) | Choose what to ask: no knowledge base, the personal knowledge base, or a project's | The Knowledge graph tab shows the graph of the chosen knowledge base. With none chosen, the question is answered from memories and the conversation only |
| Knowledge graph tab: graph view | View the graph, zoom, drag, and select an entity | Entities are circles colored by type and relationships are lines. Selecting an entity shows its type, description, and the documents it comes from |
| Knowledge graph tab: live highlight | Watch while an answer is being written | The entities found for the question light up first, then the entities and relationships reached by following the graph. The highlight stays until the next question |
| Knowledge graph tab: legend and limit | Read the legend of entity types | At most 150 entities are shown by default (the most connected ones and those used in the answer). A message says when more exist |
| Knowledge graph tab: empty or not ready | Open the tab for a knowledge base without a ready graph | A message says that the graph is empty or still being built, with its progress, and that sections of documents without a ready graph are found by similarity search |
| Source references (under a reply from the knowledge base) | Read the documents and sections used | Shows each document name and page, and how many entities and relationships were used |

### Memory Conflict Screen:

This screen appears when new information conflicts with a stored memory. The table lists the memory cards, the three choice buttons, and the timeline.

Table 8.2.3: Objects and Actions of the Memory Conflict Screen

| **Screen object** | **Action** | **Feedback shown to the user** |
|---|---|---|
| Stored memory card | Read the stored memory | Shows its text, confidence, and the date it was saved |
| New statement card | Read the new statement | Shows the new text and where it was detected |
| Keep old, Use new, and Keep both buttons | Click one button to resolve the conflict | The choice is applied and the change appears in the timeline. If the user chooses nothing, the memory stays unchanged and the question is asked again in a later conversation |
| Memory timeline | View the earlier versions of the memory | Shows each version with its date |

### Project Workspace and Knowledge Base Screen:

This screen lets the user manage projects, tasks, and documents. The table lists the project list, task board, upload button, document list, graph button, and question box, and the feedback for each.

Table 8.2.4: Objects and Actions of the Project Workspace and Knowledge Base Screen

| **Screen object** | **Action** | **Feedback shown to the user** |
|---|---|---|
| Project list and New project button | Select a project, create, rename, or delete one | An empty or duplicate name is rejected. Deleting a project asks for confirmation |
| Task board (To Do, In Progress, Done) | Add a task, move it between columns, edit it, or delete it | A task without a title is rejected. The task appears in the chosen column |
| Upload file button | Choose a PDF, TXT, or Markdown file of up to 20 MB | The file appears with the status Processing, then Indexed. After that, its graph status goes from Pending to Extracting (with the progress, for example 12 of 40 sections) to Ready. If indexing fails, the status is Failed and the reason is shown; if the graph extraction fails, the graph status is Failed with the reason and a retry is offered. Other file types and large files are rejected with a message |
| Document list | View the status and graph status, delete a document, re-index it, or retry its graph | Deleting asks for confirmation and also removes the document's embeddings and the graph entries that no other document supports. Re-indexing also rebuilds the graph entries |
| Question box and Ask button | Type a question about the documents and click Ask | The answer appears with the source document and section and how many entities and relationships were used, and the knowledge graph panel highlights them. If nothing relevant is found, a message says the documents do not contain an answer |
| Show knowledge graph button | Click to open the knowledge graph panel of this project | The panel opens beside the knowledge base area and shows the project's graph, as in the chat screen |

### Agent Pipeline and Routing Log Screen:

This screen shows how a multi-agent task was carried out. The table lists the agent pipeline, the routing log, and the session summary.

Table 8.2.5: Objects and Actions of the Agent Pipeline and Routing Log Screen

| **Screen object** | **Action** | **Feedback shown to the user** |
|---|---|---|
| Agent pipeline (four agents) | View the planning, research, reviewer, and response agents | Shows the model each agent used |
| Routing log table | View the log and filter it by date, complexity, or model | Shows the time, subtask, complexity, model used, and cost and time of each subtask. A message is shown when there are no entries |
| Session summary | View the summary | Shows the total cost, the average response time, and the estimated saving, labeled as an estimate |

### Reports Screen:

This screen lets the user create and download reports. The table lists the report type box, the preview, and the download button, and what happens when each is used.

Table 8.2.6: Objects and Actions of the Reports Screen

| **Screen object** | **Action** | **Feedback shown to the user** |
|---|---|---|
| Report type box | Choose conversation summary, project summary, or AI transparency report | The chosen type is shown |
| Preview button | Click to preview the report | The preview shows the memories used with their scores, the conflicts resolved, the model routing summary, and the agents involved |
| Download PDF button | Click to download the report | The PDF file is downloaded. If there is no data or generation fails, a message is shown with a retry option |

# Appendix I:

This appendix lists the guides followed while preparing the diagrams of this document, the tools used to draw them, and the abbreviations used.

## Design Guides:

- How to design using UML (OOP): http://agilemodeling.com/artifacts/
- How and when to design ER diagrams: http://people.inf.elte.hu/nikovits/DB2/Ullman_The_Complete_Book.pdf

## Tools Used:

- draw.io (app.diagrams.net): architecture, activity, class, sequence, state transition, data flow, and ER diagrams
- Microsoft Word: preparing this document
- EndNote: managing the references

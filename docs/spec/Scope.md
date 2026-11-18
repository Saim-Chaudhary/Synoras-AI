# COMSATS University Islamabad,

# Sahiwal Campus

# Project Proposal

**(SCOPE DOCUMENT)**

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

**SCOPE DOCUMENT REVISION HISTORY**

| **No.** | **Comment** | **Action** |
|---|---|---|
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |
|  |  |  |

**Supervisor Signature Date:**

# List of Tables

**Table 4.1: Related System Analysis with Proposed Solution 3**

**Table 10.1: Tools & Technologies for Proposed Solution 8**

**Table 11.1: Stakeholders and Roles 9**

**Table 12.1: Team Members & Task Division 10**

# Table of Figures

**Figure 15.1: Gantt Chart of Synoras AI 13**

**Figure 16.1: Register / Log In Screen of Synoras AI 14**

**Figure 16.2: Chat Screen of Synoras AI 15**

**Figure 16.3: Memory Conflict Screen of Synoras AI 16**

**Figure 16.4: Project Workspace and Knowledge Base Screen of Synoras AI 17**

**Figure 16.5: Agent Pipeline and Routing Log Screen of Synoras AI 18**

**Figure 16.6: Reports Screen of Synoras AI 19**

**Project Category: (**Select all the major domains of proposed project**)**

**A-**Desktop Application/Information System**C-** Problem Solving and Artificial Intelligence**B-**Web Application/Web Application based Information System**D-**Simulation and Modeling**E-** Smartphone Application**F-**Smartphone Game **G-** Networks **H-** Image Processing Other (specify category)  **A-**Desktop Application/Information System**C-** Problem Solving and Artificial Intelligence**B-**Web Application/Web Application based Information System**D-**Simulation and Modeling**E-** Smartphone Application**F-**Smartphone Game **G-** Networks **H-** Image Processing Other (specify category)

# Abstract:

Synoras AI is a web-based AI platform for conversational assistance, persistent memory, knowledge retrieval, and multi-agent collaboration. Most AI chat tools forget everything once a conversation ends. Synoras AI instead summarizes finished conversations, pulls out anything useful, and stores it as memory for later. Each memory gets a confidence score that fades over time, and if new information contradicts something already stored, the system flags it and asks the user which version to keep rather than quietly overwriting the old one. Users also get a single workspace for setting up projects, plus a knowledge base for uploading documents and querying them through GraphRAG, a form of Retrieval-Augmented Generation (RAG) that also builds a knowledge graph of the entities and relationships found in the documents.

Complex requests get split across specialized agents: research, planning, reviewing, and final response generation. Before handing off a subtask, the orchestrator judges how hard it is and routes easy tasks to a smaller or local model, saving the stronger cloud models for the ones that actually need them. That keeps cost and latency down without touching accuracy where it matters. The platform also includes a PDF report feature (via a Node.js library) for turning summaries and progress data into downloadable documents. It runs on Next.js, FastAPI, LangChain, LangGraph, PostgreSQL with pgvector, and Redis. At its center, Synoras AI is meant to be practical and modular: memory that stays accurate, agents that don't waste resources, and a user who's never left guessing what the system did with their data

# Introduction:

Artificial Intelligence has become an important technology for improving productivity, learning, communication, and problem-solving. AI assistants are commonly used to answer questions, generate content, summarize information, and support users in different tasks. However, many traditional AI systems have limited memory and do not maintain useful context across conversations, so users often repeat their goals, project details, and preferences every time they start a new session. Synoras AI is proposed as an intelligent web-based platform that combines conversational AI, persistent memory, project management, and knowledge retrieval in one system.

The platform will allow users to communicate with AI, store important information, and retrieve relevant memories during future interactions. Each stored memory will carry a confidence score that decreases over time, and when new information conflicts with something already stored, the system will flag the conflict and ask the user which version to keep instead of overwriting it silently. The platform will also provide project workspaces where users can organize project-related conversations, tasks, summaries, and decisions, along with a knowledge base that lets users upload documents and receive responses based on their content through GraphRAG, a Retrieval-Augmented Generation (RAG) approach that also uses a knowledge graph built from the documents. The system will use specialized AI agents for research, planning, reviewing, and response generation, with an orchestrator that routes each subtask to a smaller or stronger model depending on how complex the task is, keeping cost and response time down. A PDF report generation feature will round out the platform, allowing users to turn conversation summaries and project information into downloadable documents. The main purpose of Synoras AI is to develop a modular, user-controlled AI platform that improves memory reliability, resource efficiency, and knowledge retrieval while applying current AI techniques in a practical software project.

# Problem Statement:

AI has created real opportunities for learning, productivity, research, and project management. But most existing AI assistants are built to answer one question at a time, not to hold context over the long run. Users end up repeating their preferences, goals, and project details in every new conversation, which quietly erodes how personalized the assistance feels. Meanwhile, conversations, tasks, and documents usually live in separate apps, and switching between them makes it harder to keep anything organized.

Getting accurate answers from your own documents is its own problem. A few systems handle document-based Q&A reasonably well, but almost none combine that with persistent memory, project organization, and multiple collaborating agents in one platform. Single-agent setups tend to fall apart once a task needs planning, research, verification, and a final response all at once.

Two issues sit underneath all of this. First, most systems either overwrite old memories silently or let outdated facts sit there forever, so users get answers built on information that's no longer accurate [1], [2], [3]. Second, multi-agent systems usually send every subtask to the same large model regardless of how simple it is, which burns cost and time on work that didn't need it [4], [5], [6].

Synoras AI is proposed to close these gaps. It's a modular, web-based platform where memory stays accurate over time, projects and tasks live in one connected workspace, and each subtask goes to a model sized for how hard it actually is. The project will also build out PDF report generation to support real academic and productivity work.

# Problem Solution for Proposed System:

Synoras AI will provide an integrated web-based platform that combines conversational AI, persistent memory, knowledge retrieval, and intelligent task assistance. It keeps context useful by summarizing conversations and pulling out important details for later use. Users stay in control of their memories and can view, edit, or delete them whenever they want. Each memory also carries a confidence score that fades over time, and if a new statement contradicts something already stored, the system flags the conflict and asks the user which version to keep instead of silently overwriting it, keeping a version history so users can see how a piece of information changed [7], [8]. Separate project workspaces help organize project-related conversations, tasks, decisions, and summaries.

To improve document-based question answering, the platform includes a knowledge base that handles document uploading, text processing, embedding generation, vector-based retrieval, and the extraction of entities and relationships into a knowledge graph. It uses GraphRAG, a form of RAG that finds the entities related to a question, follows their relationships, and collects the supporting text, to generate responses grounded in the uploaded documents, and it shows the graph live while an answer is written. A multi-agent architecture divides complex tasks among specialized agents for research, planning, reviewing, and final response generation, coordinated by an orchestrator. Before assigning a subtask, the orchestrator rates its complexity as low, medium, or high. Low subtasks go to a local model, medium subtasks to a smaller cloud model, and high subtasks to a stronger cloud model, which keeps cost and response time down without hurting accuracy [4], [5], [6].

Synoras AI also includes a PDF report generation feature, converting structured information into downloadable reports through a Node.js library. The frontend is built with Next.js, and the backend uses Python and FastAPI, with LangChain and LangGraph managing the agent workflows. PostgreSQL and pgvector handle structured data storage, vector retrieval, and the knowledge graph tables, and Redis supports background tasks. The system is built in modular stages so each feature can be tested on its own before integration. Altogether, these features aim to make Synoras AI a connected, practical, user-controlled platform for memory reliability, knowledge management, and efficient task assistance.

# Related System Analysis/Literature Review:

The following systems were reviewed to understand existing approaches to AI assistance, project organization, and knowledge retrieval. Their documented features provide a basis for identifying the intended focus of Synoras AI.

Table 4.1: Related System Analysis with Proposed Solution

| **Application Name** | **Weakness** | **Proposed Project Solution** |
|---|---|---|
| ChatGPT | Persistent memory exists but is a flat, manually-editable list; it does not detect when new information conflicts with an older memory. | A confidence-decay memory model that automatically detects conflicting information and asks the user to confirm which version is current. |
| Notion AI | Combines AI with workspace features but has no multi-agent architecture; every request is processed the same way regardless of complexity. | LangChain and LangGraph-based multi-agent orchestration with a complexity-aware router that assigns subtasks to a local or cloud model based on difficulty. |
| Perplexity Spaces | Strong at research and information discovery, but has no persistent memory across sessions and no project-level task coordination. | Combine knowledge retrieval with project memory and multi-agent task coordination in one workspace. |
| Claude | Supports memory and tool use, but memory updates are not transparent, and there is no visible mechanism for resolving contradictions or optimizing which model handles a subtask. | Transparent memory-conflict resolution and complexity-based model routing across multiple providers. |
| Mem0 | A widely-used dedicated memory layer, but it is infrastructure for developers to integrate, not a full assistant; it stores and retrieves memories without asking the user to resolve contradictions. | Build user-facing conflict resolution directly into the product, so contradictions are surfaced and confirmed rather than silently stored or requiring developer-side handling. |
| Letta | A strong platform for building stateful, self-improving agents, but its focus is agent memory infrastructure, not integrated project management, learning workflows, or model-cost optimization. | Combine agent memory with project workspaces, knowledge retrieval, and a complexity-aware router that also optimizes for cost and latency, not just persistence. |

# Advantages/Benefits of Proposed System:

- **Personalized AI Assistance:** Synoras AI will use persistent memory to retain relevant user information and provide more contextual responses in future conversations.
- **Reliable Memory Management:** A confidence-decay and conflict-detection mechanism will prevent the system from silently keeping outdated or contradictory information, giving users visibility into how and when their stored data changed.
- **Centralized Project Organization:** Users will be able to manage project conversations, tasks, decisions, and summaries in dedicated workspaces instead of relying on multiple separate tools.
- **Improved Knowledge Retrieval:** The knowledge base and GraphRAG module will help users find relevant information from their uploaded documents, including information that is spread over several documents and connected through entities and relationships, and receive responses supported by retrieved sources. A live knowledge graph shows users what the system looked at to answer.
- **Complex Task Assistance:** Multi-agent collaboration will allow specialized agents to divide tasks such as research, planning, reviewing, and response generation.
- **Efficient Resource Usage:** A complexity-based routing mechanism will assign each subtask to an appropriately sized model, reducing cost and latency for simple tasks while keeping stronger models available for complex ones.
- **Structured Report Generation:** The PDF generation feature will allow users to create downloadable project summaries, conversation summaries, and research documents in a structured format.

# Scope:

The scope of Synoras AI is to develop a web-based AI platform that combines conversational assistance, persistent memory, knowledge retrieval, and multi-agent collaboration. Users will chat with the AI, manage their conversation history, and work in project workspaces that organize conversations, tasks, summaries, and decisions. The system will summarize conversations and store useful information as long-term memory. Users can view, edit, and delete their memories. Each memory has a confidence score that decreases over time, and conflicting updates are confirmed with the user before they are applied. A knowledge base accepts PDF, TXT, and Markdown documents, builds a knowledge graph from them, and GraphRAG (Retrieval-Augmented Generation that uses the graph) answers questions from them while a side panel shows the graph being used.

Specialized agents for planning, research, reviewing, and response generation work together under an orchestrator. Before running a subtask, the orchestrator rates its complexity as low, medium, or high and sends it to a local model, a smaller cloud model, or a stronger cloud model. This keeps cost and response time down without lowering accuracy on harder tasks. The platform also generates PDF reports and shows a log of routing decisions with the model used, response time, and estimated cost. Users have secure accounts, and an administrator manages users and monitors the system without access to private data. The system is built with Next.js, FastAPI, LangChain and LangGraph, PostgreSQL with pgvector (which also stores the knowledge graph), Redis, and a Node.js PDF service.

# Modules:

## AI Chat and Conversation Management:

This module will provide the main conversational interface of Synoras AI. Users will be able to create new conversations and continue previous discussions. The system will support streaming AI responses to improve the interaction experience. Conversation history will be stored and organized for future access. Users will be able to search and manage their conversations. The module will connect with the memory, knowledge retrieval, and multi-agent modules when required. Its main purpose is to provide a central interface for users to interact with the AI platform.

## Persistent Memory Management:

This module will manage the long-term memory of Synoras AI. The system will summarize completed or inactive conversations and extract useful information from them. Relevant information will be stored in a structured memory system for future retrieval. The module will retrieve appropriate memories when the user starts a new conversation. Users will be able to view, edit, and delete their stored memories. Personal memory and project memory will be managed separately to improve organization and privacy. The module will also provide an option to enable or disable automatic memory collection. The module will assign each memory a confidence score that decreases as time passes since the memory was last confirmed, prompting re-verification when a score drops below a set threshold. When conflicting information is detected, the system will pause and request user confirmation before updating the memory, keeping a version history of the change.

## AI Project Workspace:

This module will allow users to create and manage individual projects within Synoras AI. Each project will have its own conversations, tasks, summaries, and important decisions. Users will be able to store project-specific information and retrieve it during future discussions. The system will support basic task creation and progress tracking. Project memory will help the AI understand the context of a particular project. Users will be able to organize multiple projects independently within their account. This module will help users manage their academic, professional, and personal projects in a centralized workspace.

## Knowledge Base and GraphRAG:

This module will allow users to upload and manage documents that can be used as knowledge sources. The system will support selected file formats, including PDF, TXT, and Markdown. Uploaded documents will be processed, divided into smaller sections, and converted into embeddings. The embeddings will be stored in the PostgreSQL database with the pgvector extension to support similarity-based retrieval. After a document is ready for searching, a background job will extract the entities (such as people, organizations, concepts, and places) and the relationships between them from each section, using the cheapest suitable model chosen by the complexity router, and store them as a knowledge graph in the same database; no separate graph database will be used. When users ask questions, the system will use GraphRAG: it finds the entities most similar to the question, follows their relationships to related entities, collects the sections that support them, and uses those sections to generate contextual responses with source references. LangGraph will run these retrieval steps as a graph of steps. In the chat screen, a side panel will show the knowledge graph, and the entities and relationships used for an answer will be highlighted while the answer is being generated, using events streamed to the browser. Users will also be able to delete documents and perform re-indexing when required.

## Multi-Agent Collaboration:

This module will coordinate multiple specialized AI agents to solve tasks that require different processing steps. The system will include research, planning, reviewing, and final response agents. An orchestrator will assign tasks and manage communication between the agents. The research agent will collect relevant information, while the planning agent will divide complex requests into smaller steps. The reviewer agent will check the generated findings for quality and completeness. The final response agent will combine the available information into a structured response. Before a task is assigned to an agent, the orchestrator will classify its complexity as low, medium, or high and route it to the local model, a smaller cloud model, or a stronger cloud model respectively. Execution logs will record the model used, along with response time and estimated cost, to support comparison between routing strategies during evaluation.

## PDF Report Generation and System Security:

This module will allow users to generate structured PDF reports from information processed by Synoras AI. Reports may include conversation summaries, project information, and research findings. The system will use a Node.js PDF-generation library to create downloadable documents. Structured data will be validated before it is passed to the PDF generation process. This module will also include essential security and reliability controls used throughout the platform. Authentication, authorization, input validation, memory separation, and error handling will be implemented where required. The module will support reliable report generation while helping protect user information and system operations. The module also provides user account management, administrator monitoring, and a routing and cost log view for users.

# System Limitations/Constraints:

- Limited Development Time: The project will be developed within the available academic timeframe of two semesters. Therefore, implementation will focus on the selected core features, and additional advanced functionalities may be considered for future development.
- AI Model and Resource Limitations: The performance of Synoras AI will depend on the availability, capabilities, and usage limits of selected cloud and local AI models. Hardware limitations may affect the execution speed and performance of local models.
- Document and Integration Limitations: The knowledge base will initially support selected document formats, such as PDF, TXT, and Markdown. Advanced third-party integrations, including social media platforms and messaging applications, will not be included in the initial project scope.

# Software Process Methodology:

Synoras AI will follow the Agile Software Development Methodology to support iterative development, continuous testing, and regular feedback. The project will be divided into smaller development cycles called iterations or sprints. Each sprint will focus on implementing, testing, and improving selected modules of the system. The team members will collaborate regularly to discuss progress, identify challenges, and adjust development priorities. Core features such as AI chat, persistent memory, and the knowledge base will be developed and tested first, followed by dedicated sprints for the confidence-decay memory model, multi-agent collaboration, and complexity-based model routing, so these features get sufficient testing and evaluation time before final integration. Continuous testing and feedback will help identify errors and improve system reliability throughout the development process.

# Tools and Technologies:

The following tools and technologies will be used to develop, test, and deploy Synoras AI. They include frontend and backend frameworks, programming languages, AI libraries, databases, APIs, development tools, and hardware resources required for implementing the proposed system. Each technology has been selected based on its suitability for AI integration, web development, data management, system reliability, and project requirements.

Table 10.1: Tools & Technologies for Proposed Solution

| **Tools And** **Technologies** | **Component** | **Technology** | **Version** | **Rationale** |
|---|---|---|---|---|
|  | Frontend | Next.js [9], React [10], TypeScript [11] | 16.4.6, 19.3.1, 7.0.2 | Type-safe, performant, server-rendered web application framework |
|  | UI | Tailwind CSS [12] | 4.3.5 | Utility-first styling for rapid, consistent UI development |
|  | Backend | Python, FastAPI [13] | 3.11.4, 0.162.7 | High-performance, async-first API framework |
|  | Agent framework | LangChain [14], LangGraph [14] | 1.5.0, 1.2.22 | Graph-based orchestration of LLM agents and workflows |
|  | Task routing[6] | Lightweight complexity classifier | Custom component | Rates subtask difficulty as low, medium, or high and routes it to the local model, a smaller cloud model, or a stronger cloud model to balance cost, latency, and accuracy |
|  | Local model runtime | Ollama [15] | 0.40.16 | Runs a smaller local model for low-complexity subtasks identified by the router |
|  | Data validation | Pydantic [16] | 2.14.3 | Schema validation and serialization for API requests/responses |
|  | Database | PostgreSQL [17] | 18.7 | Reliable, relational data storage |
|  | Vector search | Pgvector [18] | 18.7 | Semantic similarity search for long-term memory retrieval, document sections, and knowledge graph entities |
|  | Graph extraction | LangChain graph transformer, langchain-experimental (proposed) | 0.4.2 | Extracts entities and relationships from document sections with a language model, to build the knowledge graph stored in PostgreSQL |
|  | Live updates | Server-Sent Events, built into FastAPI | Part of FastAPI | Streams the answer and the graph retrieval events to the browser over one open connection |
|  | Graph visualization | Cytoscape.js (proposed) | 3.35.0 | Draws the knowledge graph in the chat screen and highlights the nodes and edges used for an answer |
|  | Cache and jobs | Redis [19] | 8.10.3 | In-memory caching and message broker for background jobs |
|  | Background tasks | Celery [20] (Redis-backed worker) | 5.7.0 | Asynchronous processing of summarization, memory decay updates, and long-running tasks |
|  | File storage | Local Disk Storage | No version | Simple, no-cost storage for uploaded documents, suitable for an academic prototype |
|  | PDF generation | Node.js PDF library | Node.js 26.13.1, PDFKit 0.20.2 | Automated generation of styled, shareable PDF reports |
|  | Deployment | Docker [21] | Engine 29.9.3 | Consistent, portable containerized deployment |

# Stakeholders and Roles:

The development of Synoras AI involves several stakeholders who will contribute to the planning, development, supervision, testing, and evaluation of the project. Each stakeholder will have specific responsibilities to ensure that the system is developed according to the project requirements and academic objectives.

Table 11.1: Stakeholders and Roles

| **Stakeholder** | **Role and Responsibilities** |
|---|---|
| **Project Team** | Analyze requirements, design the system, develop modules, perform testing, and prepare project documentation. |
| **Project Supervisor** | Provide technical guidance, review project progress, and supervise the overall development process. |
| **End Users** | Use the AI chat, memory, project workspace, knowledge base, and report generation features. |
| **System Administrator** | Manage system configuration, user access, monitoring, and basic security operations. |
| **Testing and Evaluation Team** | Test system functionality, evaluate AI responses, measure memory conflict-detection accuracy, measure cost/latency savings from model routing, identify errors, and assess overall system performance. |
| **University/ Department** | Provide academic requirements, project evaluation, and institutional guidance throughout the FYP. |

# Team Members Individual Tasks/Work Division:

The work on Synoras AI is divided among the three team members according to their skills and interests, so that each module has a clear owner. The table below lists each member’s registration number and the modules they are responsible for. Responsibilities cover the backend, the AI components, and the frontend, while requirements analysis, testing, evaluation, documentation, and deployment are shared by all members. This division may be adjusted as the project progresses so the work stays balanced.

Table 12.1: Team Members & Task Division

| **Student Name** | **Student Registration Number** | **Responsibility/ Modules** |
|---|---|---|
| [Team Member 2] | [Registration No. 2] | Develop the AI chat system, persistent memory (including the confidence-decay scoring and conflict-detection logic), LangChain and LangGraph-based multi-agent collaboration, and integration with language models. Implement AI prompts, agent coordination, and response evaluation. |
| [Team Member 3] | [Registration No. 3] | Develop FastAPI backend APIs, PostgreSQL database structure, pgvector integration, knowledge base and GraphRAG functionality, the complexity-based task router and local/cloud model dispatch logic, and backend security controls. |
| [Team Member 1] | [Registration No. 1] | Develop the Next.js frontend, chat interface, project workspace, memory conflict-confirmation UI, and other user interface components. Integrate frontend features with backend APIs and implement the PDF report generation functionality using Node.js. |
| All Team Members |  | Participate in requirements analysis, system design, testing, debugging, evaluation of the memory and routing mechanisms, documentation, deployment, presentations, and final project evaluation. |

# Data Gathering:

The data required for Synoras AI will be gathered from official documentation, research papers, publicly available technical resources, and practical user requirements. The team will study existing AI assistants, memory systems, memory conflict resolution and staleness detection, Retrieval-Augmented Generation (RAG), GraphRAG and knowledge graph extraction, multi-agent architectures, and LLM routing techniques to understand their implementation approaches. Official documentation for technologies such as FastAPI, LangChain, LangGraph, Next.js, PostgreSQL, and pgvector will be consulted during development. Sample PDF, TXT, and Markdown documents will be used to test the knowledge base and document retrieval functionality, and documents with known entities and relationships will be used to check the knowledge graph extraction and the GraphRAG answers. Synthetic conversations and sample project information will be created to evaluate memory storage, retrieval, and summarization. A set of contradicting and non-contradicting fact pairs will be created to evaluate the accuracy of the memory conflict-detection mechanism. Test tasks of varying complexity will be designed to evaluate the performance of the complexity-based model router and multi-agent collaboration, including comparisons of cost and response time against a baseline that always uses the same model. User feedback from students and potential users may be collected to identify usability requirements and improve the system design. The gathered data will be used for system development, testing, performance evaluation, and project documentation.

# Concepts:

The development of Synoras AI will involve several important concepts related to artificial intelligence, software engineering, and web application development. These concepts will help the team understand and implement the major components of the proposed system.

- **Artificial Intelligence (AI):** The use of computer systems to perform tasks that normally require human intelligence, such as understanding language, reasoning, and generating responses.
- **Large Language Models (LLMs):** AI models that process and generate human-like text. Synoras AI will use selected cloud and local language models for conversation, planning, summarization, and other AI tasks.
- **Persistent Memory:** A mechanism that allows the system to store and retrieve useful information from previous conversations and project activities.
- **Memory Confidence Decay:** A technique where each stored memory is assigned a score that decreases over time based on how long ago it was last confirmed, helping the system flag information that may need re-verification.
- **Contradiction Detection:** The process of identifying when a new piece of information conflicts with something already stored in memory, so the system can ask the user to confirm which version is correct instead of overwriting silently.
- **Retrieval-Augmented Generation (RAG):** An approach that retrieves relevant information from a knowledge base and provides it to an AI model to generate more contextually relevant responses.
- **Knowledge Graph:** A set of entities (things such as people, organizations, concepts, or places) connected by relationships (for example, "works for" or "is part of"). Synoras AI builds one from the uploaded documents and stores it in PostgreSQL.
- **GraphRAG:** A form of RAG that does not only compare the question with text sections. It finds the entities related to the question, follows their relationships in the knowledge graph, and collects the text sections that support them before the model writes the answer.
- **Server-Sent Events (SSE):** A way for the server to send a stream of messages to the browser over one open HTTP connection. Synoras AI uses it to stream answers together with the live graph events.
- **Multi-Agent Systems:** Systems in which multiple specialized AI agents collaborate to complete tasks. Synoras AI will use research, planning, reviewing, and final response agents.
- **Agent Orchestration:** The process of coordinating AI agents, managing their execution order, and passing information between them. LangChain and LangGraph will be used for implementing agent workflows.
- **LLM Routing:** A technique that assigns each subtask to a model suited to its complexity, sending simple tasks to smaller or local models and harder tasks to stronger cloud models to balance cost, latency, and accuracy.
- **Vector Embeddings:** Numerical representations of text that help the system compare the semantic similarity between documents, memories, entities, and user queries.
- **Application Programming Interface (API):** A communication interface that allows different software components to exchange data and services. FastAPI will be used to develop the backend APIs for Synoras AI.
- **PDF Report Generation:** The process of converting structured information into downloadable PDF documents. Synoras AI will use a Node.js PDF-generation library to create reports and summaries.

# Gantt chart:

The following Gantt chart presents the planned development schedule for Synoras AI. The project will be completed in stages, starting with requirements analysis and system design and continuing through development, testing, deployment, and final documentation.

Figure 15.1: Gantt Chart of Synoras AI

# Mockups:

## Register / Log In Screen:

This screen lets a user create an account or log in with an email and password. It shows a clear error message for a wrong password and locks the account for 15 minutes after 5 failed attempts.

Figure 16.1: Register / Log In Screen of Synoras AI

## Chat Screen:

This is the main workspace where the user talks to the AI inside a selected project. It shows the chat history, the reply, and the model used for that reply. Memories that are used show a “needs re-verification” mark when their confidence is below 50%. When a question is answered from the knowledge base, a side panel shows the knowledge graph and highlights the entities and relationships the answer used while it is being written.

Figure 16.2: Chat Screen of Synoras AI

## Memory Conflict Screen:

This screen appears when new information conflicts with a saved memory. The system never replaces a memory by itself. It shows the old and new versions, and the user chooses to keep the old one, use the new one, or keep both.

Figure 16.3: Memory Conflict Screen of Synoras AI

## Project Workspace and Knowledge Base Screen:

This screen shows one project with its task board, chats and uploaded documents. The user can upload PDF, TXT and MD files (up to 20 MB each) and see each file’s status: Processing, Indexed or Failed, and, once a file is Indexed, the progress of its knowledge graph (Pending, Extracting, Ready or Failed).

Figure 16.4: Project Workspace and Knowledge Base Screen of Synoras AI

## Agent Pipeline and Routing Log Screen:

This screen shows how a complex task moves through the agents (Planner, Researcher, Writer, Reviewer) and how each subtask was routed. It lists the complexity level (Low, Medium or High) and the model used, either local or cloud.

Figure 16.5: Agent Pipeline and Routing Log Screen of Synoras AI

## Reports Screen:

This screen lists the PDF reports generated from a project’s work. The user can generate a new report, preview it, and download it.

Figure 16.6: Reports Screen of Synoras AI

# Conclusion:

Synoras AI is proposed as an agentic artificial intelligence platform designed to help users manage complex tasks, projects, and knowledge through coordinated AI agents with reliable, user-verified memory. The system integrates multi-agent collaboration, a confidence-decay memory model with conflict resolution, complexity-based model routing, and knowledge-base management into a unified web application. The project provides practical learning opportunities in artificial intelligence, large language models, agentic systems, web development, APIs, databases, and software engineering. Although the system may have limitations related to model availability, API costs, computational resources, and the reliability of AI-generated results, these challenges will be addressed through appropriate validation, modular architecture, and human oversight. Overall, the project aims to demonstrate how agentic AI can be applied to support reliable, cost-efficient, and personalized task assistance in a practical and scalable system.

# References:

[1] H. Chao, Y. Bai, R. Sheng, T. Li, and Y. Sun, "STALE: Can LLM Agents Know When Their Memories Are No Longer Valid?," *arXiv preprint arXiv:2605.06527,* 2026. [Online]. Available: https://arxiv.org/abs/2605.06527.

[2] J. Hu and S. Ramachandran, "The Memory Trust Gap: Capability-Dependent Failures in Persistent-Memory Agents," *arXiv preprint arXiv:2609.01852,* 2026. [Online]. Available: https://arxiv.org/abs/2609.01852.

[3] Z. Wang, "TOKI: A Bitemporal Operator Algebra for Contradiction Resolution in LLM-Agent Persistent Memory," *arXiv preprint arXiv:2606.06240,* 2026. [Online]. Available: https://arxiv.org/abs/2606.06240.

[4] X. Wang *et al.*, "MixLLM: Dynamic Routing in Mixed Large Language Models," in *Proceedings of the 2025 Conference of the Nations of the Americas Chapter of the Association for Computational Linguistics: Human Language Technologies (Volume 1: Long Papers)*, Albuquerque, New Mexico, 2025: Association for Computational Linguistics, pp. 10912–10922. [Online]. Available: https://aclanthology.org/2025.naacl-long.545/. [Online]. Available: https://aclanthology.org/2025.naacl-long.545/

[5] T. Shnitzer *et al.*, "Large Language Model Routing with Benchmark Datasets," *arXiv preprint arXiv:2309.15789,* 2023. [Online]. Available: https://arxiv.org/abs/2309.15789.

[6] I. Ong *et al.*, "RouteLLM: Learning to Route LLMs with Preference Data," in *International Conference on Learning Representations (ICLR 2025)*, 2025. [Online]. Available: https://arxiv.org/abs/2406.18665. [Online]. Available: https://arxiv.org/abs/2406.18665

[7] C. Lam, J. Li, L. Zhang, and K. Zhao, "Governing Evolving Memory in LLM Agents: Risks, Mechanisms, and the Stability and Safety Governed Memory (SSGM) Framework," *arXiv preprint arXiv:2603.11768,* 2026. [Online]. Available: https://arxiv.org/abs/2603.11768.

[8] J. Lu and Y. Li, "Dynamic Affective Memory Management for Personalized LLM Agents," *arXiv preprint arXiv:2510.27418,* 2025. [Online]. Available: https://arxiv.org/abs/2510.27418.

[9] Vercel, "Next.js Documentation." [Online]. Available: https://nextjs.org/docs.

[10] S. Meta Open, "React Documentation." [Online]. Available: https://react.dev.

[11] Microsoft, "TypeScript Documentation." [Online]. Available: https://www.typescriptlang.org/docs.

[12] L. Tailwind, "Tailwind CSS Documentation." [Online]. Available: https://tailwindcss.com/docs.

[13] FastApi, "FastAPI Documentation." [Online]. Available: https://fastapi.tiangolo.com.

[14] LangChain, "LangGraph Documentation." [Online]. Available: https://docs.langchain.com/oss/python/langgraph/overview.

[15] Ollama, "Ollama." [Online]. Available: https://ollama.com.

[16] Pydantic, "Pydantic Documentation." [Online]. Available: https://docs.pydantic.dev.

[17] S. Q. L. G. D. G. Postgre, "PostgreSQL Documentation." [Online]. Available: https://www.postgresql.org/docs.

[18] A. Kane, "pgvector: Open-source vector similarity search for Postgres." [Online]. Available: https://github.com/pgvector/pgvector.

[19] Redis, "Redis Documentation." [Online]. Available: https://redis.io/docs.

[20] P. Celery, "Celery Documentation." [Online]. Available: https://docs.celeryq.dev.

[21] Docker, "Docker Documentation." [Online]. Available: https://docs.docker.com.

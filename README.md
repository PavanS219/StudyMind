# StudyMind — AI Study Assistant

StudyMind is an AI-powered study assistant that lets students upload PDFs and notes, then instantly ask questions, generate flashcards, MCQs, summaries, and exam preparation guides — all grounded in their own uploaded material using Retrieval-Augmented Generation (RAG).

---

## Selected Problem Statement

Students waste hours manually extracting key information from large study materials. Reading through textbooks to find concepts, creating flashcards by hand, and preparing for exams without guidance is inefficient. StudyMind solves this by turning any uploaded document into an interactive study partner — answering questions, testing knowledge, and generating structured study content automatically.

---

## Demo Video Link

[Watch Demo](https://drive.google.com/file/d/1hp6a9vzW8qiH1xBHQQBdJ8dvThoTR4XE/view?usp=sharing) 

---

## Tech Stack Used

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Backend | FastAPI, Python 3.10+, Uvicorn |
| AI Framework | LangChain |
| LLM | LLaMA 3.3 70B via Groq |
| Embeddings | text-embedding-3-small via OpenRouter |
| Vector Database | Qdrant Cloud |
| PDF Parsing | PyMuPDF via LangChain PyMuPDFLoader |
| Session Storage | sessions.json (server) + localStorage (browser) |

---

## Backend Architecture / System Design

```
┌──────────────────────────────────────────────┐
│              React Frontend                   │
│  Chat │ Summary │ Flashcards │ MCQ │ Upload   │
└───────────────────┬──────────────────────────┘
                    │ HTTP REST
┌───────────────────▼──────────────────────────┐
│              FastAPI Backend                  │
│                                               │
│  POST /upload         → ingestion pipeline    │
│  POST /ask            → conversational RAG    │
│  POST /summarize      → summary generation    │
│  POST /flashcards     → flashcard generation  │
│  POST /mcq            → MCQ generation        │
│  POST /revision-notes → revision notes        │
│  POST /exam-prep      → exam prep guide       │
│  DELETE /delete-doc   → per-file deletion     │
└──────┬──────────────────────────┬─────────────┘
       │                          │
┌──────▼──────┐        ┌─────────▼──────────┐
│  Groq API   │        │   OpenRouter API    │
│  LLaMA 3.3  │        │  text-embedding-   │
│  70B LLM    │        │  3-small (1536d)   │
└─────────────┘        └─────────┬──────────┘
                                  │ vectors
                        ┌─────────▼──────────┐
                        │    Qdrant Cloud     │
                        │  Payload indexes:   │
                        │  session_id         │
                        │  tenant_id          │
                        │  filename           │
                        └────────────────────┘
```

**Document Ingestion Flow**
```
Upload PDF/TXT
  → LangChain Document Loader
  → RecursiveCharacterTextSplitter (chunk_size=800, overlap=150)
  → Jaccard deduplication
  → Batch embed via OpenRouter (20 chunks per batch)
  → Upsert to Qdrant with metadata
```

**Query Flow**
```
User question
  → Prompt injection check
  → Embed question via OpenRouter
  → Qdrant similarity search (top_k=8, threshold=0.15)
  → Filter by session_id + tenant_id
  → ConversationalRetrievalChain with memory
  → LLaMA 3.3 70B generates answer (max 4096 tokens)
```

---

## Implementation Approach & Workflow

**1. Session Management**
Each user gets a unique session ID on first load, stored in browser localStorage and persisted server-side in sessions.json. Sessions survive both page refreshes and server restarts. Qdrant vectors are scoped per session using payload filters, ensuring complete data isolation between users.

**2. RAG Pipeline**
Documents are chunked into 800-word segments with 150-word overlap so no fact is cut at a boundary. Each chunk is embedded and stored in Qdrant with metadata. At query time, the top 8 most relevant chunks are retrieved using cosine similarity and passed as context to the LLM. LangChain's ConversationBufferMemory maintains multi-turn conversation history per session.

**3. Frontend State Persistence**
All panel state (chat messages, flashcards, MCQ answers, summary results) lives in a single React Context (StudyContext). All panels are always mounted and shown/hidden via CSS display rather than conditional rendering, so switching tabs never wipes state.

**4. Document Deletion**
Each Qdrant point stores a filename in its metadata payload. Deleting a document sends a filtered delete request to Qdrant that removes only vectors belonging to that specific file, leaving all other documents intact.

**5. AI Generation Pipelines**
All generation features (summaries, flashcards, MCQs, revision notes, exam prep) use LangChain LLMChain with purpose-built PromptTemplates. Summaries support short/medium/long length modes. The LLM is instructed to return JSON for structured outputs (flashcards, MCQs) which are parsed and rendered in the UI.

---

## Features & Functionalities

- **Conversational Q&A** — Ask multi-turn questions about uploaded documents with full conversation memory
- **Smart Summaries** — Generate short, medium, or long structured summaries with bold headings and bullet points
- **Flashcards** — Auto-generate flip cards (5 to 15) from uploaded content
- **MCQ Quiz** — Multiple choice questions with answer checking, scoring, and explanations
- **Revision Notes** — Structured notes covering key concepts, definitions, formulas, and a quick recap
- **Exam Preparation** — Personalized exam guide with practice questions at easy, medium, or hard difficulty
- **Document Management** — Upload multiple PDFs/TXT files; delete individual documents and their vectors
- **Persistent Sessions** — All data survives page refresh and server restart
- **Access Control** — tenant_id and payload indexes isolate data per user
- **Prompt Injection Guard** — Regex-based detection blocks malicious inputs

---

## APIs / Models / Tools Used

| Service | What it does | Model / Version |
|---|---|---|
| Groq | LLM inference for all text generation | llama-3.3-70b-versatile |
| OpenRouter | Embedding generation | openai/text-embedding-3-small |
| Qdrant Cloud | Vector storage, similarity search, payload filtering | REST API |
| LangChain | RAG pipeline, chains, memory, loaders, splitters | 0.3.x |
| PyMuPDF | PDF text extraction | 1.24.x |
| FastAPI | REST API framework | 0.115.x |

---

## Setup Instructions to Run Locally

**Prerequisites**
- Python 3.10 or higher
- Node.js 18 or higher
- A Qdrant Cloud cluster — free tier at [cloud.qdrant.io](https://cloud.qdrant.io)
- A Groq API key — free at [console.groq.com](https://console.groq.com)
- An OpenRouter API key — free at [openrouter.ai](https://openrouter.ai)

**Clone the repository**
```bash
git clone https://github.com/your-username/studymind.git
cd studymind
```

**Start the backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac / Linux
pip install -r requirements.txt
cp .env.example .env         # then fill in your keys
uvicorn main:app --reload
# API runs at http://localhost:8000
```

**Start the frontend**
```bash
cd frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

Open `http://localhost:5173`, upload a PDF using **+ Add source**, and start studying.

---

## Environment Variables Required

Create a `.env` file inside the `backend/` folder using the template below.

```env
# Groq — LLM inference
# Get your key at https://console.groq.com/keys
GROQ_API_KEY=your_groq_api_key_here

# OpenRouter — Embeddings
# Get your key at https://openrouter.ai/keys
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Qdrant Cloud — Vector database URL
# Found in your cluster dashboard at https://cloud.qdrant.io
QDRANT_URL=https://your-cluster-id.qdrant.io

# Qdrant Cloud — API key
# Found in your cluster dashboard under API Keys
QDRANT_API_KEY=your_qdrant_api_key_here
```

---

## Installation Steps

```bash
# 1. Clone
git clone https://github.com/your-username/studymind.git
cd studymind

# 2. Backend — install dependencies
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# 3. Backend — configure environment
cp .env.example .env
# Open .env and fill in all four keys

# 4. Backend — start server
uvicorn main:app --reload

# 5. Frontend — install dependencies (new terminal)
cd ../frontend
npm install

# 6. Frontend — start dev server
npm run dev

# 7. Open http://localhost:5173 in your browser
```

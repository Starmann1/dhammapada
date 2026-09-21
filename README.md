# The Dhammapada: Sacred Minimalism UI & AI Study Companion

A modern, contemplative, and full-featured digital sanctuary for reading, studying, and practicing the eternal wisdom of the Buddha's teachings from [The Dhammapada](https://en.wikipedia.org/wiki/Dhammapada).

Designed with a **Sacred Minimalism** aesthetic, this platform marries ancient Theravada Buddhist scholarship with modern AI engineering. It presents the complete canonical collection of 423 verses across all 26 chapters (*vaggas*), featuring original Pali text, Romanized transliteration, English translations, detailed interlinear word-by-word analysis, traditional Dhammapada Atthakatha backstories, and **Dhamma AI**—a context-aware study assistant powered by Structured Hybrid RAG.

---

## Key Features

- **Sacred Minimalism UI**: A monastic, distraction-free reading experience crafted with warm gold accents, serene dark/light themes, smooth micro-interactions, and refined typography (*Cormorant Garamond* and *Plus Jakarta Sans*).
- **Complete Canonical Corpus (423 Verses & 26 Chapters)**:
  - **Original Pali Text & Transliteration**: Authentic verse text from SuttaCentral.
  - **English Translations**: Contemporary translations by Bhikkhu Sujato.
  - **Interlinear Word Analysis**: Granular word-by-word meanings and grammatical roots based on the scholarly work of Ānandajoti Bhikkhu.
  - **Dhammapada Atthakatha Stories**: Historical background narratives and traditional commentaries contextualizing each verse's occasion.
- **Dhamma AI Study Companion**:
  - Context-aware chatbot grounded strictly in canonical scriptures.
  - Multi-tier **Structured Hybrid RAG** (Vector + Lexical + Direct verse routing).
  - Traceable scripture citations with excerpts and relevancy scores.
  - Built-in conversational intelligence: handles greetings, reflections, and expressions of gratitude (*kataññutā*) gracefully.
- **Rich Exploration Modes**:
  - **Browse by Chapters**: Grid and list views across all 26 *vaggas* with verse counts and theme badges.
  - **Browse by Themes**: Explore teachings tagged by core Buddhist concepts (Mindfulness, Craving, Karma, Wisdom, Vigilance, the Sage, and more).
  - **Characters & Historical Figures**: Dedicated profiles of prominent disciples and figures from the Dhammapada narratives (Ānanda, Sāriputta, Mahāmoggallāna, Patācārā, Kisāgotamī, etc.).
  - **Curated Quotes**: Inspiring, hand-picked verses for daily contemplation.
- **Study & Reading Utilities**:
  - **Universal Fast Search (`Ctrl+K` / `Cmd+K`)**: Instant modal search supporting semantic queries, thematic concepts, and direct verse references (e.g., `1:1`, `18:2`).
  - **Focus / Zen Mode**: One-click distraction-free reading interface.
  - **Saved Verses & Bookmarks**: Local, private browser storage to bookmark and revisit verses anytime.
  - **Verse of the Day**: Automated daily wisdom highlights.
- **Automated Accuracy & Regression Suite**: Golden benchmark dataset validating retrieval accuracy across direct, semantic, and complex query tiers.

---

## Dhamma AI: Structured Hybrid RAG Engine

The platform includes **Dhamma AI**, a specialized study companion engineered to prevent hallucinations and maintain scriptural fidelity. It operates on a multi-tiered **Structured Hybrid Retrieval-Augmented Generation (RAG)** pipeline:

```text
[ User Query ]
      │
      ├── 1. Intent & Conversational Filter (Greetings / Gratitude / Farewells)
      │
      ├── 2. Direct Verse Lookup (Regex for '1:1', 'chapter:verse' -> 100% precision)
      │
      ├── 3. Hybrid Semantic & Lexical Retrieval
      │         ├── Semantic Vector Search (MongoDB Atlas HNSW / Hugging Face / OpenAI)
      │         └── Lexical & TF-IDF Search (Weighted terms across Pali, English & Commentary)
      │
      └── 4. Grounded Synthesis & Citation Assembly (Llama 3.3 70B via Groq / OpenAI)
```

- **Tier 1: Direct Lookup Layer**: Recognizes specific citations (e.g., `1:1`, `Dhp 183`) and serves the exact verse with 100% precision without wasting LLM or vector tokens.
- **Tier 2: Semantic Vector Retrieval**: Employs MongoDB Atlas Vector Search (HNSW index) or dense vector embeddings (Local Sign-Hashing, Hugging Face `all-MiniLM-L6-v2`, or OpenAI `text-embedding-3-small`).
- **Tier 3: Lexical TF-IDF Scoring**: Token overlap and weighted BM25/TF-IDF across translations, commentaries, stories, Pali text, and themes.
- **Conversational Intent Router**: Detects pleasantries, greetings, and expressions of gratitude (*kataññutā*), responding with compassionate Buddhist courtesy while keeping queries focused on the Dhamma.
- **Canonical Grounding & Traceability**: The generative model (Groq Llama 3.3 70B or OpenAI) is strictly instructed to ground every claim in retrieved passages and provide structured verse citations.
- **Zero-Configuration Offline Fallback**: If cloud databases or external APIs are unavailable, the system automatically falls back to local in-memory indexing and `data/dhammapada.json`.

---

## Technology Stack

### Frontend (Sacred Minimalism UI)
- **Vanilla HTML5 & CSS3**: Zero-bloat, performance-focused architecture.
  - Custom design tokens, CSS variables, glassmorphism, and responsive CSS Grid/Flexbox layouts.
  - Dedicated light and dark mode themes with persistent user state.
- **Vanilla JavaScript (ES6+ Modules)**:
  - Clean modular architecture: `router.js`, `store.js`, `search.js`, `render.js`, `focus.js`, and dedicated page modules.
  - Zero heavy frontend framework dependencies.
- **Typography**:
  - *Cormorant Garamond*: Traditional, elegant serif for sacred headings and reflective passages.
  - *Plus Jakarta Sans* & *Inter*: Crisp, readable modern sans-serif for UI and translations.
  - *Crimson Text*: Classic scriptural typography for Pali text.

### Backend (AI & API Engine)
- **FastAPI**: Modern, asynchronous Python web framework providing OpenAPI/Swagger documentation.
- **Uvicorn**: High-performance ASGI web server.
- **Pydantic v2**: Strict schema validation and response serialization.
- **Vector Storage & Database**:
  - **MongoDB Atlas**: Cloud vector database with HNSW vector index (`verse_vector_index`).
  - **Local In-Memory Repository**: High-speed fallback reading directly from `data/dhammapada.json`.
- **Embedding Providers**:
  - **Local Sign-Hashing**: Zero-cost, lightweight 384-dimensional hashing vectorizer (no external API keys needed).
  - **Hugging Face Inference API**: Free high-quality semantic vectors (`sentence-transformers/all-MiniLM-L6-v2`, 384 dimensions).
  - **OpenAI**: `text-embedding-3-small` (1536 dimensions).
- **LLM Providers**:
  - **Groq Cloud**: Ultra-low latency inference using `llama-3.3-70b-versatile`.
  - **OpenAI**: `gpt-4o` / `gpt-4o-mini`.
  - **Custom Base URL**: Flexible support for local LLM gateways (Ollama, vLLM, LM Studio).

---

## Project Structure

```text
dhammapada/
├── assets/                     # Frontend static assets
│   ├── css/                    # Modular CSS (base.css, tokens.css, components.css)
│   ├── js/                     # Modular JavaScript
│   │   ├── app.js              # Application entrypoint
│   │   └── modules/            # Router, store, search, focus, and page controllers
│   └── images/                 # Visual and icon assets
├── backend/                    # FastAPI RAG backend
│   ├── app/                    # Core application package
│   │   ├── config.py           # Environment and service configuration
│   │   ├── embeddings.py       # Local, Hugging Face, and OpenAI embedding providers
│   │   ├── llm.py              # Groq and OpenAI LLM client
│   │   ├── main.py             # FastAPI REST endpoints
│   │   ├── models.py           # Pydantic data schemas
│   │   ├── rag.py              # Structured Hybrid RAG implementation
│   │   └── repository.py       # MongoDB & Local JSON repository adapters
│   ├── tests/                  # Golden benchmark dataset for retrieval validation
│   ├── seed_mongodb.py         # MongoDB Atlas ingestion & indexing script
│   ├── test_accuracy.py        # Automated accuracy evaluation script
│   └── BACKEND_GUIDE.md        # Dedicated backend development documentation
├── data/                       # Verified canonical dataset
│   └── dhammapada.json         # Complete 423 verses with stories and interlinear data
├── docs/                       # Architectural and technical documentation
│   ├── DOCUMENTATION_HUB.md    # Central documentation portal
│   ├── tech_stack.md           # Comprehensive technology stack breakdown
│   ├── structured_hybrid_rag_report.md  # Deep dive into the RAG architecture
│   └── SUMMARY.md              # Project history and milestone summaries
├── pages/                      # HTML page templates (chapters, verses, themes, etc.)
├── scripts/                    # Preprocessing, enrichment, and sitemap utilities
├── api/                        # Serverless entrypoint for Vercel deployment
├── index.html                  # Main application landing page
├── start.bat                   # One-click dual launcher for Windows (frontend + backend)
├── requirements.txt            # Root Python dependencies
└── CREDITS.md                  # Comprehensive attribution, licensing & source provenance
```

---

## Getting Started

### Option 1: One-Click Quick Start (Windows)
If you are on Windows, simply double-click or run:
```cmd
start.bat
```
This automatically boots:
- The **Backend API** at `http://127.0.0.1:8001` (Interactive docs at `/docs`)
- The **Frontend Web UI** at `http://127.0.0.1:8000`
- Launches your default web browser directly to the application.

---

### Option 2: Frontend-Only (Static Reading Mode)
The frontend functions independently for reading all 26 chapters, 423 verses, themes, characters, bookmarks, and search:
```bash
python -m http.server 8000
```
Open `http://localhost:8000` in your browser.

---

### Option 3: Full Stack Setup (with Dhamma AI)

#### 1. Set Up Environment & Dependencies
From the repository root:
```bash
# Create and activate virtual environment
python -m venv venv

# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

#### 2. Configure Environment Variables
Create or edit `backend/.env` (or `.env` in the root). For zero-cost, out-of-the-box local development:
```env
# AI Intelligence Provider (Groq recommended for high-speed free tier)
LLM_PROVIDER=groq
LLM_MODEL=llama-3.3-70b-versatile
GROQ_API_KEY=your_groq_api_key_here

# Embedding Configuration (local hashing requires no API keys)
EMBEDDING_PROVIDER=local
EMBEDDING_DIMENSIONS=384

# Optional: MongoDB Atlas (if omitted, falls back to local data/dhammapada.json)
# MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/
# MONGODB_DATABASE=dhammapada
```

*(To use Hugging Face for embeddings, set `EMBEDDING_PROVIDER=huggingface` and provide `HUGGINGFACE_API_KEY`. To use OpenAI, set `EMBEDDING_PROVIDER=openai`, `EMBEDDING_DIMENSIONS=1536`, and `OPENAI_API_KEY`.)*

#### 3. Start the Backend API
Run from the repository root:
```bash
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8001
```
- API Health Check: `http://127.0.0.1:8001/api/health`
- Interactive API Docs (Swagger): `http://127.0.0.1:8001/docs`

#### 4. Start the Frontend Server
In a separate terminal:
```bash
python -m http.server 8000
```
Visit `http://localhost:8000` to interact with the full-stack platform and Dhamma AI.

#### 5. Run the Accuracy Benchmark
Verify retrieval accuracy against the golden benchmark dataset:
```bash
python backend/test_accuracy.py
```

---

## Documentation Hub

For in-depth architectural overviews, technical reports, and developer guides, consult:
- **[Documentation Portal](docs/DOCUMENTATION_HUB.md)**: Main hub for all documentation.
- **[Structured Hybrid RAG Report](docs/structured_hybrid_rag_report.md)**: Mathematical formulation and design of the hybrid retrieval engine.
- **[Technology Stack](docs/tech_stack.md)**: Complete catalog of tools, libraries, fonts, and assets.
- **[Backend Service Guide](backend/BACKEND_GUIDE.md)**: Endpoints, seeding scripts, and vector index configurations.
- **[Project Summary](docs/SUMMARY.md)**: Evolution, architectural milestones, and version history.
- **[Credits & Attribution](CREDITS.md)**: Canonical sources, licensing notes, font credits, and copyright disclaimers.

---

## Roadmap & Future Scope

The goal is to establish this platform as the definitive Dhammapada study companion. Here is our path forward, ranked from foundational improvements to long-term complex visions:

### Phase 1: Near-Term (Foundational Enhancements)
- **Contemplative Exercises**: Add an "Apply to Life" section for every verse, where the AI generates a specific daily task based on the teaching.
- **Multi-Translation Comparison**: Allow users to toggle between legendary translations (e.g., Buddharakkhita, Sujato, and Thanissaro Bhikkhu) for better perspective.
- **Dharma Journaling**: A built-in private space for users to record reflections, with AI suggesting relevant verses based on their entries.
- **Source Attribution UI**: Precise highlighting and direct linking for every sentence the AI says, pointing to the exact Pali word or Commentary line it came from.

### Phase 2: Mid-Term (Interactive & Community Features)
- **Word-by-Word Interlinear Analysis**: Clickable Pali words that reveal their root, grammatical case, and full scholarly dictionary definitions.
- **Socratic AI Mode**: A specialized "Teacher" persona that guides users through self-reflection and questioning rather than just providing direct answers.
- **Spaced Repetition (Anki-style)**: A built-in learning system to help users systematically memorize their favorite verses and Pali terms.
- **Global Reflection Stream**: A public (anonymous) feed where users can see what others are learning and share their own insights.
- **Personalized Study Paths**: The AI tracks user progress and suggests new chapters based on their interests and past questions.
- **Daily Contemplation**: Push notifications for personalized "Micro-Meditations" based on verses relevant to the user's current life situation.

### Phase 3: Long-Term (The Global Vision)
- **Audio Chanting Integration**: High-quality Pali audio recordings synced with the text to help users learn the rhythm and pronunciation of the verses.
- **Thematic Knowledge Graph**: An interactive, multi-dimensional visual map showing how different chapters and concepts (Mindfulness, Craving, etc.) connect across the text.
- **Agentic RAG Architecture**: Moving to multi-step reasoning (searching root verses, then commentaries) and implementing a "Critic" agent for self-correction.
- **Scholarly Verification (Monk-in-the-Loop)**: A platform for verified monks and scholars to "upvote" or "certify" AI-generated explanations.
- **Cross-Lingual Semantic Search**: Supporting global users with multilingual embeddings and auto-translation of AI explanations.
- **Comparative Study Expansion**: Extending the Dhammapada-focused experience with comparative study across adjacent philosophical traditions such as Zen, Daoism, and Advaita, while keeping the Dhammapada as the primary source and interpretive anchor.

## Acknowledgements

This project would not be possible without the incredible work of the global Buddhist scholarly community. We acknowledge the following primary sources:

- **SuttaCentral**: For providing the verified Pali root text and modern English translations by **Bhikkhu Sujato**.
- **Ancient Buddhist Texts**: For the detailed interlinear phrase meanings by **Ānandajoti Bhikkhu**.
- **Tipitaka.net**: For hosting the traditional **Dhammapada Atthakatha** (Stories and Commentaries).
- **The Open Source Community**: For the foundational frameworks and libraries that power our platform, including **FastAPI**, **Uvicorn**, and various Python ecosystem tools. A detailed list of all technologies used can be found in our [Technology Stack](docs/tech_stack.md) document.

## Credits, Attribution & Copyright

For the detailed third-party attribution, copyright, licensing, source provenance, font credits, software dependencies, service providers, and image-asset status, see **[CREDITS.md](CREDITS.md)**.

> **Copyright note:** The project currently does not declare a repository-wide open-source licence. Third-party text, translations, commentaries, images, fonts, libraries, and services remain subject to their own copyright and licence terms.

---

**Status**: Active Development  
*May all beings find peace through the Dhamma.*



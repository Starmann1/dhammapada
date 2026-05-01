# The Dhammapada

A modern, full-featured platform for reading, studying, and practicing the eternal wisdom of the Buddha's teachings from [The Dhammapada](https://en.wikipedia.org/wiki/Dhammapada).

This project presents the collection of sayings in a clean, accessible web interface, complete with original Pali text, English translations, supplementary stories, and an AI-powered study assistant.

## Features

- **Read and Browse**: Navigate through all 26 chapters with a focus on typography and readability.
- **Dhamma AI Chatbot**: A context-aware study assistant that can answer questions based on the scriptures using **Structured Hybrid RAG**.
- **Detailed Verses**: Deep-dive into individual verses with:
  - Original Pali text & Transliteration
  - English translations & Word-by-word meanings
  - Explanatory commentaries and historical stories
- **Universal Search (Ctrl+K)**: Semantic and keyword search across all verses.
- **Reading Aids**: Dynamic progress tracking, "Verse of the Day", and popular verse highlights.
- **Modern UI**: Dark mode support, responsive design, and smooth transitions.

## Dhamma AI: Structured Hybrid RAG

The chatbot utilizes a sophisticated **Structured Hybrid RAG (Retrieval-Augmented Generation)** engine:
- **Hybrid Retrieval**: Combines Vector Search (Semantic) with TF-IDF (Lexical) for maximum precision.
- **Context-Aware**: The AI understands the specific chapter/verse you are currently reading.
- **Canonical Grounding**: Responses are grounded in the actual text, commentaries, and background stories of the Dhammapada.
- **Flexible Backend**: Supports MongoDB Atlas Vector Search or local in-memory indexing.

## Tech Stack

### Frontend
- **HTML5 & Vanilla CSS**: Performance-first, framework-free UI.
- **JavaScript (ES6+)**: Reactive DOM updates and client-side logic.
- **Google Fonts**: Inter & Outfit for premium typography.

### Backend (AI Engine)
- **FastAPI**: High-performance Python API.
- **MongoDB Atlas**: Vector database for semantic search.
- **LLM Integration**: Groq (Llama 3) or OpenAI for intelligent responses.
- **Embeddings**: Local Hashing-based vectors or OpenAI embeddings.

## Project Structure

```text
├── assets/             # CSS, JS, and image assets
├── backend/            # FastAPI RAG application
│   └── app/            # RAG logic, embeddings, and repository patterns
├── data/               # Dhammapada dataset (JSON)
├── docs/               # Technical documentation and reports
├── pages/              # Chapter and Verse detail templates
├── index.html          # Main landing page
└── requirements.txt    # Python dependencies
```

## Getting Started

### 1. Frontend Only (Static)
Simply run a local server in the root directory:
```bash
python -m http.server 8000
```

### 2. Full Stack (with Dhamma AI)
1. **Set up Python environment**:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   pip install -r requirements.txt
   ```
2. **Configure Environment**: Create a `.env` file in `backend/` with your API keys (GROQ_API_KEY, etc.).
3. **Run the API**:
   ```bash
   uvicorn app.main:app --reload
   ```

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
- **Full Canon Scale-up**: Expanding the RAG architecture to support the entire **Tri-Pitaka** (Pali Canon) including lineage-specific contexts (Theravada, Zen, etc.).

## Acknowledgements

This project would not be possible without the incredible work of the global Buddhist scholarly community. We acknowledge the following primary sources:

- **SuttaCentral**: For providing the verified Pali root text and modern English translations by **Bhikkhu Sujato**.
- **Ancient Buddhist Texts**: For the detailed interlinear phrase meanings by **Ānandajoti Bhikkhu**.
- **Tipitaka.net**: For hosting the traditional **Dhammapada Atthakatha** (Stories and Commentaries).
- **The Open Source Community**: For the foundational frameworks and libraries that power our platform, including **FastAPI**, **Uvicorn**, and various Python ecosystem tools. A detailed list of all technologies used can be found in our [Technology Stack](docs/tech_stack.md) document.

---

**Status**: Active Development  
*May all beings find peace through the Dhamma.*

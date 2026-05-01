# The Dhammapada

A modern, full-featured platform for reading, studying, and practicing the eternal wisdom of the Buddha's teachings from [The Dhammapada](https://en.wikipedia.org/wiki/Dhammapada).

This project presents the collection of sayings in a clean, accessible web interface, complete with original Pali text, English translations, supplementary stories, and an AI-powered study assistant.

## ✨ Features

- **Read and Browse**: Navigate through all 26 chapters with a focus on typography and readability.
- **Dhamma AI Chatbot**: A context-aware study assistant that can answer questions based on the scriptures using **Structured Hybrid RAG**.
- **Detailed Verses**: Deep-dive into individual verses with:
  - Original Pali text & Transliteration
  - English translations & Word-by-word meanings
  - Explanatory commentaries and historical stories
- **Universal Search (Ctrl+K)**: Semantic and keyword search across all verses.
- **Reading Aids**: Dynamic progress tracking, "Verse of the Day", and popular verse highlights.
- **Modern UI**: Dark mode support, responsive design, and smooth transitions.

## 🤖 Dhamma AI: Structured Hybrid RAG

The chatbot utilizes a sophisticated **Structured Hybrid RAG (Retrieval-Augmented Generation)** engine:
- **Hybrid Retrieval**: Combines Vector Search (Semantic) with TF-IDF (Lexical) for maximum precision.
- **Context-Aware**: The AI understands the specific chapter/verse you are currently reading.
- **Canonical Grounding**: Responses are grounded in the actual text, commentaries, and background stories of the Dhammapada.
- **Flexible Backend**: Supports MongoDB Atlas Vector Search or local in-memory indexing.

## 🛠️ Tech Stack

### Frontend
- **HTML5 & Vanilla CSS**: Performance-first, framework-free UI.
- **JavaScript (ES6+)**: Reactive DOM updates and client-side logic.
- **Google Fonts**: Inter & Outfit for premium typography.

### Backend (AI Engine)
- **FastAPI**: High-performance Python API.
- **MongoDB Atlas**: Vector database for semantic search.
- **LLM Integration**: Groq (Llama 3) or OpenAI for intelligent responses.
- **Embeddings**: Local Hashing-based vectors or OpenAI embeddings.

## 📁 Project Structure

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

## 🚀 Getting Started

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

## 📝 License

Buddhist scriptures are in the public domain. The website codebase is provided for educational and practice purposes.

---

**Status**: 🚀 Active Development  
*May all beings find peace through the Dhamma. 🙏*

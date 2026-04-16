# The Dhammapada

A static website for reading, studying, and practicing the eternal wisdom of the Buddha's teachings from [The Dhammapada](https://en.wikipedia.org/wiki/Dhammapada). 

This project presents the collection of sayings in a clean, modern, and accessible web interface, complete with original Pali text, English translations, and supplementary stories and commentary.

> **Note**: This is an early-stage side project. More features and content will be added in the future.

## ✨ Features

- **Read and Browse**: Navigate through all 26 chapters of The Dhammapada.
- **Detailed Verses**: View individual verses featuring:
  - Original Pali text
  - English translations
  - Explanatory commentaries (expandable)
  - Related Buddhist stories (expandable)
- **Full-Text Search (Ctrl+K)**: Instantly search through Pali text, translations, and commentaries across all verses.
- **Reading aids**: 
  - Dynamic reading progress bar
  - Smooth scroll-to-top functionality
- **Accessible Design**: 
  - Dark mode support with persistent local storage
  - Fully responsive grid layout for mobile and desktop reading
  
## 🛠️ Tech Stack

This project is built using standard foundational web technologies—no build steps or heavy frameworks required:
- **HTML5**: Semantic document structure
- **CSS3**: Custom vanilla CSS with CSS variables for theming and dark mode
- **JavaScript (ES6+)**: Vanilla scripting for DOM manipulation, search logic, and UI interactions
- **JSON**: All chapter and verse data is served statically from `data/dhammapada.json`

## 📁 Project Structure

```text
├── assets/
│   ├── css/          # Stylesheets (styles.css)
│   ├── images/       # Static image assets (icons, heroes)
│   └── js/           # JavaScript logic (script.js)
├── data/
│   └── dhammapada.json # The core dataset containing chapters and verses
├── pages/
│   ├── chapter.html  # Dynamic template for viewing a chapter's verses
│   └── verse.html    # Dynamic template for deep-diving into a single verse
├── index.html        # The main landing and chapter exploration page
└── README.md         # This file
```

## 🚀 Local Development

Since this project uses no build tools and fetches JSON data dynamically via JavaScript `fetch()`, you must run it through a local web server (to avoid CORS restrictions).

1. Clone the repository:
   ```bash
   git clone https://github.com/Starmann1/dhammapada-static.git
   cd dhammapada-static
   ```

2. Start a local server. Here are a few ways to do it:
   - **Using VS Code**: Install the "Live Server" extension and click "Go Live" at the bottom right.
   - **Using Python**: Run `python -m http.server 8000` (or `python3`) and open `http://localhost:8000`.
   - **Using Node.js**: Run `npx serve .`

## 📝 License

Buddhist scriptures are in the public domain. The website codebase is provided as-is entirely for educational purposes.

---

**Status**: 🚧 Work in Progress  
*May all beings benefit from the Buddha's teachings. 🙏*

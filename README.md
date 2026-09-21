<div align="center">

  <!-- Animated Gradient Banner -->
  <img src="https://readme-typing-svg.demolab.com?font=Outfit&size=40&duration=3000&pause=1000&color=6366F1&center=true&vCenter=true&width=800&lines=QuickRecall;Turn+Notes+Into+Active+Recall;Master+Diagrams+%26+Concepts+Faster" alt="QuickRecall Banner" />

  <p align="center">
    <strong>🚀 Transform passive study materials into high-yield active recall decks & interactive visual labeling exercises.</strong>
  </p>

  <!-- Colorful Tech Badges -->
  <p align="center">
    <img src="https://img.shields.io/badge/React_19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Tailwind_CSS_v4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Gemini_2.5_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Gemini" />
    <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase" />
    <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  </p>

  <!-- Quick Links -->
  <p align="center">
    <a href="#-key-capabilities"><img src="https://img.shields.io/badge/✨_Features-8B5CF6?style=flat-square" alt="Features" /></a>
    <a href="#-architecture--technology-stack"><img src="https://img.shields.io/badge/🏗️_Architecture-EC4899?style=flat-square" alt="Architecture" /></a>
    <a href="#-getting-started"><img src="https://img.shields.io/badge/🚀_Get_Started-10B981?style=flat-square" alt="Get Started" /></a>
  </p>

  <hr style="border: none; height: 2px; background: linear-gradient(to right, transparent, #6366F1, #EC4899, transparent); margin: 30px 0;" />

</div>

## 🎯 What is QuickRecall?

QuickRecall is a **full-stack revision application** designed for students and self-directed learners who want to stop passively re-reading notes. Instead, it extracts core concepts, causal relationships, and visual structures from raw study materials to build:

-   ✅ **Structured Active-Recall Question Decks**
-   ✅ **Interactive Diagram Labeling Tests**
-   ✅ **Anki-Compatible Export Files**

Powered by **Gemini 2.5 Flash**, it turns PDFs, lecture photos, and text notes into durable learning experiences in seconds.

---

## ✨ Key Capabilities

### 📥 Multimodal Study Material Ingestion
| Input Type | Description |
| :--- | :--- |
| 📝 **Text & Notes** | Paste summaries, syllabi, or chapter outlines directly |
| 📸 **Photos & Scans** | Upload textbook diagrams, handwritten notes, or whiteboards |
| 📄 **PDF Documents** | Process lecture slides, textbook excerpts, or reading packets |

### 🧠 High-Yield Question Generation
AI-powered categorization across six distinct learning modalities:

-   🔵 **Conceptual** – Deep comprehension and synthesis
-   🟢 **Definition** – Core terminology and formal distinctions
-   🟡 **Cause & Effect** – Triggers, sequences, mechanisms, outcomes
-   🟠 **Factual** – Quantitative rules, steps, components, formulas
-   🔴 **Application** – Problem scenarios, troubleshooting, clinical use
-   🟣 **Diagram** – Visual structure identification and flow paths

> ⚙️ **Configurable Depth:** Easy / Medium / Hard with selectable deck sizes (5, 10, or 20 questions)

### 🖼️ Interactive Diagrams & Pin Labeling
-   **Generated SVG Schematics** – Clean, dark-mode visuals for anatomical/process topics
-   **Source Image Pinning** – Numbered markers `[1]`, `[2]`, `[3]` mapped directly onto uploads
-   **Pulse Highlighting** – Active marker pulses during study; label concealed until recall test
-   **Full-Screen Inspection** – Modal with tooltips, descriptions, and manual label peeking

### 🎮 Dual Study Interfaces
-   **⌨️ Focus Flashcard Mode** – Distraction-free single-card study with keyboard shortcuts (`Space` flip, `1` Knew It, `2` Revise, `←/→` navigate)
-   **📋 List Review Mode** – Real-time filtering (`All`, `Needs Revision`, `Mastered`, `Unreviewed`, `Diagrams`), batch reveal/hide, self-scoring

### 📤 Export & Interoperability
-   **Anki TSV Export** – Direct import with preserved tags and HTML formatting
-   **Printable Study Sheets** – Clean print layout (question-only or Q+A)
-   **Markdown & JSON** – Raw exports for Obsidian, Notion, or local archiving

### ☁️ Cloud Sync & Security
-   **Firebase Auth** – Guest/anonymous + Google sign-in
-   **Firestore Persistence** – Decks, progress, and mastery metrics synced across devices
-   **Hardened Rules** – Schema validation, volumetric limits, ownership verification at DB layer

---

## 🏗️ Architecture & Technology Stack

<div align="center">

| Layer | Technology | Details |
| :--- | :--- | :--- |
| 🎨 **Frontend** | React 19 + TypeScript | SPA bundled with Vite |
| 💅 **Styling** | Tailwind CSS v4 | Dark-mode, high-contrast, accessible |
| 🎬 **Animations** | Motion (`motion/react`) | Card flips, progress bars, modals |
| 🖼️ **Icons** | Lucide React | Clean outlined 24px icon set |
| ⚙️ **Backend** | Node.js + Express | Gemini API proxy + static asset server |
| 🤖 **AI Engine** | `@google/genai` | Gemini 2.5 Flash w/ structured JSON output |
| 🔥 **Database** | Firebase Firestore + Auth | Cloud storage for decks & user stats |
| 📦 **Build** | Vite + esbuild | Self-contained `dist/server.cjs` + client |

</div>

---

## 📁 Directory Structure

```text
├── index.html                   # HTML entry point with SEO & OpenGraph tags
├── server.ts                    # Express server + Gemini multimodal endpoint
├── firebase-blueprint.json      # Firestore schema blueprint
├── firestore.rules              # Hardened security rules
├── src/
│   ├── main.tsx                 # React app bootstrap
│   ├── App.tsx                  # State container & view router
│   ├── index.css                # Global Tailwind imports
│   ├── types.ts                 # Shared TS interfaces
│   ├── components/
│   │   ├── AuthModal.tsx        # Firebase sign-in dialog
│   │   ├── CompletionBanner.tsx # Session summary & actions
│   │   ├── DiagramViewer.tsx    # Interactive SVG/image labeling
│   │   ├── FileUploadArea.tsx   # Drag-drop upload + preview
│   │   ├── FocusFlashcard.tsx   # Keyboard-enabled flashcards
│   │   ├── Header.tsx           # Nav bar + profile + sync
│   │   ├── NoteInputForm.tsx    # Material input + presets
│   │   ├── QuestionCard.tsx     # Single card for list view
│   │   ├── QuestionList.tsx     # List view + filters + export
│   │   └── SavedSetsModal.tsx   # Cloud revision set manager
│   ├── context/
│   │   └── AuthContext.tsx      # Firebase auth provider
│   ├── lib/
│   │   └── firebase.ts          # SDK init + Firestore helpers
│   └── services/
│       └── aiService.ts         # Client wrapper for /api/generate
```

---

## 🚀 Getting Started

### Prerequisites
-   **Node.js 20+**
-   **Google Gemini API Key** ([Get one here](https://aistudio.google.com/apikey))

### ⚡ Environment Setup

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 🛠️ Development

```bash
# Install dependencies
npm install

# Start dev server (Express + Vite) on port 3000
npm run dev
```

### 📦 Build & Production

```bash
# Build client + bundle backend to dist/server.cjs
npm run build

# Start production server
npm start
```

---

<div align="center">

  <hr style="border: none; height: 2px; background: linear-gradient(to right, transparent, #6366F1, #EC4899, transparent); margin: 30px 0;" />

  <p>
    <sub>Built with ❤️ for active learners everywhere</sub><br/>
    <sub><strong>QuickRecall</strong> • Stop Re-Reading. Start Recalling.</sub>
  </p>

</div>

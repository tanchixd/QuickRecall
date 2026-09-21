# QuickRecall

> **Turn study notes, lecture PDFs, textbook photos, and diagrams into high-yield active-recall questions and interactive visual labeling exercises for rapid, durable learning.**

QuickRecall is a full-stack revision application designed for students and self-directed learners. Instead of passively re-reading notes, QuickRecall extracts core concepts, causal relationships, and visual structures from raw study materials to build structured active-recall question decks and interactive diagram tests.

---

## Key Capabilities

### 1. Multimodal Study Material Ingestion
- **Text & Lecture Notes**: Direct pasting or typing of summary notes, syllabi, or chapter outlines.
- **Photos & Scans**: Upload high-resolution images of textbook diagrams, handwritten notes, flashcards, or whiteboards.
- **PDF Documents**: Direct upload of lecture slides, textbook excerpts, or reading packets.

### 2. High-Yield Question Generation
- Powered by the Google Gemini API (`@google/genai` with `gemini-2.5-flash`) via an Express backend proxy to protect API keys.
- Questions categorized into distinct learning modalities:
  - **Conceptual**: Deep comprehension and synthesis.
  - **Definition**: Core terminology and formal distinctions.
  - **Cause & Effect**: Triggers, sequences, mechanisms, and outcomes.
  - **Factual**: Quantitative rules, steps, components, and formulas.
  - **Application**: Problem scenarios, troubleshooting, and clinical/practical application.
  - **Diagram**: Identification of visual structures and flow paths.
- Configurable study depth: **Easy**, **Medium**, or **Hard**, with selectable deck sizes (5, 10, or 20 questions).

### 3. Interactive Diagrams & Active-Recall Pin Labeling
- **Generated Visual Schematics**: Generates clean, dark-mode SVG schematics for anatomical or process-based topics (e.g., mitochondria, nephrons, photosynthesis, neural synapses).
- **Source Image Pinning**: Maps numbered markers (`[1]`, `[2]`, `[3]`) directly onto uploaded diagram images.
- **Target Pin Highlighting**: When studying a diagram question, the active marker pulses on the canvas, keeping the label concealed until the student tests their recall and reveals the answer.
- **Interactive Inspection**: Full-screen inspection modal with tooltips, descriptions, and manual label peeking.

### 4. Dual Study Interfaces
- **Focus Flashcard Mode**: Distraction-free single-card study with keyboard shortcuts (`Space` to flip, `1` for Knew It, `2` for Revise, `←`/`→` for navigation).
- **List Review Mode**: Comprehensive overview with real-time status filtering (`All`, `Needs Revision`, `Mastered`, `Unreviewed`, `Diagrams`), batch reveal/hide, and direct self-scoring.

### 5. Export & Interoperability
- **Anki Deck Export**: Download TSV formatted specifically for direct import into Anki with preserved tags and HTML line breaks.
- **Printable Study Sheet**: Clean, formatted print layout with optional question-only or question + answer configurations.
- **Markdown & JSON**: Raw exports for personal knowledge bases (Obsidian, Notion) or local archiving.

### 6. Cloud Sync & Security
- **Firebase Authentication**: Guest/anonymous login and Google sign-in.
- **Cloud Firestore Persistence**: Saved study sets, revision progress, and mastery metrics synced across devices.
- **Hardened Security Rules**: Schema validation, volumetric limits, and ownership verification enforced at the database layer.

---

## Architecture & Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript | Single-page application bundled with Vite |
| **Styling & UI** | Tailwind CSS v4 | Dark-mode interface, high-contrast typography, accessible color hierarchy |
| **Animations** | Motion (`motion/react`) | Card flips, progress bars, and modal transitions |
| **Icons** | Lucide React | Clean, outlined 24px icon set |
| **Backend / API** | Node.js + Express | Proxies Gemini API requests and serves client assets |
| **AI Engine** | `@google/genai` | Gemini 2.5 Flash with structured JSON output schema |
| **Database & Auth** | Firebase (Firestore + Auth) | Cloud storage for decks and user statistics |
| **Production Build** | Vite + esbuild | Compiles backend to self-contained `dist/server.cjs` and client to `dist/` |

---

## Directory Structure

```text
├── index.html                   # HTML entry point with SEO and OpenGraph tags
├── server.ts                    # Express server with Gemini multimodal API endpoint
├── firebase-blueprint.json      # Firestore schema blueprint
├── firestore.rules              # Hardened Firestore security rules
├── src/
│   ├── main.tsx                 # React application bootstrap
│   ├── App.tsx                  # Main state container and view router
│   ├── index.css                # Global Tailwind CSS imports
│   ├── types.ts                 # Shared TypeScript interfaces and types
│   ├── components/
│   │   ├── AuthModal.tsx        # Firebase sign-in dialog
│   │   ├── CompletionBanner.tsx # Study session summary and completion actions
│   │   ├── DiagramViewer.tsx    # Interactive SVG and image diagram labeling viewer
│   │   ├── FileUploadArea.tsx   # Drag-and-drop file upload with preview
│   │   ├── FocusFlashcard.tsx   # Keyboard-enabled flashcard study mode
│   │   ├── Header.tsx           # App navigation bar with user profile & cloud sync
│   │   ├── NoteInputForm.tsx    # Study material input, preset samples, and settings
│   │   ├── QuestionCard.tsx     # Single question card for list view
│   │   ├── QuestionList.tsx     # List view with filters, export menu, and stats
│   │   └── SavedSetsModal.tsx   # Cloud revision set manager
│   ├── context/
│   │   └── AuthContext.tsx      # Firebase auth provider and sync hook
│   ├── lib/
│   │   └── firebase.ts          # Firebase SDK initialization and Firestore helpers
│   └── services/
│       └── aiService.ts         # Client wrapper for /api/generate-questions
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- A Google Gemini API key (`GEMINI_API_KEY`)

### Environment Setup
Create a `.env` file in the root directory based on `.env.example`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Development
```bash
# Start dev server (Express + Vite) on port 3000
npm run dev
```

### Build & Production Run
```bash
# Build client static files and bundle backend to dist/server.cjs
npm run build

# Start production server
npm start
```

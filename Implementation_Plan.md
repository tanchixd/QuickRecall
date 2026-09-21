# Implementation Plan - QuickRecall

## 1. Overview
QuickRecall is a minimal, fast, mobile-first Progressive Web App (PWA) that converts a student's study material/notes into high-quality active-recall questions. It does ONE thing exceptionally well: input notes → generate useful revision questions.

## 2. Core Functional Requirements
- **Distraction-Free Single-Screen / Focused Flow**:
  - Title: QuickRecall
  - Tagline: "Turn notes into questions."
  - Large note input textarea with dynamic character/word gauge and paste support.
  - Optional Topic / Title field (helps frame context).
  - Generation settings with fluid animated segment selectors (`motion/react` `layoutId`):
    - Number of questions: 5, 10, 20 (Default: 10)
    - Difficulty: Easy, Medium, Hard (Default: Medium)
  - Generate Questions button with engaging multistep progress loader.
- **Dynamic Revision Experience (Dual Modes)**:
  - **Focus / Flashcard Mode**:
    - Single question at a time with smooth 3D flip / slide animations.
    - Keyboard hotkeys (`Space` to reveal, `1` for Knew, `2` for Revise, `←`/`→` for previous/next).
    - Mobile swipe/touch support.
    - Stepper pill bar for quick navigation across all questions.
  - **List Mode**:
    - Vertical list of cards with smooth collapsible answer drawers.
    - Filter pills (All, Revise, Knew, Pending, Diagrams) with animated layout transitions.
  - **Dynamic Completion Celebration**:
    - Live mastery score & retention percentage when all questions are reviewed.
    - Action to "Drill missed questions" (focus revision mode).
  - **Interactive Diagram / Image Modal**:
    - Tap-to-zoom modal for attached diagrams and figures to inspect labels closely during recall.
- **Session Preservation**:
  - Retain current notes, settings, generated questions, and recall progress across reloads using `sessionStorage`.
- **PWA & Mobile-First Excellence**:
  - Installable PWA with service worker caching via `vite-plugin-pwa`.
  - In-app install button (`PWAInstallButton`) with Android/Chromium prompt and iOS Safari instructions.
  - Offline status indicator (`OfflineIndicator`).
  - Mobile touch targets (min 44px), dark mode styling with dark navy/charcoal background (`#0d1117` / `#161b22`) and elevated surface cards (`#1c2128` / `#21262d`), bold primary blue action accents, and zero teal.

## 3. Architecture & API Isolation
- **Backend (`server.ts`)**:
  - Express server on port 3000 running behind Vite in dev mode and static files in production.
  - `/api/generate-questions` endpoint using `@google/genai` with `gemini-3.5-flash-lite` (with `gemini-3.1-flash-lite` and `gemini-3.8-flash` resilient fallback).
  - Enforced safety settings: `{BLOCK_NONE}` on all categories.
  - JSON schema output parsing ensuring structured, reliable questions with question types and concise verified answers.
- **API Service Layer (`/src/services/aiService.ts`)**:
  - Abstracted client-side API contract isolating the AI provider so model or backend changes do not affect the UI components.
- **PWA Configuration**:
  - Web App Manifest configured in `vite.config.ts` and `index.html`.
  - SVG icon and responsive canvas-generated / standard PNG icons in `public/`.

## 4. Execution Steps & Verification Status
- [x] **1. Anchor files**: `Implementation_Plan.md` and `Reference_Notes.md` created and maintained.
- [x] **2. Metadata & HTML updates**: `metadata.json` updated with QuickRecall name, description, server-side Gemini capability; `index.html` updated with title, description, viewport, and PWA tags.
- [x] **3. Server implementation**: `server.ts` implemented with Express on port 3000, `@google/genai` integration with `BLOCK_NONE` safety settings on all harm categories, structured schema generation, and automatic resilience fallback.
- [x] **4. Update package.json scripts**: Updated `dev` to `tsx server.ts`, and `build` / `start` scripts for production bundle.
- [x] **5. Create PWA icons**: `icon.svg`, `pwa-192x192.png`, `pwa-512x512.png`, and `apple-touch-icon.png` generated and placed in `public/`.
- [x] **6. Configure Vite PWA**: Configured `VitePWA` in `vite.config.ts`, added `"vite-plugin-pwa/client"` in `tsconfig.json`.
- [x] **7. Client-side services & hooks**: Created isolated `aiService.ts`, `usePWAInstall.ts`, and `useOnlineStatus.ts`.
- [x] **8. UI Components**:
  - `Header`: Clean QuickRecall branding, tagline, in-app PWA install trigger.
  - `FileUploadArea`: Drag-and-drop & manual file selection, camera capture, thumbnail previews, PDF/image badges, and size limits.
  - `NoteInputForm`: Dual support for notes and uploaded files/diagrams, 5/10/20 count selector, Easy/Medium/Hard difficulty, sample notes and sample diagram helpers.
  - `QuestionCard`: Clean typography, question type badge (including new 'Diagram / Visual' badge), Show/Hide Answer toggle with smooth animated expansion, "I knew it" / "I need to revise" controls.
  - `FocusFlashcard`: Dynamic 1-card-at-a-time revision mode with smooth 3D flip/slide transitions, keyboard hotkeys (`Space`, `1`, `2`, `←`, `→`), and visual stepper dots.
  - `CompletionBanner`: Dynamic celebration card with mastery retention score, drill-missed questions action, and reset marks.
  - `ImagePreviewModal`: Interactive tap-to-zoom diagram/photo modal for inspecting visual details during active recall.
  - `QuestionList`: Dual mode toggle (Focus Mode vs List View), dynamic progress bar, filter pills (including Diagrams filter), Regenerate and Edit Notes actions.
  - `Footer`: Clean dark mode footer featuring real link to `buymeacoffee.com/tanchixd`.
  - `OfflineIndicator`: Non-intrusive banner on connection loss.
- [x] **9. Multimodal & Diagram Support**:
  - Multimodal inlineData parts in `@google/genai` generateContent payload supporting PDFs, photos, textbook scans, and hand-drawn diagrams.
  - System prompt emphasizing visual structure, step sequences, component labeling, and diagram questions with `type: "diagram"`.
  - Body parser configured with 40MB limit for rich media payloads.
- [x] **10. Dynamic UI & Motion Integration**:
  - `motion/react` spring animations for view transitions, pill selectors with `layoutId`, smooth answer accordions, and interactive tactile micro-interactions.
- [x] **11. Verification**:
  - Linting (`lint_applet`) verification passed.
  - Build compilation (`compile_applet`) verification passed.
  - Multimodal test requests and live endpoint checks.
- [x] **12. Firebase Integration (Auth & Cloud Firestore)**:
  - Provisioned Firebase Firestore & Auth in project `marine-design-46pck` (`asia-southeast1`).
  - Created Intermediate Representation schema `firebase-blueprint.json` (UserProfile, RevisionSet).
  - Drafted and verified `security_spec.md` with 12 dirty dozen threat models.
  - Deployed hardened security rules `firestore.rules` adhering to all 8 pillars (master gate, default-deny, immutable timestamps/owners, volumetric boundaries).
  - Implemented `src/lib/firebase.ts` with connection verification test and `handleFirestoreError`.
  - Implemented `AuthProvider` and `useAuth` hook (`src/context/AuthContext.tsx`) with Google Sign-In, real-time Firestore listeners, and cumulative learning stats.
  - Added `SavedSetsModal.tsx` for browsing, searching, and launching saved revision sets.
  - Added in-revision "Save to Cloud" and automatic progress sync.
- [x] **13. Runtime Stability & Startup Audit**:
  - Removed unauthenticated startup connection test query to eliminate permission-denied console warnings.
  - Restarted Vite development server to ensure newly installed packages and modules are fully pre-bundled.
  - Verified clean compilation through `lint_applet` and `compile_applet`.
- [x] **14. Diagram Generation & Source Diagram Active-Recall Labeling**:
  - Extended `types.ts` with `DiagramPin`, `RevisionDiagram`, `DiagramMode`, and question labeling properties (`targetMarker`, `targetLabel`, `isLabelingQuestion`).
  - Updated `firebase-blueprint.json` and `firestore.rules` to permit optional `diagram` in `RevisionSet`, and deployed with `deploy_firebase`.
  - Updated `server.ts` generation schema and Gemini prompt to generate standalone high-contrast dark-theme SVG diagrams with numbered pins (`[1]`, `[2]`, `[3]`), or map coordinates onto uploaded source diagram images.
  - Created interactive `DiagramViewer.tsx` component with pulse-highlighting for the active target marker, masked recall mode vs revealed mode, pin click tooltips, and zoom modal.
  - Integrated `DiagramViewer` into `QuestionCard.tsx` and `FocusFlashcard.tsx` so students can test their recall on the diagram with instant visual feedback upon revealing the answer.
  - Added Diagram Mode controls (`Auto (Smart)`, `Always Generate`, `Text Only`) and quick diagram sample presets in `NoteInputForm.tsx`.
  - Added interactive diagram modal inspector in `QuestionList.tsx` for full diagram exploration.
  - Verified with `lint_applet`, `compile_applet`, and `deploy_firebase`.
- [x] **15. Repository Documentation**:
  - Created root `README.md` detailing application overview, key features (multimodal ingestion, active-recall question engine, interactive diagram pin labeling, dual study modes, Anki/PDF exports, Firebase cloud sync), architecture stack, directory structure, and setup instructions.
- [x] **16. Fix Server 404 Error on Generate**:
  - Identified root causes: route naming mismatch (`/api/generate` vs `/api/generate-questions`), missing CORS/OPTIONS handling in Express, and aggressive service worker development interception.
  - Added route aliases for `['/api/generate-questions', '/api/generate', '/api/generate-questions/', '/api/generate/']` in `server.ts`.
  - Added endpoint fallback retry in `src/services/aiService.ts`.
  - Updated `vite.config.ts` Workbox configuration with `navigateFallbackDenylist: [/^\/api/]` and disabled development service worker generation.
  - Added clean unregistration script in `index.html` for any stale service workers.
  - Verified with live curl tests returning 200/400 (no 404), lint, and build.


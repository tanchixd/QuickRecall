# Reference Notes - QuickRecall

## 1. Safety Settings Specification
Per hard requirement, all safety settings must be explicitly set to `{BLOCK_NONE}` in all `@google/genai` calls:
```typescript
import { HarmCategory, HarmBlockThreshold } from '@google/genai';

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
];
```

## 2. API Contract & Schema
Endpoint: `POST /api/generate-questions`
Request Body:
```json
{
  "notes": "string (optional if files attached)",
  "topic": "string (optional)",
  "questionCount": 5 | 10 | 20,
  "difficulty": "Easy" | "Medium" | "Hard",
  "files": [
    {
      "name": "diagram.png",
      "mimeType": "image/png" | "application/pdf",
      "base64Data": "base64String..."
    }
  ]
}
```

Response:
```json
{
  "success": true,
  "topic": "string",
  "questions": [
    {
      "id": "q1",
      "question": "In the provided diagram of..., what does label A represent?",
      "answer": "Concise, accurate answer directly grounded in the notes or visual diagram.",
      "type": "conceptual" | "definition" | "cause_effect" | "factual" | "application" | "diagram"
    }
  ],
  "insufficient": false,
  "insufficientReason": "Optional message when material lacks sufficient factual/visual depth"
}
```

## 3. UI/UX Rules & Color Tokens
- Background: `#0f141c` / `#0d1117` (Dark Charcoal/Navy)
- Surface: `#161b22` / `#19202c` (Elevated Card/Container)
- Surface Hover / Active: `#21262d` / `#222b3a`
- Border: `#30363d` / `#2d3748`
- Primary Action: `#2563eb` (Royal Blue) / Hover `#1d4ed8`
- Text Primary: `#f0f6fc` / `#f1f5f9` (High contrast)
- Text Muted: `#8b949e` / `#94a3b8` (Slate 400)
- "I knew it": `#10b981` (Emerald) or `#22c55e` (Green)
- "I need to revise": `#ef4444` (Primary Red)
- Zero Teal: No `#14b8a6`, `#0d9488`, etc.
- Creator support footer: `https://buymeacoffee.com/tanchixd`
- Typography: Clean modern sans-serif with strong hierarchy.
- Minimum touch targets: 44px on interactive controls.
- All icons from `lucide-react`, default 24px or scaled appropriately with crisp tap targets.

## 4. Firebase Architecture & Firestore Schemas
- **Project ID**: `marine-design-46pck`
- **Region**: `asia-southeast1`
- **Firestore Database ID**: `ai-studio-quickrecall-8de0b09d-305e-432a-8531-2d7a945f3dcf`
- **Document Paths**:
  - `/users/{userId}`: User profile document with learning stats (`totalQuestionsGenerated`, `totalReviewed`, `totalMastered`).
  - `/users/{userId}/revision_sets/{setId}`: User's saved active-recall revision question sets.
- **Security Pillars**:
  - PII isolation & Master gate (`request.auth.uid == userId`).
  - Strict key allowlist via `isValidUserProfile` and `isValidRevisionSet`.
  - Immutable IDs, ownership, and creation timestamps (`createdAt == request.time`).
  - Volumetric bounds on topics (≤200 chars) and question counts (1 to 50).
  - Default-deny catch-all rule on `{document=**}`.

## 5. Diagram Generation & Labeling Architecture
- **Modes**:
  - `auto`: Uses uploaded source diagrams or generates schematic if topic is anatomical/process-based.
  - `always_generate`: Forces generation of visual SVG diagram and active-recall labeling questions even for text-only inputs.
  - `none`: Textual questions only.
- **Diagram Pin Schema**:
  - `marker`: Numbered string ("1", "2", "3") or letter ("A", "B").
  - `label`: Full anatomical/process name (e.g. "Axon terminal", "Thylakoid").
  - `x`, `y`: Relative percentage (0-100) on canvas or source image.
  - `description`: Crisp recall explanation.
- **Active Recall Logic**:
  - In Recall mode, diagram markers only show the badge/number (`[1]`, `[2]`).
  - Active question pulses its target marker with a luminous ring.
  - Revealing the answer illuminates the exact label in emerald green with complete explanation.


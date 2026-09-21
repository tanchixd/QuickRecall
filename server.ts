import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '40mb' }));
app.use(express.urlencoded({ extended: true, limit: '40mb' }));

// CORS & Preflight middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get(['/api/health', '/api/health/'], (req, res) => {
  res.json({ status: 'ok', app: 'QuickRecall' });
});

interface UploadedFilePayload {
  name: string;
  mimeType: string;
  base64Data: string;
}

// API endpoints for generating active-recall revision questions (supports text, PDF, photos, generated diagrams, and source labeling)
const GENERATE_ROUTES = ['/api/generate-questions', '/api/generate', '/api/generate-questions/', '/api/generate/'];

app.post(GENERATE_ROUTES, async (req, res) => {
  try {
    const {
      notes,
      topic,
      questionCount = 10,
      difficulty = 'Medium',
      diagramMode = 'auto',
      files,
    } = req.body;

    const trimmedNotes = typeof notes === 'string' ? notes.trim() : '';
    const uploadedFiles: UploadedFilePayload[] = Array.isArray(files) ? files : [];

    // Ensure at least notes or an uploaded document/photo is provided
    if (!trimmedNotes && uploadedFiles.length === 0) {
      return res.status(400).json({
        error: 'Please provide study notes or upload a PDF/photo to generate questions.',
      });
    }

    // Quick sanity check: if only text is provided and it is ridiculously short
    if (uploadedFiles.length === 0 && trimmedNotes.length < 15) {
      return res.json({
        insufficient: true,
        insufficientReason: 'The provided notes are too brief to generate meaningful revision questions. Please paste more detailed study material or upload a document/photo.',
        topic: topic || 'General',
        questions: [],
      });
    }

    const validCounts = [5, 10, 20];
    const targetCount = validCounts.includes(Number(questionCount)) ? Number(questionCount) : 10;
    const targetDifficulty = ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium';
    const effectiveDiagramMode = ['auto', 'always_generate', 'none'].includes(diagramMode) ? diagramMode : 'auto';

    const hasUploadedImages = uploadedFiles.some((f) => f.mimeType.startsWith('image/'));
    const ai = getGeminiClient();

    const systemInstruction = `You are QuickRecall's specialized Active-Recall Question & Educational Diagram Generator for students.
Your mission is to convert a student's study material—whether typed notes, lecture summaries, textbooks, PDFs, photos, or diagrams—into high-quality active-recall revision questions and interactive diagram labeling exercises.

Core principles:
1. TEST RECALL & DEEP UNDERSTANDING: Do NOT just copy or regurgitate sentences. Formulate questions that require the student to retrieve knowledge from memory.
2. DIVERSE QUESTION TYPES:
   - "conceptual": Tests underlying mechanisms, principles, why something works the way it does.
   - "definition": Tests precise terminology, key concepts, or distinctions without being purely rote.
   - "cause_effect": Tests what leads to what, triggers, outcomes, consequences.
   - "factual": Tests crucial facts, formulas, components, steps, or rules.
   - "application": Tests scenarios, troubleshooting, real-world execution, or applying the rule.
   - "diagram": Explicitly tests visual diagrams, schematics, anatomical structures, flowcharts, cycles, or labeled figures.
3. VISUAL DIAGRAMS & ACTIVE-RECALL LABELING:
   Mode: ${effectiveDiagramMode}. Has uploaded images: ${hasUploadedImages}.
   - If diagramMode is 'always_generate', OR if uploaded images contain a diagram, OR if diagramMode is 'auto' and the topic/material has visual, anatomical, process, or architectural components:
     * Provide a "diagram" object in your response.
     * OPTION A - If student uploaded photos/diagrams: Set "type": "source_image", set "sourceFileIndex": 0, and identify 3-6 key regions/structures with percentage coordinates (x: 10-90, y: 10-90) pointing to parts, providing markers "1", "2", "3", etc.
     * OPTION B - If no image or if generating a fresh diagram: Generate a complete, standalone, high-contrast SVG diagram in "svgData".
       - Format: <svg viewBox="0 0 600 360" xmlns="http://www.w3.org/2000/svg">...</svg>.
       - Design palette: Dark modern slate background (<rect width="100%" height="100%" fill="#0d1117" rx="12"/>), clean distinct colored anatomical/functional shapes (e.g. #1e293b, #2563eb, #10b981, #f59e0b, #ec4899), clear connecting lines or membranes with stroke, and prominent numbered circular pin markers:
         e.g. <circle cx="120" cy="140" r="14" fill="#2563eb" stroke="#93c5fd" stroke-width="2"/><text x="120" y="140" fill="#ffffff" font-size="12" font-weight="bold" text-anchor="middle" dominant-baseline="central">1</text>
       - Place 3 to 6 numbered pin badges ("1", "2", "3", "4"...) clearly marking the essential structures or steps.
       - Provide the matching "pins" list with marker, correct label name, x/y percentage coordinates (x = cx/600 * 100, y = cy/360 * 100), and concise functional description.
   - DIAGRAM LABELING QUESTIONS:
     When a diagram is provided, generate 2 to 4 questions of type "diagram" with "isLabelingQuestion": true, "targetMarker": "1" (or "2", "3"), and "targetLabel": "[Name of Structure]".
     Example question: "In the diagram, what is the structure/component designated by marker [1], and what is its primary function?"
     Answer: "Dendrites. They receive electrochemical input from other neurons and propagate the signal toward the soma."
4. GROUNDED IN PROVIDED MATERIAL: Every question and answer MUST be supported by the provided notes or uploaded documents/photos. Never hallucinate unsupported facts.
5. CONCISE, ACCURATE ANSWERS: Answers must be clear, crisp, and direct (1-3 sentences or bullet points) so the student can immediately self-evaluate whether they recalled correctly.
6. TARGET DIFFICULTY (${targetDifficulty}):
   - Easy: Core definitions, direct visual labels, foundational relationships.
   - Medium: Conceptual synthesis, cause/effect, diagram mechanisms, key distinctions, application.
   - Hard: Subtle mechanisms, multi-step diagram tracing, deep cause/effect chains, multi-concept integration.
7. TARGET COUNT: Exactly ${targetCount} questions unless content is insufficient.`;

    // Construct prompt and multimodal contents
    const promptIntro = `Student's Study Material:${topic ? `\n[Topic/Subject: ${topic}]` : ''}${
      trimmedNotes ? `\n\nStudy Notes:\n${trimmedNotes}` : ''
    }${
      uploadedFiles.length > 0
        ? `\n\n[Attached: ${uploadedFiles.length} file(s) - including photos, diagrams, or PDF document pages. Analyze the visual diagrams, figures, and textual information thoroughly.]`
        : ''
    }\n\nPlease generate exactly ${targetCount} active-recall revision questions at ${targetDifficulty} difficulty based strictly on the material above. Diagram mode requested: ${effectiveDiagramMode}.${
      effectiveDiagramMode !== 'none'
        ? ' Include an educational diagram (generated SVG or mapped source image) with numbered pins [1], [2], [3] and corresponding diagram labeling recall questions.'
        : ''
    }`;

    const contents: any[] = [promptIntro];

    // Append file parts as inlineData
    for (const file of uploadedFiles) {
      if (file.base64Data && file.mimeType) {
        // Strip out any data URL scheme if present (e.g. data:image/png;base64,...)
        const cleanBase64 = file.base64Data.includes(',')
          ? file.base64Data.split(',')[1]
          : file.base64Data;

        contents.push({
          inlineData: {
            mimeType: file.mimeType,
            data: cleanBase64,
          },
        });
      }
    }

    // Strict safety settings: BLOCK_NONE per mandate
    const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_CIVIC_INTEGRITY, threshold: HarmBlockThreshold.BLOCK_NONE },
    ];

    const generateConfig = {
      systemInstruction,
      temperature: 0.3,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          insufficient: {
            type: Type.BOOLEAN,
            description: 'True if the notes or uploaded images/PDFs lack sufficient factual depth, are illegible, or are nonsensical.',
          },
          insufficientReason: {
            type: Type.STRING,
            description: 'Explanation if the notes were insufficient or image was unreadable.',
          },
          topic: {
            type: Type.STRING,
            description: 'Identified or provided topic title.',
          },
          diagram: {
            type: Type.OBJECT,
            description: 'Educational diagram with labeled pins/markers. Required if diagramMode is always_generate or if visual/anatomical diagram exists in uploaded files or topic.',
            properties: {
              hasDiagram: { type: Type.BOOLEAN },
              title: { type: Type.STRING, description: 'Title of the diagram or schematic' },
              type: {
                type: Type.STRING,
                description: '"generated_svg" for newly generated SVG graphic, or "source_image" when referencing an uploaded photo/document',
              },
              sourceFileIndex: {
                type: Type.INTEGER,
                description: '0-based index of the uploaded file if type is source_image',
              },
              svgData: {
                type: Type.STRING,
                description: 'Complete, valid standalone SVG markup with viewBox="0 0 600 360", dark theme styling, and numbered circular pin badges [1], [2], [3] matching the pins array.',
              },
              pins: {
                type: Type.ARRAY,
                description: 'Numbered markers on the diagram for interactive recall testing',
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING, description: 'e.g. pin-1' },
                    marker: { type: Type.STRING, description: 'Pin number or symbol, e.g. "1", "2", "3"' },
                    label: { type: Type.STRING, description: 'Exact anatomical or structural name, e.g. "Axon Hillock"' },
                    x: { type: Type.NUMBER, description: 'Horizontal position in percentage (0 to 100)' },
                    y: { type: Type.NUMBER, description: 'Vertical position in percentage (0 to 100)' },
                    description: { type: Type.STRING, description: 'Concise summary of function or role' },
                  },
                  required: ['id', 'marker', 'label', 'x', 'y'],
                },
              },
            },
            required: ['hasDiagram', 'title', 'type', 'pins'],
          },
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
                type: {
                  type: Type.STRING,
                  description: 'One of: conceptual, definition, cause_effect, factual, application, diagram',
                },
                targetMarker: {
                  type: Type.STRING,
                  description: 'If type is diagram, the pin marker being tested, e.g. "1", "2"',
                },
                targetLabel: {
                  type: Type.STRING,
                  description: 'If type is diagram, the correct label name of the marked structure',
                },
                isLabelingQuestion: {
                  type: Type.BOOLEAN,
                  description: 'True if this question specifically tests identification of a diagram marker',
                },
              },
              required: ['id', 'question', 'answer', 'type'],
            },
          },
        },
        required: ['insufficient', 'topic', 'questions'],
      },
      safetySettings,
    };

    // Candidate models strictly supported by @google/genai SDK (prioritize fast, stable models)
    const candidateModels = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let response: any = null;
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`Attempting question generation with model: ${modelName}...`);
        response = await ai.models.generateContent({
          model: modelName,
          contents,
          config: generateConfig,
        });
        if (response && response.text) {
          console.log(`Successfully generated content using ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`Model ${modelName} encountered error:`, err?.message || err);
        lastError = err;
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error('No response received from Gemini model.');
    }

    let responseText = response.text.trim();
    if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '').trim();
    }
    if (!responseText) {
      throw new Error('No response received from Gemini.');
    }

    const parsed = JSON.parse(responseText);

    let diagram = null;
    if (parsed.diagram && (parsed.diagram.hasDiagram || parsed.diagram.svgData || (Array.isArray(parsed.diagram.pins) && parsed.diagram.pins.length > 0))) {
      const dType = parsed.diagram.type === 'source_image' && uploadedFiles.length > 0 ? 'source_image' : 'generated_svg';
      let svgData = typeof parsed.diagram.svgData === 'string' ? parsed.diagram.svgData.trim() : '';
      if (svgData.startsWith('```')) {
        svgData = svgData.replace(/^```(?:svg|xml)?\s*/i, '').replace(/```\s*$/, '').trim();
      }

      let sourceImageBase64: string | undefined = undefined;
      if (dType === 'source_image') {
        const fileIdx = typeof parsed.diagram.sourceFileIndex === 'number' && parsed.diagram.sourceFileIndex < uploadedFiles.length
          ? parsed.diagram.sourceFileIndex
          : 0;
        const targetFile = uploadedFiles[fileIdx];
        if (targetFile) {
          sourceImageBase64 = targetFile.base64Data.startsWith('data:')
            ? targetFile.base64Data
            : `data:${targetFile.mimeType};base64,${targetFile.base64Data}`;
        }
      }

      diagram = {
        id: `diag-${Date.now()}`,
        title: parsed.diagram.title || topic || 'Visual Study Diagram',
        type: dType,
        svgData,
        sourceImageBase64,
        sourceFileIndex: parsed.diagram.sourceFileIndex,
        pins: Array.isArray(parsed.diagram.pins)
          ? parsed.diagram.pins.map((p: any, idx: number) => ({
              id: p.id || `pin-${idx + 1}`,
              marker: String(p.marker || idx + 1),
              label: p.label || `Component ${idx + 1}`,
              x: typeof p.x === 'number' ? Math.max(2, Math.min(98, p.x)) : 50,
              y: typeof p.y === 'number' ? Math.max(2, Math.min(98, p.y)) : 50,
              description: p.description || '',
            }))
          : [],
      };
    }

    // Normalize questions and associate diagram with labeling questions
    if (Array.isArray(parsed.questions)) {
      parsed.questions = parsed.questions.map((q: any, index: number) => {
        const isDiag = q.type === 'diagram' || !!q.isLabelingQuestion || !!q.targetMarker;
        return {
          id: q.id || `q-${index + 1}-${Date.now()}`,
          question: q.question,
          answer: q.answer,
          type: isDiag ? 'diagram' : (q.type || 'conceptual'),
          targetMarker: q.targetMarker ? String(q.targetMarker) : undefined,
          targetLabel: q.targetLabel || undefined,
          isLabelingQuestion: !!q.isLabelingQuestion || !!q.targetMarker,
          diagram: isDiag && diagram ? diagram : undefined,
        };
      });
    }

    return res.json({
      success: true,
      insufficient: !!parsed.insufficient,
      insufficientReason: parsed.insufficientReason || '',
      topic: parsed.topic || topic || 'Study Notes',
      diagram,
      questions: parsed.questions || [],
    });
  } catch (error: any) {
    console.error('Error generating questions:', error);

    let cleanMessage = 'Failed to generate questions. Please try again.';
    if (error && error.message) {
      try {
        const parsed = JSON.parse(error.message);
        if (parsed?.error?.message) {
          cleanMessage = parsed.error.message;
        } else if (parsed?.message) {
          cleanMessage = parsed.message;
        } else {
          cleanMessage = error.message;
        }
      } catch {
        cleanMessage = error.message;
      }
    }

    if (cleanMessage.includes('503') || cleanMessage.toLowerCase().includes('high demand')) {
      cleanMessage = 'The AI model is momentarily experiencing high demand. Please click Generate again in a few seconds.';
    }

    return res.status(500).json({
      error: cleanMessage,
    });
  }
});

async function startServer() {
  // In development, Vite runs as middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve static files from dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QuickRecall server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();

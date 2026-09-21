export type QuestionType = 'conceptual' | 'definition' | 'cause_effect' | 'factual' | 'application' | 'diagram';

export type RecallStatus = 'unreviewed' | 'knew' | 'revise';

export interface DiagramPin {
  id: string; // e.g. "pin-1"
  marker: string; // e.g. "1", "2", "3", "A", "B"
  label: string; // e.g. "Axon terminal", "Mitochondrial Matrix"
  x?: number; // 0 - 100 percentage position across diagram width
  y?: number; // 0 - 100 percentage position across diagram height
  description?: string; // Concise role or function for study card
}

export interface RevisionDiagram {
  id: string;
  title: string;
  type: 'generated_svg' | 'source_image';
  svgData?: string; // Valid, high-contrast SVG markup optimized for dark theme
  sourceImageBase64?: string; // Data URL or base64 data for uploaded diagram
  sourceFileIndex?: number;
  pins: DiagramPin[];
}

export interface RevisionQuestion {
  id: string;
  question: string;
  answer: string;
  type: QuestionType;
  recallStatus?: RecallStatus;
  isAnswerRevealed?: boolean;
  // Diagram labeling properties
  diagram?: RevisionDiagram;
  targetMarker?: string; // Marker being tested (e.g. "1", "2")
  targetLabel?: string; // Correct anatomical or process label
  isLabelingQuestion?: boolean;
}

export type QuestionCount = 5 | 10 | 20;
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type DiagramMode = 'auto' | 'always_generate' | 'none';

export interface GenerationSettings {
  questionCount: QuestionCount;
  difficulty: Difficulty;
  diagramMode?: DiagramMode;
}

export interface UploadFileItem {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  base64Data: string;
  previewUrl?: string;
}

export interface GenerateQuestionsPayload {
  notes?: string;
  topic?: string;
  questionCount: QuestionCount;
  difficulty: Difficulty;
  diagramMode?: DiagramMode;
  files?: Array<{
    name: string;
    mimeType: string;
    base64Data: string;
  }>;
}

export interface GenerateQuestionsResponse {
  success: boolean;
  insufficient: boolean;
  insufficientReason?: string;
  topic: string;
  diagram?: RevisionDiagram | null;
  questions: RevisionQuestion[];
  error?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  totalQuestionsGenerated?: number;
  totalReviewed?: number;
  totalMastered?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SavedRevisionSet {
  id: string;
  ownerId: string;
  topic: string;
  difficulty: Difficulty;
  questionCount: number;
  knewCount?: number;
  reviseCount?: number;
  questions: RevisionQuestion[];
  diagram?: RevisionDiagram | null;
  createdAt: string;
  updatedAt: string;
}

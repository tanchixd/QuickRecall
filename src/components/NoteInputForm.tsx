import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Loader2,
  AlertCircle,
  FileText,
  ArrowRight,
  Layers,
  FileUp,
  PenTool,
} from 'lucide-react';
import { Difficulty, QuestionCount, DiagramMode, UploadFileItem } from '../types';
import { FileUploadArea } from './FileUploadArea';

interface NoteInputFormProps {
  initialNotes?: string;
  initialTopic?: string;
  initialQuestionCount?: QuestionCount;
  initialDifficulty?: Difficulty;
  initialDiagramMode?: DiagramMode;
  initialFiles?: UploadFileItem[];
  isGenerating: boolean;
  onGenerate: (data: {
    notes: string;
    topic: string;
    questionCount: QuestionCount;
    difficulty: Difficulty;
    diagramMode: DiagramMode;
    files: UploadFileItem[];
  }) => void;
  error?: string | null;
}

const SAMPLE_NOTES = `Photosynthesis is the biological process used by plants, algae, and cyanobacteria to convert light energy into chemical energy stored in glucose. 

Equation: 6CO2 + 6H2O + light -> C6H12O6 + 6O2.

It occurs in two main phases:
1. Light-Dependent Reactions (in the thylakoid membranes of chloroplasts): Chlorophyll absorbs photons, exciting electrons. Water molecules are split (photolysis) releasing oxygen gas as a byproduct, and producing ATP and NADPH.
2. Light-Independent Reactions / Calvin Cycle (in the stroma): ATP and NADPH provide energy and reducing power to fix carbon dioxide (via the enzyme RuBisCO) into 3-carbon sugars (G3P), which later synthesize glucose.

Factors affecting rate: Light intensity, carbon dioxide concentration, and temperature (enzyme denaturation above optimal temperatures).`;

const SAMPLE_DIAGRAM_NOTES = `Mitochondrion Structure & Chemiosmosis Diagram

Key Anatomical Components & Visual Regions:
1. Outer Membrane: Smooth lipid bilayer with porin channels.
2. Intermembrane Space: Acidic compartment where H+ protons accumulate to create an electrochemical proton gradient (Proton Motive Force).
3. Inner Mitochondrial Membrane (Cristae): Deeply convoluted folds that maximize surface area for Electron Transport Chain (ETC) complexes I-IV and ATP Synthase rotary motors.
4. Mitochondrial Matrix: Central aqueous compartment housing the Citric Acid (Krebs) cycle enzymes, pyruvate dehydrogenase complex, 70S ribosomes, and circular mitochondrial DNA (mtDNA).

Visual Flow & Reaction Sequence:
- Pyruvate moves across membranes -> Decarboxylated to Acetyl-CoA in matrix.
- Krebs cycle generates NADH and FADH2 electron carriers.
- Electrons travel through ETC complexes I -> III -> IV, reducing O2 to H2O at Complex IV.
- Protons pumped from Matrix -> Intermembrane Space.
- Protons flow back down gradient into matrix through ATP Synthase (F0F1), driving ATP synthesis.`;

const LOADING_PHRASES = [
  'Analyzing notes & visual material...',
  'Extracting core concepts & diagram labels...',
  'Synthesizing active-recall revision questions...',
  'Calibrating question difficulty...',
];

export const NoteInputForm: React.FC<NoteInputFormProps> = ({
  initialNotes = '',
  initialTopic = '',
  initialQuestionCount = 10,
  initialDifficulty = 'Medium',
  initialDiagramMode = 'auto',
  initialFiles = [],
  isGenerating,
  onGenerate,
  error,
}) => {
  const [notes, setNotes] = useState(initialNotes);
  const [topic, setTopic] = useState(initialTopic);
  const [questionCount, setQuestionCount] = useState<QuestionCount>(initialQuestionCount);
  const [difficulty, setDifficulty] = useState<Difficulty>(initialDifficulty);
  const [diagramMode, setDiagramMode] = useState<DiagramMode>(initialDiagramMode);
  const [files, setFiles] = useState<UploadFileItem[]>(initialFiles);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);

  const charCount = notes.trim().length;
  const wordCount = notes.trim() ? notes.trim().split(/\s+/).length : 0;
  const hasFiles = files.length > 0;

  // Cycle loading phrases dynamically while generating
  useEffect(() => {
    if (!isGenerating) {
      setLoadingPhraseIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingPhraseIndex((prev) => (prev + 1) % LOADING_PHRASES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNotes = notes.trim();

    if (!trimmedNotes && !hasFiles) {
      setValidationMsg('Please paste study notes or upload a PDF/photo to generate questions.');
      return;
    }

    if (!hasFiles && trimmedNotes.length < 20) {
      setValidationMsg('Please provide a bit more content so meaningful recall questions can be generated.');
      return;
    }

    setValidationMsg(null);
    onGenerate({
      notes: trimmedNotes,
      topic: topic.trim(),
      questionCount,
      difficulty,
      diagramMode,
      files,
    });
  };

  const handlePasteSampleNotes = () => {
    setTopic('Biology: Photosynthesis');
    setNotes(SAMPLE_NOTES);
    setDiagramMode('auto');
    setValidationMsg(null);
  };

  const handlePasteDiagramNotes = () => {
    setTopic('Cell Biology: Mitochondria Diagram');
    setNotes(SAMPLE_DIAGRAM_NOTES);
    setDiagramMode('always_generate');
    setValidationMsg(null);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Optional Topic Input */}
        <div>
          <label
            htmlFor="topic-input"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5"
          >
            Topic or Subject <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>
          <div className="relative">
            <input
              id="topic-input"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Neuroscience: Action Potential, Biochemistry, World History"
              disabled={isGenerating}
              className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-3 text-sm text-slate-100 placeholder-slate-400 focus:border-blue-500 focus:outline-hidden transition disabled:opacity-50"
            />
          </div>
        </div>

        {/* Section 1: Upload PDF / Photo / Diagram */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <FileUp className="w-3.5 h-3.5 text-blue-400" />
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Upload Material (PDF / Photo / Diagram)
              </label>
            </div>
            {hasFiles && (
              <span className="text-xs text-blue-400 font-medium">
                {files.length} file{files.length === 1 ? '' : 's'} attached
              </span>
            )}
          </div>

          <FileUploadArea
            files={files}
            onFilesChange={(newFiles) => {
              setFiles(newFiles);
              if (validationMsg) setValidationMsg(null);
            }}
            disabled={isGenerating}
          />
        </div>

        {/* Section 2: Study Notes Text Input */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5">
              <PenTool className="w-3.5 h-3.5 text-slate-400" />
              <label
                htmlFor="notes-textarea"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                Study Notes {hasFiles ? <span className="text-slate-400 font-normal lowercase">(optional with upload)</span> : ''}
              </label>
            </div>

            <div className="flex items-center gap-3">
              {!notes && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="sample-notes-btn"
                    onClick={handlePasteSampleNotes}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Sample notes</span>
                  </button>
                  <span className="text-slate-400">•</span>
                  <button
                    type="button"
                    id="sample-diagram-btn"
                    onClick={handlePasteDiagramNotes}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium transition cursor-pointer flex items-center gap-1"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Sample diagram</span>
                  </button>
                </div>
              )}
              {notes && (
                <span className="text-[11px] text-slate-400 font-mono">
                  {wordCount} {wordCount === 1 ? 'word' : 'words'} · {charCount} chars
                </span>
              )}
            </div>
          </div>

          <div className="relative rounded-2xl bg-slate-900 border border-slate-800 focus-within:border-blue-500 transition shadow-inner">
            <textarea
              id="notes-textarea"
              rows={6}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (validationMsg) setValidationMsg(null);
              }}
              placeholder={
                hasFiles
                  ? "Optional: Add any specific concepts, definitions, or instructions you want the questions to focus on..."
                  : "Paste lecture notes, textbook excerpts, definitions, or study summaries here..."
              }
              disabled={isGenerating}
              className="w-full rounded-2xl bg-transparent p-4 text-sm text-slate-100 placeholder-slate-400 focus:outline-hidden resize-y min-h-[160px] leading-relaxed disabled:opacity-50"
            />

            {notes && (
              <div className="flex justify-end p-2 border-t border-slate-800/60">
                <button
                  type="button"
                  id="clear-notes-btn"
                  onClick={() => setNotes('')}
                  disabled={isGenerating}
                  className="text-xs text-slate-400 hover:text-slate-300 px-2 py-1 rounded transition cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Dynamic Generation Settings Controls */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Number of questions control */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Number of Questions
              </span>
              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-950/70 border border-slate-800/80" role="group" aria-label="Number of questions">
                {([5, 10, 20] as QuestionCount[]).map((count) => {
                  const isSelected = questionCount === count;
                  return (
                    <button
                      key={count}
                      id={`count-btn-${count}`}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setQuestionCount(count)}
                      className={`relative h-10 rounded-lg text-sm font-semibold transition cursor-pointer flex items-center justify-center ${
                        isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                      } disabled:opacity-50`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="active-count-indicator"
                          className="absolute inset-0 rounded-lg bg-blue-600 shadow-sm"
                          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        />
                      )}
                      <span className="relative z-10">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Difficulty control */}
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Difficulty
              </span>
              <div className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-950/70 border border-slate-800/80" role="group" aria-label="Question difficulty">
                {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => {
                  const isSelected = difficulty === level;
                  return (
                    <button
                      key={level}
                      id={`diff-btn-${level.toLowerCase()}`}
                      type="button"
                      disabled={isGenerating}
                      onClick={() => setDifficulty(level)}
                      className={`relative h-10 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer flex items-center justify-center ${
                        isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                      } disabled:opacity-50`}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="active-diff-indicator"
                          className="absolute inset-0 rounded-lg bg-blue-600 shadow-sm"
                          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        />
                      )}
                      <span className="relative z-10">{level}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Visual Diagram & Labeling Mode control */}
          <div className="pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Visual Diagrams & Active Labeling
                </span>
              </div>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Interactive markers [1], [2], [3]
              </span>
            </div>

            <div
              className="grid grid-cols-3 gap-2 p-1 rounded-xl bg-slate-950/70 border border-slate-800/80"
              role="group"
              aria-label="Diagram and labeling mode"
            >
              {[
                { id: 'auto', label: 'Auto (Smart)', desc: 'Detect from files/notes' },
                { id: 'always_generate', label: 'Always Generate', desc: 'Force visual diagram' },
                { id: 'none', label: 'Text Only', desc: 'No visual diagrams' },
              ].map((mode) => {
                const isSelected = diagramMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    id={`diagram-mode-btn-${mode.id}`}
                    type="button"
                    disabled={isGenerating}
                    onClick={() => setDiagramMode(mode.id as DiagramMode)}
                    className={`relative py-2 px-1 rounded-lg text-xs font-semibold transition cursor-pointer flex flex-col items-center justify-center text-center ${
                      isSelected ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                    } disabled:opacity-50`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="active-diagram-mode-indicator"
                        className="absolute inset-0 rounded-lg bg-blue-600 shadow-sm"
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                      />
                    )}
                    <span className="relative z-10 leading-tight">{mode.label}</span>
                    <span className="relative z-10 text-[10px] opacity-75 font-normal truncate max-w-full">
                      {mode.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error / Validation Feedback */}
        <AnimatePresence>
          {(validationMsg || error) && (
            <motion.div
              id="input-error-alert"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              className="flex items-start gap-3 rounded-xl bg-red-950/50 border border-red-800/50 p-3.5 text-xs text-red-200"
            >
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <p className="font-semibold text-red-300">Notice</p>
                <p className="text-red-200/90">{validationMsg || error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Generate Questions Button with animated states */}
        <motion.button
          whileTap={{ scale: 0.98 }}
          id="generate-questions-btn"
          type="submit"
          disabled={isGenerating}
          className="relative w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-blue-900/60 disabled:cursor-not-allowed text-white font-semibold text-base transition shadow-lg shadow-blue-950/50 flex items-center justify-center gap-2 cursor-pointer overflow-hidden"
        >
          {isGenerating ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-white" />
              <motion.span
                key={loadingPhraseIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm font-medium"
              >
                {LOADING_PHRASES[loadingPhraseIndex]}
              </motion.span>
            </div>
          ) : (
            <>
              <Sparkles className="w-5 h-5 text-blue-200" />
              <span>
                {hasFiles
                  ? `Generate Questions (${files.length} file${files.length === 1 ? '' : 's'})`
                  : 'Generate Questions'}
              </span>
              <ArrowRight className="w-4 h-4 opacity-80" />
            </>
          )}
        </motion.button>
      </form>
    </div>
  );
};

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Header } from './components/Header';
import { NoteInputForm } from './components/NoteInputForm';
import { QuestionList } from './components/QuestionList';
import { SavedSetsModal } from './components/SavedSetsModal';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Footer } from './components/Footer';
import { generateQuestions } from './services/aiService';
import { useAuth } from './context/AuthContext';
import {
  Difficulty,
  QuestionCount,
  RevisionQuestion,
  RecallStatus,
  UploadFileItem,
  SavedRevisionSet,
  RevisionDiagram,
  DiagramMode,
} from './types';
import { AlertTriangle, ArrowLeft } from 'lucide-react';

const STORAGE_KEYS = {
  NOTES: 'quickrecall_notes_v1',
  TOPIC: 'quickrecall_topic_v1',
  COUNT: 'quickrecall_count_v1',
  DIFFICULTY: 'quickrecall_diff_v1',
  QUESTIONS: 'quickrecall_questions_v1',
  DIAGRAM: 'quickrecall_diagram_v1',
  DIAGRAM_MODE: 'quickrecall_diag_mode_v1',
  VIEW: 'quickrecall_view_v1',
};

export default function App() {
  // Session-persisted state
  const [notes, setNotes] = useState<string>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.NOTES) || '';
    } catch {
      return '';
    }
  });

  const [topic, setTopic] = useState<string>(() => {
    try {
      return sessionStorage.getItem(STORAGE_KEYS.TOPIC) || '';
    } catch {
      return '';
    }
  });

  const [questionCount, setQuestionCount] = useState<QuestionCount>(() => {
    try {
      const saved = Number(sessionStorage.getItem(STORAGE_KEYS.COUNT));
      return [5, 10, 20].includes(saved) ? (saved as QuestionCount) : 10;
    } catch {
      return 10;
    }
  });

  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.DIFFICULTY);
      return ['Easy', 'Medium', 'Hard'].includes(saved || '')
        ? (saved as Difficulty)
        : 'Medium';
    } catch {
      return 'Medium';
    }
  });

  const [diagramMode, setDiagramMode] = useState<DiagramMode>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.DIAGRAM_MODE) as DiagramMode;
      return ['auto', 'always_generate', 'none'].includes(saved) ? saved : 'auto';
    } catch {
      return 'auto';
    }
  });

  const [diagram, setDiagram] = useState<RevisionDiagram | null>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.DIAGRAM);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [questions, setQuestions] = useState<RevisionQuestion[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.QUESTIONS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [view, setView] = useState<'input' | 'questions'>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEYS.VIEW);
      return saved === 'questions' ? 'questions' : 'input';
    } catch {
      return 'input';
    }
  });

  const [files, setFiles] = useState<UploadFileItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [insufficientNotice, setInsufficientNotice] = useState<string | null>(null);

  // Firebase Auth & Cloud Sync
  const {
    user,
    saveSet,
    updateSetProgress,
    recordGenerated,
    recordReviewed,
    signIn,
  } = useAuth();
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeCloudSetId, setActiveCloudSetId] = useState<string | null>(null);
  const [isSavingToCloud, setIsSavingToCloud] = useState(false);
  const [isCloudSaved, setIsCloudSaved] = useState(false);

  // Sync state to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEYS.NOTES, notes);
      sessionStorage.setItem(STORAGE_KEYS.TOPIC, topic);
      sessionStorage.setItem(STORAGE_KEYS.COUNT, String(questionCount));
      sessionStorage.setItem(STORAGE_KEYS.DIFFICULTY, difficulty);
      sessionStorage.setItem(STORAGE_KEYS.DIAGRAM_MODE, diagramMode);
      sessionStorage.setItem(STORAGE_KEYS.DIAGRAM, diagram ? JSON.stringify(diagram) : '');
      sessionStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
      sessionStorage.setItem(STORAGE_KEYS.VIEW, view);
    } catch (e) {
      console.warn('SessionStorage sync error:', e);
    }
  }, [notes, topic, questionCount, difficulty, diagramMode, diagram, questions, view]);

  const handleGenerate = async (params: {
    notes: string;
    topic: string;
    questionCount: QuestionCount;
    difficulty: Difficulty;
    diagramMode: DiagramMode;
    files: UploadFileItem[];
  }) => {
    setNotes(params.notes);
    setTopic(params.topic);
    setQuestionCount(params.questionCount);
    setDifficulty(params.difficulty);
    setDiagramMode(params.diagramMode);
    setFiles(params.files);
    setErrorMessage(null);
    setInsufficientNotice(null);
    setIsGenerating(true);

    try {
      const payloadFiles = params.files.map((f) => ({
        name: f.name,
        mimeType: f.mimeType,
        base64Data: f.base64Data,
      }));

      const result = await generateQuestions({
        notes: params.notes,
        topic: params.topic,
        questionCount: params.questionCount,
        difficulty: params.difficulty,
        diagramMode: params.diagramMode,
        files: payloadFiles.length > 0 ? payloadFiles : undefined,
      });

      if (result.insufficient) {
        setInsufficientNotice(
          result.insufficientReason ||
            'The uploaded material or notes lack sufficient factual or visual detail to form active-recall questions. Please provide clearer photos, diagrams, or notes.'
        );
        setIsGenerating(false);
        return;
      }

      if (!result.questions || result.questions.length === 0) {
        setErrorMessage(
          'No questions could be extracted from the material. Please check your notes or uploaded files and try again.'
        );
        setIsGenerating(false);
        return;
      }

      // Initialize all questions as answer-hidden and unreviewed
      const formattedQuestions: RevisionQuestion[] = result.questions.map((q) => ({
        ...q,
        isAnswerRevealed: false,
        recallStatus: 'unreviewed',
      }));

      setQuestions(formattedQuestions);
      setDiagram(result.diagram || null);
      if (result.topic && !params.topic) {
        setTopic(result.topic);
      }
      setActiveCloudSetId(null);
      setIsCloudSaved(false);
      if (user) {
        recordGenerated(formattedQuestions.length).catch((e) =>
          console.warn('Stats record error:', e)
        );
      }
      setView('questions');
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(
        err.message || 'An error occurred while generating questions. Please try again.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    if (!notes.trim() && files.length === 0) {
      setView('input');
      return;
    }
    handleGenerate({
      notes,
      topic,
      questionCount,
      difficulty,
      diagramMode,
      files,
    });
  };

  const handleToggleAnswer = (id: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, isAnswerRevealed: !q.isAnswerRevealed } : q
      )
    );
  };

  const handleToggleAllAnswers = (reveal: boolean) => {
    setQuestions((prev) =>
      prev.map((q) => ({ ...q, isAnswerRevealed: reveal }))
    );
  };

  const handleUpdateStatus = (id: string, status: RecallStatus) => {
    setQuestions((prev) => {
      const updated = prev.map((q) => (q.id === id ? { ...q, recallStatus: status } : q));

      if (user) {
        // Record review stats
        const wasKnew = prev.find((q) => q.id === id)?.recallStatus === 'knew';
        const isNowKnew = status === 'knew';
        const masteredDelta = !wasKnew && isNowKnew ? 1 : wasKnew && !isNowKnew ? -1 : 0;
        recordReviewed(1, masteredDelta).catch((e) => console.warn('Record review error:', e));

        // If synced with a cloud set, update Firestore
        if (activeCloudSetId) {
          const knewCount = updated.filter((q) => q.recallStatus === 'knew').length;
          const reviseCount = updated.filter((q) => q.recallStatus === 'revise').length;
          updateSetProgress(activeCloudSetId, knewCount, reviseCount, updated).catch((err) =>
            console.error('Failed to update cloud set progress:', err)
          );
        }
      }

      return updated;
    });
  };

  const handleSaveToCloud = async () => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSavingToCloud(true);
    try {
      const newId = await saveSet(topic || 'Study Notes', difficulty, questions, diagram);
      setActiveCloudSetId(newId);
      setIsCloudSaved(true);
    } catch (err: any) {
      console.error('Error saving set to cloud:', err);
      alert('Could not save set to cloud. ' + (err.message || 'Please check your connection.'));
    } finally {
      setIsSavingToCloud(false);
    }
  };

  const handleSelectCloudSet = (set: SavedRevisionSet) => {
    setTopic(set.topic);
    setDifficulty(set.difficulty);
    setQuestions(set.questions.map((q) => ({ ...q, isAnswerRevealed: false })));
    setDiagram(set.diagram || null);
    setActiveCloudSetId(set.id);
    setIsCloudSaved(true);
    setView('questions');
  };

  const handleReset = () => {
    setView('input');
    setErrorMessage(null);
    setInsufficientNotice(null);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Header with branding and PWA install button */}
      <Header
        onReset={handleReset}
        hasQuestions={view === 'questions'}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Main Content Area with smooth screen transitions */}
      <main className="flex-1 px-4 py-6 sm:py-8">
        <AnimatePresence mode="wait">
          {view === 'input' ? (
            <motion.div
              key="view-input"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-3xl mx-auto space-y-6"
            >
              {/* Title & Tagline Banner */}
              <div className="text-center space-y-1.5 pt-2 sm:pt-4">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  QuickRecall
                </h1>
                <p className="text-sm sm:text-base text-slate-400 font-normal">
                  Turn notes, PDFs & diagrams into active-recall questions.
                </p>
              </div>

              {/* Insufficient notes feedback alert */}
              {insufficientNotice && (
                <div
                  id="insufficient-notes-alert"
                  className="rounded-2xl bg-amber-950/40 border border-amber-800/60 p-4 sm:p-5 text-amber-200 space-y-2"
                >
                  <div className="flex items-center gap-2 font-semibold text-amber-300 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <span>Material Insufficient for Active Recall</span>
                  </div>
                  <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
                    {insufficientNotice}
                  </p>
                </div>
              )}

              {/* Note Input Form */}
              <NoteInputForm
                initialNotes={notes}
                initialTopic={topic}
                initialQuestionCount={questionCount}
                initialDifficulty={difficulty}
                initialDiagramMode={diagramMode}
                initialFiles={files}
                isGenerating={isGenerating}
                onGenerate={handleGenerate}
                error={errorMessage}
              />
            </motion.div>
          ) : (
            <motion.div
              key="view-questions"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-3xl mx-auto space-y-4"
            >
              {/* Back to input shortcut button */}
              <button
                id="back-to-input-btn"
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-medium transition cursor-pointer py-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to input</span>
              </button>

              {/* Questions Vertical List or Focus Flashcard Mode */}
              <QuestionList
                topic={topic}
                questions={questions}
                diagram={diagram}
                files={files}
                isRegenerating={isGenerating}
                onRegenerate={handleRegenerate}
                onEditNotes={() => setView('input')}
                onToggleAnswer={handleToggleAnswer}
                onUpdateStatus={handleUpdateStatus}
                onToggleAllAnswers={handleToggleAllAnswers}
                onSaveToCloud={handleSaveToCloud}
                isSavingToCloud={isSavingToCloud}
                isCloudSaved={isCloudSaved}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Cloud Library Modal */}
      <SavedSetsModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        onSelectSet={handleSelectCloudSet}
      />

      {/* Authentication & Sign-in Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Footer with Buy Me a Coffee link */}
      <Footer />

      {/* Offline Status Floating Indicator */}
      <OfflineIndicator />
    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RefreshCw,
  Edit3,
  CheckCircle2,
  RotateCcw,
  HelpCircle,
  Eye,
  EyeOff,
  Layers,
  LayoutList,
  Sparkles,
  Maximize2,
  Cloud,
  Check,
  X,
} from 'lucide-react';
import { RevisionQuestion, RevisionDiagram, RecallStatus, UploadFileItem } from '../types';
import { QuestionCard } from './QuestionCard';
import { FocusFlashcard } from './FocusFlashcard';
import { CompletionBanner } from './CompletionBanner';
import { ImagePreviewModal } from './ImagePreviewModal';
import { DiagramViewer } from './DiagramViewer';

interface QuestionListProps {
  topic: string;
  questions: RevisionQuestion[];
  diagram?: RevisionDiagram | null;
  files?: UploadFileItem[];
  isRegenerating: boolean;
  onRegenerate: () => void;
  onEditNotes: () => void;
  onToggleAnswer: (id: string) => void;
  onUpdateStatus: (id: string, status: RecallStatus) => void;
  onToggleAllAnswers: (reveal: boolean) => void;
  onSaveToCloud?: () => Promise<void>;
  isSavingToCloud?: boolean;
  isCloudSaved?: boolean;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  topic,
  questions,
  diagram,
  files = [],
  isRegenerating,
  onRegenerate,
  onEditNotes,
  onToggleAnswer,
  onUpdateStatus,
  onToggleAllAnswers,
  onSaveToCloud,
  isSavingToCloud = false,
  isCloudSaved = false,
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'focus'>('focus');
  const [filter, setFilter] = useState<'all' | 'revise' | 'knew' | 'unreviewed' | 'diagram'>('all');
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);
  const [isDiagramModalOpen, setIsDiagramModalOpen] = useState(false);

  const total = questions.length;
  const knewCount = questions.filter((q) => q.recallStatus === 'knew').length;
  const reviseCount = questions.filter((q) => q.recallStatus === 'revise').length;
  const unreviewedCount = total - (knewCount + reviseCount);
  const diagramCount = questions.filter((q) => q.type === 'diagram').length;
  const reviewedPercent = total > 0 ? Math.round(((knewCount + reviseCount) / total) * 100) : 0;

  const allRevealed = questions.length > 0 && questions.every((q) => q.isAnswerRevealed);

  const filteredQuestions = questions.filter((q) => {
    if (filter === 'knew') return q.recallStatus === 'knew';
    if (filter === 'revise') return q.recallStatus === 'revise';
    if (filter === 'unreviewed') return !q.recallStatus || q.recallStatus === 'unreviewed';
    if (filter === 'diagram') return q.type === 'diagram';
    return true;
  });

  const handleDrillMissed = () => {
    setFilter('revise');
    setViewMode('focus');
  };

  const handleResetAllRecallMarks = () => {
    questions.forEach((q) => onUpdateStatus(q.id, 'unreviewed'));
    setFilter('all');
  };

  const imageFiles = files.filter((f) => f.mimeType.startsWith('image/'));

  return (
    <div className="w-full max-w-3xl mx-auto space-y-5">
      {/* Top Revision Bar & Mode Switcher */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-4 sm:p-5 space-y-4 shadow-lg">
        {/* Topic Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Active Revision Set
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {topic || 'Study Notes'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Switcher: Focus Mode vs List View */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800">
              <button
                type="button"
                id="mode-focus-btn"
                onClick={() => setViewMode('focus')}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'focus' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {viewMode === 'focus' && (
                  <motion.div
                    layoutId="view-mode-pill"
                    className="absolute inset-0 rounded-lg bg-blue-600 shadow-sm"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Focus</span>
                </span>
              </button>

              <button
                type="button"
                id="mode-list-btn"
                onClick={() => setViewMode('list')}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'list' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {viewMode === 'list' && (
                  <motion.div
                    layoutId="view-mode-pill"
                    className="absolute inset-0 rounded-lg bg-blue-600 shadow-sm"
                    transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-1">
                  <LayoutList className="w-3.5 h-3.5" />
                  <span>List</span>
                </span>
              </button>
            </div>

            {/* Save to Cloud button */}
            {onSaveToCloud && (
              <button
                id="save-to-cloud-btn"
                type="button"
                onClick={onSaveToCloud}
                disabled={isSavingToCloud || isCloudSaved}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition cursor-pointer disabled:cursor-default ${
                  isCloudSaved
                    ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400'
                    : 'bg-slate-850 hover:bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
                }`}
                title={isCloudSaved ? 'Saved to Cloud' : 'Save Set to Cloud'}
              >
                {isSavingToCloud ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
                    <span className="hidden sm:inline">Saving...</span>
                  </>
                ) : isCloudSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline">Saved</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Save</span>
                  </>
                )}
              </button>
            )}

            {/* Edit Notes button */}
            <button
              id="edit-notes-btn"
              type="button"
              onClick={onEditNotes}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer disabled:opacity-50"
              title="Return to notes input"
            >
              <Edit3 className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Edit Notes</span>
            </button>

            {/* Regenerate button */}
            <button
              id="regenerate-btn"
              type="button"
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-xs font-semibold text-white transition shadow-sm cursor-pointer disabled:opacity-50"
              title="Generate fresh questions"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
              <span>{isRegenerating ? '...' : 'Regen'}</span>
            </button>
          </div>
        </div>

        {/* Progress & Stat Badges */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-slate-300">
              Session Progress:{' '}
              <span className="text-white font-semibold">{knewCount + reviseCount}</span> of{' '}
              <span className="text-white font-semibold">{total}</span> reviewed
            </span>
            <span className="font-mono font-bold text-blue-400">{reviewedPercent}%</span>
          </div>

          {/* Dynamic Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden flex shadow-inner">
            <motion.div
              className="h-full bg-emerald-500"
              animate={{ width: `${total ? (knewCount / total) * 100 : 0}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              title={`Knew: ${knewCount}`}
            />
            <motion.div
              className="h-full bg-red-500"
              animate={{ width: `${total ? (reviseCount / total) * 100 : 0}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              title={`Revise: ${reviseCount}`}
            />
          </div>

          {/* Metric Badges & Attached Diagrams */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  filter === 'all'
                    ? 'bg-slate-750 border-slate-600 text-slate-100'
                    : 'bg-slate-850/60 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                All ({total})
              </button>
              <button
                type="button"
                onClick={() => setFilter('knew')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  filter === 'knew'
                    ? 'bg-emerald-950 border-emerald-700 text-emerald-300'
                    : 'bg-slate-850/60 border-slate-800 text-slate-400 hover:text-emerald-400'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Knew ({knewCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('revise')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  filter === 'revise'
                    ? 'bg-red-950 border-red-700 text-red-300'
                    : 'bg-slate-850/60 border-slate-800 text-slate-400 hover:text-red-400'
                }`}
              >
                <RotateCcw className="w-3 h-3 text-red-400" />
                <span>Revise ({reviseCount})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('unreviewed')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                  filter === 'unreviewed'
                    ? 'bg-slate-750 border-slate-600 text-slate-200'
                    : 'bg-slate-850/60 border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <HelpCircle className="w-3 h-3 text-slate-400" />
                <span>Pending ({unreviewedCount})</span>
              </button>
              {diagramCount > 0 && (
                <button
                  type="button"
                  id="diagram-filter-btn"
                  onClick={() => setFilter('diagram')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer border ${
                    filter === 'diagram'
                      ? 'bg-blue-950 border-blue-600 text-blue-300'
                      : 'bg-slate-850/60 border-slate-800 text-slate-400 hover:text-blue-300'
                  }`}
                >
                  <Layers className="w-3 h-3 text-blue-400" />
                  <span>Diagrams ({diagramCount})</span>
                </button>
              )}
            </div>

            {/* Attached Diagram Inspection Button (if images present) */}
            {diagram ? (
              <button
                type="button"
                id="inspect-diagram-btn"
                onClick={() => setIsDiagramModalOpen(true)}
                className="text-xs text-blue-300 hover:text-white transition cursor-pointer flex items-center gap-1.5 font-semibold bg-blue-950/70 border border-blue-600/70 hover:border-blue-500 px-3 py-1 rounded-lg shadow-sm"
              >
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                <span>Interactive Diagram</span>
                {diagram.pins && diagram.pins.length > 0 && (
                  <span className="rounded bg-blue-500/25 px-1.5 py-0.5 text-[10px] font-mono text-blue-300">
                    {diagram.pins.length} pins
                  </span>
                )}
              </button>
            ) : imageFiles.length > 0 ? (
              <button
                type="button"
                onClick={() =>
                  setPreviewImage({
                    url: imageFiles[0].previewUrl || `data:${imageFiles[0].mimeType};base64,${imageFiles[0].base64Data}`,
                    title: imageFiles[0].name,
                  })
                }
                className="text-xs text-blue-400 hover:text-blue-300 transition cursor-pointer flex items-center gap-1 font-medium bg-blue-950/40 border border-blue-800/60 px-2.5 py-1 rounded-lg"
              >
                <Maximize2 className="w-3 h-3 text-blue-400" />
                <span>Inspect Diagram</span>
              </button>
            ) : null}

            {/* Reveal/Hide All answers in list mode */}
            {viewMode === 'list' && (
              <button
                id="toggle-all-answers-btn"
                type="button"
                onClick={() => onToggleAllAnswers(!allRevealed)}
                className="text-xs text-slate-400 hover:text-slate-200 transition cursor-pointer flex items-center gap-1 ml-auto"
              >
                {allRevealed ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                    <span>Hide All Answers</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>Reveal All Answers</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Completion Banner (shown when session is 100% reviewed) */}
      {reviewedPercent === 100 && (
        <CompletionBanner
          total={total}
          knewCount={knewCount}
          reviseCount={reviseCount}
          onDrillMissed={handleDrillMissed}
          onResetReview={handleResetAllRecallMarks}
        />
      )}

      {/* Main Revision Content: Focus Flashcard Mode OR List View */}
      {viewMode === 'focus' ? (
        <FocusFlashcard
          questions={filteredQuestions.length > 0 ? filteredQuestions : questions}
          onToggleAnswer={onToggleAnswer}
          onUpdateStatus={onUpdateStatus}
          onSwitchToList={() => setViewMode('list')}
        />
      ) : (
        <div className="space-y-4">
          {filteredQuestions.length === 0 ? (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-8 text-center space-y-2">
              <p className="text-slate-400 text-sm">
                No questions found under the <span className="font-semibold text-slate-200 capitalize">"{filter}"</span> filter.
              </p>
              <button
                type="button"
                onClick={() => setFilter('all')}
                className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
              >
                View all questions
              </button>
            </div>
          ) : (
            filteredQuestions.map((q, idx) => (
              <QuestionCard
                key={q.id}
                question={q}
                index={idx}
                total={filteredQuestions.length}
                onToggleAnswer={onToggleAnswer}
                onUpdateStatus={onUpdateStatus}
              />
            ))
          )}
        </div>
      )}

      {/* Interactive Diagram / Image Zoom Modal */}
      {previewImage && (
        <ImagePreviewModal
          isOpen={!!previewImage}
          imageUrl={previewImage.url}
          title={previewImage.title}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Interactive Diagram Modal */}
      {isDiagramModalOpen && diagram && (
        <div
          id="diagram-modal-overlay"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
          onClick={() => setIsDiagramModalOpen(false)}
        >
          <div
            id="diagram-modal-dialog"
            className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 p-5 sm:p-6 space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-bold text-white">
                  {diagram.title || 'Study Diagram'}
                </h3>
              </div>
              <button
                type="button"
                id="close-diagram-modal-btn"
                onClick={() => setIsDiagramModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Close diagram"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <DiagramViewer diagram={diagram} isAnswerRevealed={false} />
          </div>
        </div>
      )}
    </div>
  );
};

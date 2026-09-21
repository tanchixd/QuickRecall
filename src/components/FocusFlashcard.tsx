import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react';
import { RevisionQuestion, RecallStatus } from '../types';
import { DiagramViewer } from './DiagramViewer';

interface FocusFlashcardProps {
  questions: RevisionQuestion[];
  onToggleAnswer: (id: string) => void;
  onUpdateStatus: (id: string, status: RecallStatus) => void;
  onSwitchToList: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; badge: string; isDiagram?: boolean }> = {
  conceptual: { label: 'Conceptual', badge: 'bg-indigo-950/80 border-indigo-700/70 text-indigo-300' },
  definition: { label: 'Definition', badge: 'bg-sky-950/80 border-sky-700/70 text-sky-300' },
  cause_effect: { label: 'Cause & Effect', badge: 'bg-amber-950/80 border-amber-700/70 text-amber-300' },
  factual: { label: 'Factual', badge: 'bg-emerald-950/80 border-emerald-700/70 text-emerald-300' },
  application: { label: 'Application', badge: 'bg-purple-950/80 border-purple-700/70 text-purple-300' },
  diagram: { label: 'Diagram / Visual', badge: 'bg-blue-950/80 border-blue-600/80 text-blue-300', isDiagram: true },
};

export const FocusFlashcard: React.FC<FocusFlashcardProps> = ({
  questions,
  onToggleAnswer,
  onUpdateStatus,
  onSwitchToList,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(0);

  const total = questions.length;
  const currentQuestion = questions[currentIndex] || questions[0];

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, total]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const handleToggleCurrentAnswer = useCallback(() => {
    if (currentQuestion) {
      onToggleAnswer(currentQuestion.id);
    }
  }, [currentQuestion, onToggleAnswer]);

  const handleStatusSelect = useCallback(
    (status: RecallStatus) => {
      if (!currentQuestion) return;
      onUpdateStatus(currentQuestion.id, status);
      // If user marks status and has revealed answer, provide smooth prompt to advance
      if (currentIndex < total - 1) {
        setTimeout(() => {
          setDirection(1);
          setCurrentIndex((prev) => prev + 1);
        }, 220);
      }
    },
    [currentQuestion, currentIndex, total, onUpdateStatus]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleCurrentAnswer();
      } else if (e.key === '1') {
        e.preventDefault();
        handleStatusSelect('knew');
      } else if (e.key === '2') {
        e.preventDefault();
        handleStatusSelect('revise');
      } else if (e.key === 'ArrowRight' || e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        handlePrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggleCurrentAnswer, handleStatusSelect, handleNext, handlePrev]);

  if (!currentQuestion) return null;

  const typeConfig = TYPE_CONFIG[currentQuestion.type] || TYPE_CONFIG.conceptual;
  const isRevealed = !!currentQuestion.isAnswerRevealed;
  const status = currentQuestion.recallStatus || 'unreviewed';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      {/* Stepper Dots & Progress Bar */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 p-3 sm:p-4 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-200">
              Question {currentIndex + 1} of {total}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-[11px] text-slate-400 hidden sm:inline">
              Press [Space] to flip, [1] / [2] to rate
            </span>
          </div>

          <button
            type="button"
            onClick={onSwitchToList}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
          >
            Switch to list view
          </button>
        </div>

        {/* Stepper Dots */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {questions.map((q, idx) => {
            const isCurrent = idx === currentIndex;
            const qStatus = q.recallStatus;
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`h-2 flex-1 min-w-[14px] rounded-full transition-all cursor-pointer ${
                  isCurrent
                    ? 'ring-2 ring-blue-500 scale-105'
                    : 'hover:opacity-80'
                } ${
                  qStatus === 'knew'
                    ? 'bg-emerald-500'
                    : qStatus === 'revise'
                    ? 'bg-red-500'
                    : 'bg-slate-700'
                }`}
                title={`Question ${idx + 1}: ${qStatus || 'unreviewed'}`}
              />
            );
          })}
        </div>
      </div>

      {/* The Dynamic Interactive Flashcard */}
      <div className="relative min-h-[360px] sm:min-h-[400px] flex items-stretch">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={currentQuestion.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 50, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: direction * -50, scale: 0.98 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className={`w-full rounded-2xl border transition-all duration-200 bg-slate-900/95 flex flex-col justify-between p-6 sm:p-8 shadow-xl ${
              status === 'knew'
                ? 'border-emerald-600/70 shadow-emerald-950/30'
                : status === 'revise'
                ? 'border-red-600/70 shadow-red-950/30'
                : 'border-slate-800'
            }`}
          >
            {/* Top Info Bar */}
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
              <span className="text-xs font-mono font-bold text-slate-400">
                CARD #{String(currentIndex + 1).padStart(2, '0')}
              </span>

              <div className="flex items-center gap-2">
                {currentQuestion.targetMarker && (
                  <span className="inline-flex items-center gap-1 rounded-md border border-amber-800/60 bg-amber-950/60 px-2 py-0.5 text-xs font-mono font-bold text-amber-300">
                    Marker [{currentQuestion.targetMarker}]
                  </span>
                )}
                <span
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold ${typeConfig.badge}`}
                >
                  {typeConfig.isDiagram && <Layers className="w-3.5 h-3.5 text-blue-400" />}
                  <span>{typeConfig.label}</span>
                </span>
              </div>
            </div>

            {/* Embedded Visual Diagram if question has associated diagram */}
            {currentQuestion.diagram && (
              <div className="pt-4">
                <DiagramViewer
                  diagram={currentQuestion.diagram}
                  targetMarker={currentQuestion.targetMarker}
                  isAnswerRevealed={isRevealed}
                  compact
                />
              </div>
            )}

            {/* Question Prompt Area */}
            <div className="py-5 flex-1 flex flex-col justify-center space-y-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Question
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-white leading-relaxed">
                {currentQuestion.question}
              </h3>

              {/* Revealed Answer Box */}
              <AnimatePresence>
                {isRevealed && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl bg-slate-950/90 border border-slate-800 p-4 sm:p-5 mt-4 space-y-2 overflow-hidden"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Answer</span>
                    </div>
                    <p className="text-sm sm:text-base text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {currentQuestion.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Controls: Reveal & Active Recall */}
            <div className="pt-4 border-t border-slate-800/80 space-y-4">
              {/* Show Answer Toggle */}
              <div className="flex justify-center">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  id={`focus-toggle-answer-btn-${currentQuestion.id}`}
                  onClick={handleToggleCurrentAnswer}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer border ${
                    isRevealed
                      ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                      : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 shadow-md shadow-blue-950/40'
                  }`}
                >
                  {isRevealed ? (
                    <>
                      <EyeOff className="w-4 h-4 text-slate-400" />
                      <span>Hide Answer</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4" />
                      <span>Reveal Answer</span>
                      <span className="text-[10px] opacity-75 font-mono ml-1">[Space]</span>
                    </>
                  )}
                </motion.button>
              </div>

              {/* Recall Assessment: I Knew It / I Need To Revise */}
              <div className="grid grid-cols-2 gap-3">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  id={`focus-knew-btn-${currentQuestion.id}`}
                  onClick={() => handleStatusSelect('knew')}
                  className={`min-h-[48px] rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${
                    status === 'knew'
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-950/40'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-emerald-300'
                  }`}
                >
                  <CheckCircle2 className={`w-4 h-4 ${status === 'knew' ? 'text-white' : 'text-emerald-400'}`} />
                  <span>I knew it</span>
                  <span className="text-[10px] font-mono opacity-70 ml-0.5">[1]</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  type="button"
                  id={`focus-revise-btn-${currentQuestion.id}`}
                  onClick={() => handleStatusSelect('revise')}
                  className={`min-h-[48px] rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer border ${
                    status === 'revise'
                      ? 'bg-red-600 border-red-500 text-white shadow-md shadow-red-950/40'
                      : 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-red-300'
                  }`}
                >
                  <RotateCcw className={`w-4 h-4 ${status === 'revise' ? 'text-white' : 'text-red-400'}`} />
                  <span>Need to revise</span>
                  <span className="text-[10px] font-mono opacity-70 ml-0.5">[2]</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 px-1">
        <button
          type="button"
          id="focus-prev-btn"
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">[←]</span>
        </button>

        <span className="text-xs font-medium text-slate-400">
          {currentIndex + 1} / {total}
        </span>

        <button
          type="button"
          id="focus-next-btn"
          onClick={handleNext}
          disabled={currentIndex === total - 1}
          className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 px-4 py-2.5 text-xs font-semibold text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">[→]</span>
        </button>
      </div>
    </div>
  );
};

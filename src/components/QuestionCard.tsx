import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, CheckCircle2, RotateCcw, Layers, Sparkles } from 'lucide-react';
import { RecallStatus, RevisionQuestion } from '../types';
import { DiagramViewer } from './DiagramViewer';

interface QuestionCardProps {
  question: RevisionQuestion;
  index: number;
  total: number;
  onToggleAnswer: (id: string) => void;
  onUpdateStatus: (id: string, status: RecallStatus) => void;
}

const TYPE_LABELS: Record<string, { label: string; bg: string; text: string; isDiagram?: boolean }> = {
  conceptual: { label: 'Conceptual', bg: 'bg-indigo-950/60 border-indigo-800/60', text: 'text-indigo-300' },
  definition: { label: 'Definition', bg: 'bg-sky-950/60 border-sky-800/60', text: 'text-sky-300' },
  cause_effect: { label: 'Cause & Effect', bg: 'bg-amber-950/60 border-amber-800/60', text: 'text-amber-300' },
  factual: { label: 'Factual', bg: 'bg-emerald-950/60 border-emerald-800/60', text: 'text-emerald-300' },
  application: { label: 'Application', bg: 'bg-purple-950/60 border-purple-800/60', text: 'text-purple-300' },
  diagram: { label: 'Diagram / Visual', bg: 'bg-blue-950/80 border-blue-700/80', text: 'text-blue-300', isDiagram: true },
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  index,
  total,
  onToggleAnswer,
  onUpdateStatus,
}) => {
  const typeConfig = TYPE_LABELS[question.type] || TYPE_LABELS.conceptual;
  const isRevealed = !!question.isAnswerRevealed;
  const status = question.recallStatus || 'unreviewed';

  return (
    <motion.article
      id={`question-card-${question.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
      className={`rounded-2xl border transition-all duration-200 bg-slate-900 ${
        status === 'knew'
          ? 'border-emerald-700/60 shadow-md shadow-emerald-950/20'
          : status === 'revise'
          ? 'border-red-700/60 shadow-md shadow-red-950/20'
          : 'border-slate-800 hover:border-slate-700'
      } p-5 sm:p-6 space-y-4`}
    >
      {/* Header with question number and type badge */}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-mono font-medium text-slate-400">
          Q{String(index + 1).padStart(2, '0')} <span className="text-slate-500">/ {total}</span>
        </span>

        <div className="flex items-center gap-2">
          {question.targetMarker && (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-800/60 bg-amber-950/60 px-2 py-0.5 text-[11px] font-mono font-bold text-amber-300">
              Marker [{question.targetMarker}]
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${typeConfig.bg} ${typeConfig.text}`}
          >
            {typeConfig.isDiagram && <Layers className="w-3 h-3 text-blue-400" />}
            <span>{typeConfig.label}</span>
          </span>
        </div>
      </div>

      {/* Embedded Visual Diagram if question has associated diagram */}
      {question.diagram && (
        <div className="pt-1">
          <DiagramViewer
            diagram={question.diagram}
            targetMarker={question.targetMarker}
            isAnswerRevealed={isRevealed}
            compact
          />
        </div>
      )}

      {/* The Question Prompt */}
      <div className="pt-1">
        <h3 className="text-base sm:text-lg font-semibold text-slate-100 leading-snug">
          {question.question}
        </h3>
      </div>

      {/* Answer Toggle Button */}
      <div className="pt-1">
        <motion.button
          whileTap={{ scale: 0.96 }}
          id={`toggle-answer-btn-${question.id}`}
          type="button"
          onClick={() => onToggleAnswer(question.id)}
          className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer border ${
            isRevealed
              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
              : 'bg-blue-600/15 border-blue-500/30 text-blue-300 hover:bg-blue-600/25 hover:border-blue-500/50'
          }`}
          aria-expanded={isRevealed}
        >
          {isRevealed ? (
            <>
              <EyeOff className="w-4 h-4 text-slate-400" />
              <span>Hide Answer</span>
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Show Answer</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Revealed Answer Box with smooth height animation */}
      <AnimatePresence initial={false}>
        {isRevealed && (
          <motion.div
            id={`answer-box-${question.id}`}
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="rounded-xl bg-slate-950/80 border border-slate-800/80 p-4 text-sm text-slate-200 leading-relaxed space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-400">
                <Sparkles className="w-3 h-3 text-blue-400" />
                <span>Answer</span>
              </div>
              <p className="text-slate-200 whitespace-pre-wrap">{question.answer}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Recall Controls: I knew it / I need to revise */}
      <div className="pt-2 border-t border-slate-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <span className="text-xs text-slate-400 font-medium">
          How did your recall go?
        </span>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          {/* I knew it button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            id={`knew-btn-${question.id}`}
            type="button"
            onClick={() => onUpdateStatus(question.id, status === 'knew' ? 'unreviewed' : 'knew')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
              status === 'knew'
                ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${status === 'knew' ? 'text-white' : 'text-emerald-400'}`} />
            <span>I knew it</span>
          </motion.button>

          {/* I need to revise button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            id={`revise-btn-${question.id}`}
            type="button"
            onClick={() => onUpdateStatus(question.id, status === 'revise' ? 'unreviewed' : 'revise')}
            className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer border ${
              status === 'revise'
                ? 'bg-red-600 border-red-500 text-white shadow-sm'
                : 'bg-slate-800/70 border-slate-700/80 text-slate-300 hover:bg-slate-800 hover:text-red-300'
            }`}
          >
            <RotateCcw className={`w-4 h-4 ${status === 'revise' ? 'text-white' : 'text-red-400'}`} />
            <span>I need to revise</span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
};

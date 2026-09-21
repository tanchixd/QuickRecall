import React from 'react';
import { motion } from 'motion/react';
import { Trophy, RotateCcw, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';

interface CompletionBannerProps {
  total: number;
  knewCount: number;
  reviseCount: number;
  onDrillMissed: () => void;
  onResetReview: () => void;
}

export const CompletionBanner: React.FC<CompletionBannerProps> = ({
  total,
  knewCount,
  reviseCount,
  onDrillMissed,
  onResetReview,
}) => {
  const scorePercent = total > 0 ? Math.round((knewCount / total) * 100) : 0;
  const isPerfect = knewCount === total;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 20, stiffness: 260 }}
      className="rounded-2xl bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-900 border border-blue-800/60 p-5 sm:p-6 shadow-xl relative overflow-hidden space-y-4"
    >
      {/* Decorative subtle glow */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 flex-shrink-0 shadow-inner">
            <Trophy className="w-6 h-6 text-blue-400" />
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <h4 className="text-base sm:text-lg font-bold text-white">
                {isPerfect ? 'Perfect Recall Session!' : 'Revision Complete!'}
              </h4>
              <span className="rounded-full bg-blue-500/20 border border-blue-400/30 px-2.5 py-0.5 text-xs font-bold text-blue-300">
                {scorePercent}% Mastery
              </span>
            </div>
            <p className="text-xs text-slate-400">
              You reviewed all {total} questions in this session.
            </p>
          </div>
        </div>

        {/* Breakdown Stats */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-start sm:justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{knewCount} Mastered</span>
          </div>

          {reviseCount > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs font-semibold">
              <AlertCircle className="w-3.5 h-3.5 text-red-400" />
              <span>{reviseCount} To Revise</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-slate-800/70">
        {reviseCount > 0 ? (
          <button
            type="button"
            id="drill-missed-btn"
            onClick={onDrillMissed}
            className="rounded-xl bg-red-600 hover:bg-red-500 text-white px-4 py-2 text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-red-950/40"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Drill the {reviseCount} missed question{reviseCount === 1 ? '' : 's'}</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-80" />
          </button>
        ) : (
          <div className="text-xs text-emerald-300 flex items-center gap-1.5 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Outstanding retention! All concepts mastered.</span>
          </div>
        )}

        <button
          type="button"
          id="practice-again-btn"
          onClick={onResetReview}
          className="rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/80 px-3.5 py-2 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ml-auto"
        >
          <RotateCcw className="w-3 h-3 text-slate-400" />
          <span>Reset recall marks</span>
        </button>
      </div>
    </motion.div>
  );
};

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Cloud,
  BookOpen,
  Trash2,
  Play,
  CheckCircle2,
  RotateCcw,
  Sparkles,
  Loader2,
  Award,
  AlertCircle,
  ExternalLink,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SavedRevisionSet } from '../types';

interface SavedSetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSet: (set: SavedRevisionSet) => void;
}

export const SavedSetsModal: React.FC<SavedSetsModalProps> = ({
  isOpen,
  onClose,
  onSelectSet,
}) => {
  const {
    user,
    profile,
    savedSets,
    savedSetsLoading,
    deleteSet,
    signIn,
    signInAsGuest,
    signingIn,
    authError,
  } = useAuth();
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  if (!isOpen) return null;

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Cloud Revision Library
                </h3>
                <p className="text-xs text-slate-400">
                  {user
                    ? `Synced to ${user.displayName || user.email}`
                    : 'Sign in to access your study sets anywhere'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Stats Ribbon if signed in */}
          {user && profile && (
            <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-slate-950/40 border-b border-slate-800/80 text-center">
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Generated
                </span>
                <span className="text-base font-bold text-blue-400">
                  {profile.totalQuestionsGenerated || 0}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Reviewed
                </span>
                <span className="text-base font-bold text-slate-200">
                  {profile.totalReviewed || 0}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800/60">
                <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <Award className="w-3 h-3 text-emerald-400" />
                  <span>Mastered</span>
                </span>
                <span className="text-base font-bold text-emerald-400">
                  {profile.totalMastered || 0}
                </span>
              </div>
            </div>
          )}

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {!user ? (
              <div className="py-8 text-center space-y-4 max-w-sm mx-auto">
                <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 text-blue-400">
                  <Cloud className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Save & Sync Your Sets</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Sign in to save your active-recall question sets, track your mastery streak,
                    and practice from any device.
                  </p>
                </div>

                {authError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-950/30 p-3 text-xs text-red-200 flex items-start gap-2 text-left">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{authError}</p>
                  </div>
                )}

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    disabled={signingIn}
                    onClick={async () => {
                      try {
                        await signIn();
                      } catch {
                        // handled by context
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white shadow-lg transition cursor-pointer disabled:opacity-60"
                  >
                    {signingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Connecting to Google...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Sign In with Google</span>
                      </>
                    )}
                  </button>

                  {isInIframe && (
                    <button
                      type="button"
                      onClick={() => window.open(window.location.href, '_blank')}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                      <span>Open in New Tab (Bypass Frame)</span>
                    </button>
                  )}

                  <button
                    type="button"
                    disabled={signingIn}
                    onClick={async () => {
                      try {
                        await signInAsGuest();
                      } catch {
                        // handled
                      }
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-300 transition cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Continue as Guest</span>
                  </button>
                </div>
              </div>
            ) : savedSetsLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
                <span className="text-xs">Loading your saved study sets...</span>
              </div>
            ) : savedSets.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-200">No saved sets yet</p>
                  <p className="text-xs text-slate-400">
                    When you generate revision questions, click "Save to Cloud" to keep them in your library.
                  </p>
                </div>
              </div>
            ) : (
              savedSets.map((set) => {
                const totalQ = set.questions.length;
                const knewCount = set.questions.filter((q) => q.recallStatus === 'knew').length;
                const reviseCount = set.questions.filter((q) => q.recallStatus === 'revise').length;
                const reviewedPct = totalQ > 0 ? Math.round(((knewCount + reviseCount) / totalQ) * 100) : 0;

                return (
                  <div
                    key={set.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/70 border border-slate-800/90 hover:border-slate-700 transition"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-white truncate">
                          {set.topic}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300">
                          {set.difficulty}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                        <span>{totalQ} questions</span>
                        <span>•</span>
                        <span>{formatDate(set.createdAt)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {knewCount} knew
                        </span>
                        <span className="flex items-center gap-1 text-red-400">
                          <RotateCcw className="w-3 h-3" />
                          {reviseCount} revise
                        </span>
                        <span>•</span>
                        <span className="font-mono text-blue-400">{reviewedPct}% reviewed</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 pt-1 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSet(set);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Practice</span>
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`Delete "${set.topic}" from your library?`)) {
                            await deleteSet(set.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Delete set"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

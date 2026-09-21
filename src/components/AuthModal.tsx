import React from 'react';
import { LogIn, UserCheck, ExternalLink, X, AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { signIn, signInAsGuest, signingIn, authError, clearAuthError } = useAuth();
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  if (!isOpen && !authError) return null;

  const handleClose = () => {
    clearAuthError();
    onClose();
  };

  const handleGoogleSignIn = async () => {
    try {
      await signIn();
      handleClose();
    } catch {
      // Error is captured and displayed in authError state
    }
  };

  const handleGuestSignIn = async () => {
    try {
      await signInAsGuest();
      handleClose();
    } catch {
      // Error is captured in authError
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-slate-100">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          title="Close"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <LogIn className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Sign In to QuickRecall</h3>
            <p className="text-xs text-slate-400">Save revision sets, track recall streaks, and sync across devices.</p>
          </div>
        </div>

        {authError && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-950/30 p-3.5 text-xs text-red-200 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium text-red-300">Sign-in Notice</p>
              <p className="text-red-200/90 leading-relaxed">{authError}</p>
            </div>
          </div>
        )}

        <div className="space-y-2.5 mt-4">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-sm font-semibold text-white transition disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {signingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign in with Google</span>
              </>
            )}
          </button>

          {isInIframe && (
            <button
              type="button"
              onClick={handleOpenNewTab}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700 text-xs font-medium text-slate-200 transition cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Open in New Tab (Bypasses Frame Restrictions)</span>
            </button>
          )}

          <div className="relative py-2 flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-900 px-3 text-[11px] text-slate-500 uppercase tracking-wider absolute">or</span>
          </div>

          <button
            type="button"
            onClick={handleGuestSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 text-xs font-medium text-slate-300 transition cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Continue as Guest (No Account Required)</span>
          </button>
        </div>

        <p className="mt-4 text-center text-[11px] text-slate-500">
          Your active-recall questions and study performance remain saved safely on your device.
        </p>
      </div>
    </div>
  );
};

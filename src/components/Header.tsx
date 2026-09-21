import React, { useState } from 'react';
import { Zap, Cloud, LogIn, LogOut, Loader2 } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onReset?: () => void;
  hasQuestions?: boolean;
  onOpenLibrary?: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, hasQuestions, onOpenLibrary, onOpenAuth }) => {
  const { user, profile, loading, signingIn, signIn, signOut, savedSets } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3 sm:px-6">
        <div
          onClick={hasQuestions ? onReset : undefined}
          className={`flex items-center gap-2.5 ${hasQuestions ? 'cursor-pointer group' : ''}`}
          role={hasQuestions ? 'button' : undefined}
          title={hasQuestions ? 'Click to start new revision' : 'QuickRecall'}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 group-hover:border-blue-500/50 transition">
            <Zap className="h-5 w-5 fill-blue-500 text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">QuickRecall</span>
            </div>
            <p className="text-[11px] font-normal text-slate-400">Turn notes into questions.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Cloud Library Trigger */}
          {onOpenLibrary && (
            <button
              id="open-library-btn"
              type="button"
              onClick={onOpenLibrary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-semibold text-slate-200 transition cursor-pointer"
              title="Cloud Library"
            >
              <Cloud className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Library</span>
              {user && savedSets.length > 0 && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-blue-600 text-[10px] font-bold text-white">
                  {savedSets.length}
                </span>
              )}
            </button>
          )}

          {/* Auth Button / User Profile */}
          {!loading && (
            <div className="relative">
              {user ? (
                <div className="flex items-center">
                  <button
                    id="user-avatar-btn"
                    type="button"
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="relative flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                    title={user.displayName || user.email || 'Account'}
                  >
                    {user.photoURL ? (
                      <img
                        src={user.photoURL}
                        alt={user.displayName || 'User'}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-blue-600/30 flex items-center justify-center text-blue-300 text-xs font-bold">
                        {(user.displayName || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div
                      className="absolute right-0 top-10 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 p-2 shadow-2xl z-50 space-y-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-2 border-b border-slate-800/80">
                        <p className="text-xs font-bold text-white truncate">
                          {user.displayName || 'Learner'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">{user.email}</p>
                        {profile && (
                          <div className="mt-1.5 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                            <span>Mastered:</span>
                            <span className="text-emerald-400 font-bold">
                              {profile.totalMastered || 0} questions
                            </span>
                          </div>
                        )}
                      </div>

                      {onOpenLibrary && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenLibrary();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Cloud className="w-3.5 h-3.5 text-blue-400" />
                          <span>Saved Revision Sets ({savedSets.length})</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={async () => {
                          setShowUserMenu(false);
                          await signOut();
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-950/30 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  id="sign-in-btn"
                  type="button"
                  disabled={signingIn}
                  onClick={() => {
                    if (onOpenAuth) {
                      onOpenAuth();
                    } else {
                      signIn().catch(() => {});
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition shadow-sm cursor-pointer disabled:opacity-60"
                  title="Sign In"
                >
                  {signingIn ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <LogIn className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{signingIn ? 'Connecting...' : 'Sign In'}</span>
                </button>
              )}
            </div>
          )}

          <PWAInstallButton />
        </div>
      </div>
    </header>
  );
};


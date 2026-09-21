import React from 'react';
import { Coffee, ExternalLink, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-slate-950/70 mt-auto py-6 px-4 sm:px-6">
      <div className="mx-auto max-w-3xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-center sm:text-left">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600/20 border border-blue-500/30 text-blue-400 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
          <span>
            <strong className="text-slate-200 font-semibold">QuickRecall</strong> — Active-recall questions from notes, PDFs & diagrams
          </span>
        </div>

        {/* Buy Me A Coffee link */}
        <a
          id="buy-me-a-coffee-footer-link"
          href="https://buymeacoffee.com/tanchixd"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-amber-500/40 px-3.5 py-2 text-xs font-semibold text-slate-200 transition-all duration-200 shadow-sm cursor-pointer hover:text-amber-200"
          title="Support creator on Buy Me a Coffee"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-md bg-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
            <Coffee className="w-3.5 h-3.5 fill-amber-400/40 text-amber-400" />
          </div>
          <span>buymeacoffee.com/tanchixd</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-300 transition-colors" />
        </a>
      </div>
    </footer>
  );
};

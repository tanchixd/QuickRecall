import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-indicator-banner"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center justify-between gap-2.5 rounded-xl bg-amber-600/90 border border-amber-500/40 px-3.5 py-2 text-xs font-medium text-white shadow-xl backdrop-blur-md"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 text-amber-200 animate-pulse flex-shrink-0" />
        <span>Offline — Saved questions remain accessible during this session.</span>
      </div>
    </div>
  );
};

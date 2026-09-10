import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      id="offline-status-banner"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600/95 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-white shadow-xl animate-in slide-in-from-bottom-2 duration-300"
    >
      <WifiOff className="w-4 h-4 text-amber-200" />
      <span>Offline Mode — All documents and voices playback without internet.</span>
    </div>
  );
};

import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto flex items-center justify-between gap-2.5 rounded-2xl bg-[#223326] text-white px-4 py-2.5 text-xs font-semibold shadow-xl shadow-stone-900/20 animate-in slide-in-from-bottom duration-200">
      <div className="flex items-center gap-2">
        <WifiOff className="w-4 h-4 stroke-[2.2]" />
        <span>Offline mode — changes saved locally</span>
      </div>
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
    </div>
  );
};

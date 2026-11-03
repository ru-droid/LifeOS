import React from 'react';
import { ArrowLeft, Cloud, CloudOff, RefreshCw, CheckCircle2, Download } from 'lucide-react';
import { SyncStatus, Profile } from '../types/database';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  profile: Profile;
  syncStatus: SyncStatus;
  isOnline: boolean;
  onOpenSettings: () => void;
  onBackToToday?: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({
  syncStatus,
  isOnline,
  onOpenSettings,
  onBackToToday,
  title,
}) => {
  const { isInstallable, install } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 bg-[#f6f4ee]/95 backdrop-blur-md border-b border-stone-200/70 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left: Back button or Title */}
        <div className="flex items-center gap-2">
          {onBackToToday && (
            <button
              onClick={onBackToToday}
              className="p-1 rounded-full text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 transition"
              title="Back to Today"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-base font-bold text-stone-900 tracking-tight">
            {title || 'Daily Hub'}
          </h2>
        </div>

        {/* Right: Install & Sync status */}
        <div className="flex items-center gap-2">
          {isInstallable && (
            <button
              onClick={install}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#223326] text-white text-xs font-semibold hover:bg-[#2b4030] transition shadow-xs"
              title="Install app to your home screen"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install</span>
            </button>
          )}

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-stone-200 text-xs text-stone-600 hover:border-stone-400 transition shadow-xs"
            title="Data Sync & Settings"
          >
            {!isOnline ? (
              <>
                <CloudOff className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-stone-600 text-[11px] font-medium">Offline</span>
              </>
            ) : syncStatus === 'syncing' ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
                <span className="text-stone-600 text-[11px] font-medium">Saving...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-stone-600 text-[11px] font-medium">Synced</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

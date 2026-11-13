import React from 'react';
import { Home, CheckSquare, Wallet, Flame, FileText } from 'lucide-react';

export type TabType = 'today' | 'inbox' | 'wallet' | 'habits' | 'documents' | 'settings';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  todayCount: number;
  inboxCount: number;
  habitsSummary: { done: number; total: number };
  documentsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  todayCount,
  inboxCount,
  habitsSummary,
  documentsCount = 0,
}) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 max-w-md mx-auto bg-white/95 backdrop-blur-md border-t border-stone-200/80 px-2 py-1.5 pb-safe shadow-[0_-2px_12px_rgba(0,0,0,0.03)]">
      <div className="grid grid-cols-5 items-center gap-0.5">
        {/* 1. Today Tab */}
        <button
          onClick={() => onChangeTab('today')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative ${
            activeTab === 'today'
              ? 'text-[#223326] font-bold'
              : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <div className="relative">
            <Home className={`w-5 h-5 ${activeTab === 'today' ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
          </div>
          <span className="text-[10px] font-medium mt-1 tracking-tight">Today</span>
          {activeTab === 'today' && (
            <span className="absolute bottom-0 w-5 h-0.5 bg-[#223326] rounded-full" />
          )}
        </button>

        {/* 2. Tasks Tab */}
        <button
          onClick={() => onChangeTab('inbox')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative ${
            activeTab === 'inbox'
              ? 'text-[#223326] font-bold'
              : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <div className="relative">
            <CheckSquare className={`w-5 h-5 ${activeTab === 'inbox' ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
            {todayCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-4 h-4 px-1 rounded-full bg-[#223326] text-white text-[9px] font-bold flex items-center justify-center">
                {todayCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1 tracking-tight">Tasks</span>
          {activeTab === 'inbox' && (
            <span className="absolute bottom-0 w-5 h-0.5 bg-[#223326] rounded-full" />
          )}
        </button>

        {/* 3. Wallet Tab */}
        <button
          onClick={() => onChangeTab('wallet')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative ${
            activeTab === 'wallet'
              ? 'text-[#223326] font-bold'
              : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <div className="relative">
            <Wallet className={`w-5 h-5 ${activeTab === 'wallet' ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
          </div>
          <span className="text-[10px] font-medium mt-1 tracking-tight">Wallet</span>
          {activeTab === 'wallet' && (
            <span className="absolute bottom-0 w-5 h-0.5 bg-[#223326] rounded-full" />
          )}
        </button>

        {/* 4. Habits Tab */}
        <button
          onClick={() => onChangeTab('habits')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative ${
            activeTab === 'habits'
              ? 'text-[#223326] font-bold'
              : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <div className="relative">
            <Flame className={`w-5 h-5 ${activeTab === 'habits' ? 'stroke-[2.4px] fill-[#223326]/20' : 'stroke-[1.8px]'}`} />
            {habitsSummary.total > 0 && (
              <span
                className={`absolute -top-1.5 -right-2.5 text-[8.5px] font-bold px-1 rounded-full ${
                  habitsSummary.done === habitsSummary.total
                    ? 'bg-emerald-600 text-white'
                    : 'bg-stone-200 text-stone-700'
                }`}
              >
                {habitsSummary.done}/{habitsSummary.total}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1 tracking-tight">Habits</span>
          {activeTab === 'habits' && (
            <span className="absolute bottom-0 w-5 h-0.5 bg-[#223326] rounded-full" />
          )}
        </button>

        {/* 5. Documents Tab (Replaces Settings) */}
        <button
          onClick={() => onChangeTab('documents')}
          className={`flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all relative ${
            activeTab === 'documents'
              ? 'text-[#223326] font-bold'
              : 'text-stone-400 hover:text-stone-700'
          }`}
        >
          <div className="relative">
            <FileText className={`w-5 h-5 ${activeTab === 'documents' ? 'stroke-[2.4px]' : 'stroke-[1.8px]'}`} />
            {documentsCount > 0 && (
              <span className="absolute -top-1.5 -right-2 min-w-3.5 h-3.5 px-1 rounded-full bg-stone-200 text-stone-700 text-[8.5px] font-bold flex items-center justify-center">
                {documentsCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium mt-1 tracking-tight">Documents</span>
          {activeTab === 'documents' && (
            <span className="absolute bottom-0 w-5 h-0.5 bg-[#223326] rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};

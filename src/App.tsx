/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { storage } from './lib/storage';
import {
  Task,
  HabitWithStreak,
  Profile,
  SyncStatus,
  PriorityTier,
  UserDocument,
  DocumentCustomField,
} from './types/database';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { TodayView } from './components/TodayView';
import { InboxView } from './components/InboxView';
import { WalletView } from './components/WalletView';
import { HabitsView } from './components/HabitsView';
import { DocumentList } from './components/documents/DocumentList';
import { SettingsView } from './components/SettingsView';
import { QuickCaptureModal, FloatingActionButton } from './components/QuickCaptureModal';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { Smartphone } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habitsWithStreaks, setHabitsWithStreaks] = useState<HabitWithStreak[]>([]);
  const [documents, setDocuments] = useState<UserDocument[]>([]);
  const [profile, setProfile] = useState<Profile>(storage.getProfile());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(storage.getSyncStatus());
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const isOnline = useOnlineStatus();

  // Load state and subscribe to storage mutations
  useEffect(() => {
    const refreshState = () => {
      setTasks(storage.getTasks());
      setHabitsWithStreaks(storage.getHabitsWithStreaks());
      setDocuments(storage.getDocuments());
      setProfile(storage.getProfile());
    };

    refreshState();
    const unsubStorage = storage.subscribe(refreshState);
    const unsubSync = storage.subscribeSync(setSyncStatus);

    return () => {
      unsubStorage();
      unsubSync();
    };
  }, []);

  // Global keyboard shortcut: 'c' or 'C' opens quick capture when no input is focused
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'c' || e.key === 'C') &&
        !isCaptureOpen &&
        !isAuthOpen &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        setIsCaptureOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isCaptureOpen, isAuthOpen]);

  // Task Handlers
  const handleToggleTask = (id: string) => {
    storage.toggleTaskCompletion(id);
  };

  const handleUpdateTaskTier = (id: string, tier: PriorityTier) => {
    storage.updateTaskTier(id, tier);
  };

  const handleDeleteTask = (id: string) => {
    storage.deleteTask(id);
  };

  const handleAddTask = (title: string, tier: PriorityTier, description?: string, due_time?: string) => {
    storage.addTask(title, tier, description || null, due_time);
  };

  // Habit Handlers
  const handleToggleHabitToday = (habitId: string) => {
    storage.toggleHabitCompletion(habitId);
  };

  const handleToggleHabitDate = (habitId: string, dateStr: string) => {
    storage.toggleHabitCompletion(habitId, dateStr);
  };

  const handleAddHabit = (title: string, icon: string, frequency: 'daily' | 'weekly') => {
    storage.addHabit(title, icon, frequency);
  };

  const handleArchiveHabit = (habitId: string) => {
    storage.archiveHabit(habitId);
  };

  const handleDeleteHabit = (habitId: string) => {
    storage.deleteHabit(habitId);
  };

  // Document Handlers
  const handleAddDocument = (doc: {
    name: string;
    doc_number?: string | null;
    file_url?: string | null;
    file_name?: string | null;
    file_type?: string | null;
    custom_fields: DocumentCustomField[];
  }) => {
    storage.addDocument(doc);
  };

  const handleUpdateDocument = (id: string, updates: Partial<UserDocument>) => {
    storage.updateDocument(id, updates);
  };

  const handleDeleteDocument = (id: string) => {
    storage.deleteDocument(id);
  };

  const handleSignOut = () => {
    storage.resetToDemo();
  };

  // Badge Counts
  const todayCount = tasks.filter((t) => t.priority_tier === 'today' && !t.is_completed).length;
  const inboxCount = tasks.filter((t) => t.priority_tier === 'someday' && !t.is_completed).length;
  const habitsSummary = {
    done: habitsWithStreaks.filter((h) => h.completedToday).length,
    total: habitsWithStreaks.length,
  };

  const tabTitles: Record<TabType, string> = {
    today: 'Today',
    inbox: 'Tasks & Backlog',
    wallet: 'Wallet & Split',
    habits: 'Daily Habits',
    documents: 'Documents Vault',
    settings: 'Settings & Account',
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-[#07080b] flex justify-center text-stone-900 antialiased selection:bg-[#223326]/20">
      {/* Fallback overlay when rotated to landscape on mobile */}
      <div
        id="landscape-lock-barrier"
        className="hidden fixed inset-0 z-[100] bg-[#07080b] flex-col items-center justify-center p-6 text-center text-stone-100"
      >
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4 text-amber-400">
          <Smartphone className="w-7 h-7 rotate-90 animate-pulse" />
        </div>
        <h3 className="text-lg font-bold tracking-tight text-white mb-1.5">
          Please rotate your device
        </h3>
        <p className="text-xs text-stone-400 max-w-xs leading-relaxed">
          Kairon is crafted exclusively for portrait mobile view. Please rotate back to portrait mode for the optimal experience.
        </p>
      </div>

      {/* Restricted Mobile Shell Container with Safe Area & Notch / Dynamic Island Handling */}
      <div className="w-full max-w-md min-h-screen pb-16 relative flex flex-col bg-[#f6f4ee] border-x border-stone-300/30 shadow-2xl pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        {/* Sticky Top Bar for Sub-Views */}
        {activeTab !== 'today' && (
          <Header
            profile={profile}
            syncStatus={syncStatus}
            isOnline={isOnline}
            onOpenSettings={() => setActiveTab('settings')}
            onBackToToday={() => setActiveTab('today')}
            title={tabTitles[activeTab]}
          />
        )}

        {/* Dynamic Views */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'today' && (
            <TodayView
              tasks={tasks}
              habits={habitsWithStreaks}
              onToggleTask={handleToggleTask}
              onUpdateTaskTier={handleUpdateTaskTier}
              onDeleteTask={handleDeleteTask}
              onAddTask={handleAddTask}
              onToggleHabit={handleToggleHabitToday}
              onSwitchTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'inbox' && (
            <InboxView
              tasks={tasks}
              onToggleTask={handleToggleTask}
              onUpdateTaskTier={handleUpdateTaskTier}
              onDeleteTask={handleDeleteTask}
              onAddTask={handleAddTask}
            />
          )}

          {activeTab === 'wallet' && <WalletView />}

          {activeTab === 'habits' && (
            <HabitsView
              habits={habitsWithStreaks}
              onToggleHabitDate={handleToggleHabitDate}
              onAddHabit={handleAddHabit}
              onArchiveHabit={handleArchiveHabit}
              onDeleteHabit={handleDeleteHabit}
            />
          )}

          {activeTab === 'documents' && (
            <DocumentList
              documents={documents}
              onAddDocument={handleAddDocument}
              onUpdateDocument={handleUpdateDocument}
              onDeleteDocument={handleDeleteDocument}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              profile={profile}
              syncStatus={syncStatus}
              onOpenAuth={() => setIsAuthOpen(true)}
              onSignOut={handleSignOut}
            />
          )}
        </main>

        {/* Persistent Floating Action Button (FAB) on non-today views, hidden on documents where list has its own header action */}
        {activeTab !== 'today' && activeTab !== 'documents' && !isCaptureOpen && (
          <FloatingActionButton onClick={() => setIsCaptureOpen(true)} />
        )}

        {/* Quick Capture Modal */}
        <QuickCaptureModal
          isOpen={isCaptureOpen}
          onClose={() => setIsCaptureOpen(false)}
          onSubmit={handleAddTask}
          defaultTier={activeTab === 'today' ? 'today' : 'someday'}
        />

        {/* Auth Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onSuccess={() => {
            setProfile(storage.getProfile());
          }}
        />

        {/* Offline Indicator Banner */}
        <OfflineIndicator />

        {/* Fixed Bottom Navigation Bar (Today | Tasks | Wallet | Habits | Documents) */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          todayCount={todayCount}
          inboxCount={inboxCount}
          habitsSummary={habitsSummary}
          documentsCount={documents.length}
        />
      </div>
    </div>
  );
}

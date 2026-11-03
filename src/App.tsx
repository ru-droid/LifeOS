/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { storage } from './lib/storage';
import { Task, HabitWithStreak, Profile, SyncStatus, PriorityTier } from './types/database';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { TodayView } from './components/TodayView';
import { InboxView } from './components/InboxView';
import { HabitsView } from './components/HabitsView';
import { SettingsView } from './components/SettingsView';
import { QuickCaptureModal, FloatingActionButton } from './components/QuickCaptureModal';
import { AuthModal } from './components/AuthModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { useOnlineStatus } from './hooks/useOnlineStatus';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('today');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habitsWithStreaks, setHabitsWithStreaks] = useState<HabitWithStreak[]>([]);
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

  const handleAddTask = (title: string, tier: PriorityTier, description?: string) => {
    storage.addTask(title, tier, description || null);
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
    habits: 'Daily Habits',
    settings: 'Settings',
  };

  return (
    <div className="min-h-screen bg-[#07080b] flex justify-center text-stone-900 antialiased selection:bg-[#223326]/20">
      {/* Restricted Mobile Shell Container */}
      <div className="w-full max-w-md min-h-screen pb-16 relative flex flex-col bg-[#f6f4ee] border-x border-stone-300/30 shadow-2xl">
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

          {activeTab === 'habits' && (
            <HabitsView
              habits={habitsWithStreaks}
              onToggleHabitDate={handleToggleHabitDate}
              onAddHabit={handleAddHabit}
              onArchiveHabit={handleArchiveHabit}
              onDeleteHabit={handleDeleteHabit}
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

        {/* Persistent Floating Action Button (FAB) on non-today views */}
        {activeTab !== 'today' && !isCaptureOpen && (
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

        {/* Fixed Bottom Navigation Bar */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          todayCount={todayCount}
          inboxCount={inboxCount}
          habitsSummary={habitsSummary}
        />
      </div>
    </div>
  );
}

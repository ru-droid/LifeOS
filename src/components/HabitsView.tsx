import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Trophy,
  Check,
  Calendar,
  Sparkles,
  Archive,
  Trash2,
  X,
  Sun,
  Zap,
  BookOpen,
  Moon,
  Activity,
  Heart,
  Droplet,
  Code,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { HabitWithStreak } from '../types/database';
import { getPastDates } from '../lib/storage';

interface HabitsViewProps {
  habits: HabitWithStreak[];
  onToggleHabitDate: (habitId: string, dateStr: string) => void;
  onAddHabit: (title: string, icon: string, frequency: 'daily' | 'weekly') => void;
  onArchiveHabit: (habitId: string) => void;
  onDeleteHabit: (habitId: string) => void;
}

const AVAILABLE_ICONS = [
  { name: 'zap', label: 'Energy / Focus', icon: Zap },
  { name: 'sun', label: 'Morning / Health', icon: Sun },
  { name: 'book-open', label: 'Reading', icon: BookOpen },
  { name: 'moon', label: 'Sleep / Review', icon: Moon },
  { name: 'activity', label: 'Exercise', icon: Activity },
  { name: 'heart', label: 'Mindfulness', icon: Heart },
  { name: 'droplet', label: 'Hydration', icon: Droplet },
  { name: 'code', label: 'Skill Building', icon: Code },
  { name: 'check', label: 'General Check', icon: Check },
];

function renderHabitIcon(iconName: string, className: string = 'w-4 h-4') {
  switch (iconName) {
    case 'sun':
      return <Sun className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'book-open':
      return <BookOpen className={className} />;
    case 'moon':
      return <Moon className={className} />;
    case 'activity':
      return <Activity className={className} />;
    case 'heart':
      return <Heart className={className} />;
    case 'droplet':
      return <Droplet className={className} />;
    case 'code':
      return <Code className={className} />;
    default:
      return <Check className={className} />;
  }
}

export const HabitsView: React.FC<HabitsViewProps> = ({
  habits,
  onToggleHabitDate,
  onAddHabit,
  onArchiveHabit,
  onDeleteHabit,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newIcon, setNewIcon] = useState('zap');
  const [newFrequency, setNewFrequency] = useState<'daily' | 'weekly'>('daily');

  const past7Days = getPastDates(7);

  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddHabit(newTitle.trim(), newIcon, newFrequency);
    setNewTitle('');
    setIsAddOpen(false);
  };

  const handleDayClick = (e: React.MouseEvent, habitId: string, dateStr: string, isDone: boolean) => {
    if (!isDone) {
      try {
        const rect = e.currentTarget.getBoundingClientRect();
        confetti({
          particleCount: 25,
          spread: 45,
          origin: {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          },
          colors: ['#223326', '#10b981', '#f59e0b', '#ffffff'],
        });
      } catch {}
    }
    onToggleHabitDate(habitId, dateStr);
  };

  // Overall statistics
  const bestStreakOverall = Math.max(0, ...habits.map((h) => h.longestStreak));
  const activeStreaksSum = habits.reduce((acc, h) => acc + h.currentStreak, 0);

  return (
    <div className="space-y-4 px-5 pt-5 pb-24 bg-[#f6f4ee] min-h-full text-stone-900">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
            <span>Daily Habits</span>
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Build streaks through consistent micro-actions.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#223326] hover:bg-[#2b4030] text-white text-xs font-semibold transition active:scale-95 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Habit</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-stone-200/80 rounded-[20px] p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Best Streak</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">
            {bestStreakOverall} <span className="text-xs font-normal text-stone-500">days</span>
          </div>
        </div>

        <div className="bg-white border border-stone-200/80 rounded-[20px] p-4 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-medium">
            <span>Active Habits</span>
            <Flame className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-stone-900 mt-1">
            {habits.length} <span className="text-xs font-normal text-stone-500">habits</span>
          </div>
        </div>
      </div>

      {/* 7-Day Header Reference */}
      <div className="bg-white border border-stone-200/80 rounded-[24px] p-4 shadow-xs">
        <div className="flex items-center justify-between text-xs text-stone-500 pb-2 border-b border-stone-100 mb-3">
          <span className="font-bold text-stone-700">Past 7 Days</span>
          <div className="flex items-center gap-1.5">
            {past7Days.map((dStr, idx) => {
              const d = new Date(dStr + 'T12:00:00');
              const dayLetter = d.toLocaleDateString('en-US', { weekday: 'narrow' });
              const isToday = idx === past7Days.length - 1;
              return (
                <div
                  key={dStr}
                  className={`w-6 text-center text-xs font-semibold ${
                    isToday ? 'text-[#223326] font-extrabold underline' : 'text-stone-400'
                  }`}
                  title={dStr}
                >
                  {dayLetter}
                </div>
              );
            })}
          </div>
        </div>

        {/* Habit Rows */}
        <div className="space-y-3">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/60"
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-white border border-stone-200 flex items-center justify-center text-stone-700 flex-shrink-0 shadow-xs">
                    {renderHabitIcon(habit.icon, 'w-4 h-4')}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-stone-900 truncate">
                      {habit.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-stone-500">
                      <span className="font-medium text-emerald-700">
                        🔥 {habit.currentStreak} day streak
                      </span>
                      <span>•</span>
                      <span>Best: {habit.longestStreak}d</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onDeleteHabit(habit.id)}
                  className="p-1 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-stone-200/50 transition"
                  title="Delete habit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* 7-Day Matrix Interactive Buttons */}
              <div className="flex items-center justify-between pt-2.5 border-t border-stone-200/50">
                <span className="text-xs text-stone-500">Check in:</span>
                <div className="flex items-center gap-1.5">
                  {past7Days.map((dStr, idx) => {
                    const isCompleted = !!habit.recentCompletions[dStr];
                    const isToday = idx === past7Days.length - 1;
                    return (
                      <button
                        key={dStr}
                        onClick={(e) => handleDayClick(e, habit.id, dStr, isCompleted)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all text-xs ${
                          isCompleted
                            ? 'bg-[#223326] text-white font-bold shadow-xs'
                            : isToday
                            ? 'bg-white border-2 border-[#223326] text-[#223326]'
                            : 'bg-white border border-stone-300 text-stone-400'
                        }`}
                        title={`${dStr}: ${isCompleted ? 'Completed' : 'Tap to toggle'}`}
                      >
                        {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : '·'}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Habit Modal */}
      {isAddOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setIsAddOpen(false)}
        >
          <div
            className="w-full max-w-md bg-[#faf8f5] text-stone-900 rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <h3 className="text-base font-bold text-stone-900">New Daily Habit</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-full text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Habit title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 10 pages reading, 20 pushups..."
                  className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2 text-sm text-stone-900 focus:outline-none focus:border-[#223326]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Select Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {AVAILABLE_ICONS.map((item) => {
                    const IconComp = item.icon;
                    return (
                      <button
                        key={item.name}
                        type="button"
                        onClick={() => setNewIcon(item.name)}
                        className={`h-11 rounded-xl flex items-center justify-center border transition ${
                          newIcon === item.name
                            ? 'bg-[#223326] text-white border-[#223326]'
                            : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <IconComp className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-stone-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-[#223326] text-white text-xs font-bold hover:bg-[#2b4030] disabled:opacity-40 transition"
                >
                  Create Habit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

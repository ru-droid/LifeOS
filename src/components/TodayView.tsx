import React, { useState, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Wallet,
  Target,
  Plus,
  ArrowRight,
  User,
  Check,
  CheckSquare,
  Sparkles,
  ChevronRight,
  Trash2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, HabitWithStreak, PriorityTier, FocusItem, DayEvent, Expense, Goal } from '../types/database';
import { storage } from '../lib/storage';
import { ScheduleModal, ExpensesModal, GoalsModal } from './InteractiveModals';
import { QuickCaptureModal, CaptureCategory } from './QuickCaptureModal';

interface TodayViewProps {
  tasks: Task[];
  habits: HabitWithStreak[];
  onToggleTask: (id: string) => void;
  onUpdateTaskTier: (id: string, tier: PriorityTier) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (title: string, tier: PriorityTier) => void;
  onToggleHabit: (id: string) => void;
  onSwitchTab: (tab: 'inbox' | 'habits' | 'settings') => void;
}

export const TodayView: React.FC<TodayViewProps> = ({
  tasks,
  habits,
  onToggleTask,
  onUpdateTaskTier,
  onDeleteTask,
  onAddTask,
  onToggleHabit,
  onSwitchTab,
}) => {
  // Local state for interactive cards
  const [focusItems, setFocusItems] = useState<FocusItem[]>(storage.getFocusItems());
  const [events, setEvents] = useState<DayEvent[]>(storage.getEvents());
  const [expenses, setExpenses] = useState<Expense[]>(storage.getExpenses());
  const [goals, setGoals] = useState<Goal[]>(storage.getGoals());
  const [newFocusTitle, setNewFocusTitle] = useState('');
  const [showAddFocus, setShowAddFocus] = useState(false);

  // Modals state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [captureInitialCategory, setCaptureInitialCategory] = useState<CaptureCategory>('task');
  const [showTasksDrawer, setShowTasksDrawer] = useState(false);

  const refreshLocalState = () => {
    setFocusItems(storage.getFocusItems());
    setEvents(storage.getEvents());
    setExpenses(storage.getExpenses());
    setGoals(storage.getGoals());
  };

  useEffect(() => {
    const unsub = storage.subscribe(refreshLocalState);
    return () => unsub();
  }, []);

  // Format date matching the screenshot uppercase style: "SUNDAY · NOVEMBER 1"
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
  const dayNumber = now.getDate();
  const dateDisplay = `${dayName} · ${monthName} ${dayNumber}`;

  // Greeting based on hour
  const hour = now.getHours();
  let greeting = 'Good morning';
  if (hour >= 12 && hour < 17) greeting = 'Good afternoon';
  else if (hour >= 17) greeting = 'Good evening';

  // Metrics
  const completedFocusCount = focusItems.filter((f) => f.is_completed).length;
  const todayTasks = tasks.filter((t) => t.priority_tier === 'today' && !t.is_completed);
  const monthlySpending = storage.getMonthlySpending();

  // Habits status
  const completedHabitsCount = habits.filter((h) => h.completedToday).length;
  const habitsStatusText =
    habits.length === 0
      ? 'Not checked in'
      : completedHabitsCount === 0
      ? 'Not checked in'
      : `${completedHabitsCount}/${habits.length} done`;

  // Goals status
  const activeGoalsCount = goals.filter((g) => !g.is_completed).length;
  const goalsStatusText =
    goals.length === 0
      ? 'No goals yet'
      : `${activeGoalsCount} active`;

  const triggerConfetti = (e: React.MouseEvent) => {
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { x, y },
        colors: ['#2e4233', '#10b981', '#f59e0b', '#ffffff'],
        disableForReducedMotion: true,
      });
    } catch {
      // Ignore
    }
  };

  const handleToggleFocus = (e: React.MouseEvent, id: string, wasCompleted: boolean) => {
    if (!wasCompleted) {
      triggerConfetti(e);
    }
    storage.toggleFocusItem(id);
    refreshLocalState();
  };

  const handleAddFocus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFocusTitle.trim()) return;
    storage.addFocusItem(newFocusTitle.trim());
    setNewFocusTitle('');
    setShowAddFocus(false);
    refreshLocalState();
  };

  const openCapture = (category: CaptureCategory = 'task') => {
    setCaptureInitialCategory(category);
    setIsCaptureOpen(true);
  };

  return (
    <div className="min-h-full bg-[#f6f4ee] text-stone-900 px-5 pt-5 pb-24 font-sans select-none antialiased">
      {/* =========================================================================
          TOP BAR: DATE & GREETING & PROFILE
         ========================================================================= */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-stone-500 uppercase">
            {dateDisplay}
          </div>
          <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight mt-1">
            {greeting}
          </h1>
          <p className="text-sm text-stone-500 mt-0.5 font-normal">
            Let's make today count.
          </p>
        </div>

        {/* Profile Avatar Button */}
        <button
          onClick={() => onSwitchTab('settings')}
          className="w-12 h-12 rounded-full bg-stone-200/80 hover:bg-stone-300/80 text-stone-700 flex items-center justify-center transition active:scale-95 shadow-xs"
          title="Account & Settings"
          aria-label="Profile and Settings"
        >
          <User className="w-5 h-5 text-stone-700" />
        </button>
      </div>

      <div className="space-y-4">
        {/* =========================================================================
            CARD 1: TODAY'S FOCUS
           ========================================================================= */}
        <div className="bg-white rounded-[26px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-stone-200/60">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              Today's focus
            </h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-600">
                {completedFocusCount}/{focusItems.length}
              </span>
              <button
                onClick={() => setShowAddFocus(!showAddFocus)}
                className="w-6 h-6 rounded-full hover:bg-stone-100 text-stone-500 flex items-center justify-center transition"
                title="Add focus item"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Focus Checklist */}
          <div className="space-y-3">
            {focusItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between group cursor-pointer"
                onClick={(e) => handleToggleFocus(e, item.id, item.is_completed)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                      item.is_completed
                        ? 'bg-[#223326] text-white shadow-xs'
                        : 'bg-stone-400/80 text-transparent hover:bg-stone-500'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span
                    className={`text-sm font-medium transition-colors ${
                      item.is_completed
                        ? 'line-through text-stone-400'
                        : 'text-stone-800'
                    }`}
                  >
                    {item.title}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    storage.deleteFocusItem(item.id);
                    refreshLocalState();
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-stone-300 hover:text-rose-500 rounded transition"
                  title="Remove focus item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

            {/* Add New Focus Form */}
            {showAddFocus && (
              <form onSubmit={handleAddFocus} className="mt-2 flex gap-2 pt-2 border-t border-stone-100">
                <input
                  type="text"
                  value={newFocusTitle}
                  onChange={(e) => setNewFocusTitle(e.target.value)}
                  placeholder="New focus priority..."
                  className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-3 py-1.5 text-xs text-stone-800 focus:outline-none focus:border-stone-400"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!newFocusTitle.trim()}
                  className="px-3 py-1.5 rounded-xl bg-[#223326] text-white text-xs font-semibold hover:bg-[#2c4031] disabled:opacity-40 transition"
                >
                  Add
                </button>
              </form>
            )}
          </div>
        </div>

        {/* =========================================================================
            CARD 2: MY DAY
           ========================================================================= */}
        <div
          onClick={() => setIsScheduleOpen(true)}
          className="bg-white rounded-[26px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-stone-200/60 cursor-pointer hover:border-stone-300 transition active:scale-[0.99]"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              My day
            </h2>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsScheduleOpen(true);
              }}
              className="p-1 text-stone-500 hover:text-stone-800 rounded-lg transition"
              title="View Calendar & Schedule"
            >
              <CalendarIcon className="w-5 h-5 text-stone-500" />
            </button>
          </div>

          <div className="flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-500 flex-shrink-0">
              <Clock className="w-5 h-5 text-stone-500" />
            </div>
            <div>
              <div className="text-sm font-bold text-stone-900 leading-snug">
                {events.length === 0 ? 'No events added' : `${events[0].time} · ${events[0].title}`}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">
                {events.length === 0
                  ? 'Your upcoming schedule'
                  : events.length === 1
                  ? '1 event scheduled today'
                  : `${events.length} events scheduled today`}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            2x2 GRID OF CARDS
           ========================================================================= */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Card 1: Tasks due */}
          <div
            onClick={() => setShowTasksDrawer(true)}
            className="bg-white rounded-[24px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-stone-200/60 cursor-pointer hover:border-stone-300 transition active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 mb-2">
                <CheckCircle2 className="w-4 h-4 text-stone-600" />
              </div>
              <div className="text-xs font-semibold text-stone-500">
                Tasks due
              </div>
            </div>
            <div className="text-2xl font-black text-stone-900 mt-2">
              {todayTasks.length}
            </div>
          </div>

          {/* Card 2: Monthly spending */}
          <div
            onClick={() => setIsExpensesOpen(true)}
            className="bg-white rounded-[24px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-stone-200/60 cursor-pointer hover:border-stone-300 transition active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 mb-2">
                <Wallet className="w-4 h-4 text-stone-600" />
              </div>
              <div className="text-xs font-semibold text-stone-500">
                Monthly spending
              </div>
            </div>
            <div className="text-2xl font-black text-stone-900 mt-2">
              ₹{monthlySpending.toLocaleString()}
            </div>
          </div>

          {/* Card 3: Habits */}
          <div
            onClick={() => onSwitchTab('habits')}
            className="bg-white rounded-[24px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-stone-200/60 cursor-pointer hover:border-stone-300 transition active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 mb-2">
                <CheckSquare className="w-4 h-4 text-stone-600" />
              </div>
              <div className="text-xs font-semibold text-stone-500">
                Habits
              </div>
            </div>
            <div className="text-base font-bold text-stone-900 mt-2 leading-tight">
              {habitsStatusText}
            </div>
          </div>

          {/* Card 4: Goals */}
          <div
            onClick={() => setIsGoalsOpen(true)}
            className="bg-white rounded-[24px] p-4 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-stone-200/60 cursor-pointer hover:border-stone-300 transition active:scale-[0.98] flex flex-col justify-between"
          >
            <div>
              <div className="w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 mb-2">
                <Target className="w-4 h-4 text-stone-600" />
              </div>
              <div className="text-xs font-semibold text-stone-500">
                Goals
              </div>
            </div>
            <div className="text-base font-bold text-stone-900 mt-2 leading-tight">
              {goalsStatusText}
            </div>
          </div>
        </div>

        {/* =========================================================================
            CARD BANNER: CAPTURE ANYTHING
           ========================================================================= */}
        <div
          onClick={() => openCapture('task')}
          className="bg-[#223326] text-white rounded-[24px] p-4 shadow-md flex items-center justify-between cursor-pointer hover:bg-[#2b4030] transition active:scale-[0.99]"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full border border-stone-400/30 bg-white/5 flex items-center justify-center text-white">
              <Plus className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-white tracking-tight">
                Capture anything
              </div>
              <div className="text-xs text-stone-300 mt-0.5 font-normal">
                Task · Expense · Note · Event
              </div>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-stone-300" />
        </div>

        {/* Small Caption matching screenshot footer */}
        <div className="text-center pt-1 pb-1">
          <span className="text-[11px] text-stone-400 tracking-wide font-normal">
            Illustrative home-screen mockup · Sample data
          </span>
        </div>
      </div>

      {/* =========================================================================
          INTERACTIVE MODALS
         ========================================================================= */}
      <ScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        events={events}
        onRefresh={refreshLocalState}
      />

      <ExpensesModal
        isOpen={isExpensesOpen}
        onClose={() => setIsExpensesOpen(false)}
        expenses={expenses}
        onRefresh={refreshLocalState}
      />

      <GoalsModal
        isOpen={isGoalsOpen}
        onClose={() => setIsGoalsOpen(false)}
        goals={goals}
        onRefresh={refreshLocalState}
      />

      <QuickCaptureModal
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        onSubmit={onAddTask}
        initialCategory={captureInitialCategory}
        onCaptured={refreshLocalState}
      />

      {/* Quick Tasks Slide-Over / Modal */}
      {showTasksDrawer && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowTasksDrawer(false)}
        >
          <div
            className="w-full max-w-md bg-[#faf8f5] text-stone-900 rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-stone-700" />
                <h3 className="text-base font-bold text-stone-900">Today's Due Tasks</h3>
              </div>
              <button
                onClick={() => setShowTasksDrawer(false)}
                className="text-xs font-semibold px-3 py-1 rounded-xl bg-stone-200 text-stone-700 hover:bg-stone-300 transition"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mt-4 pr-1">
              {todayTasks.length === 0 ? (
                <div className="py-8 text-center text-stone-400">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-medium">All tasks finished for today!</p>
                  <button
                    onClick={() => {
                      setShowTasksDrawer(false);
                      onSwitchTab('inbox');
                    }}
                    className="mt-3 text-xs font-semibold text-stone-800 underline"
                  >
                    Browse Backlog / Inbox
                  </button>
                </div>
              ) : (
                todayTasks.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-200/70 shadow-xs"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => onToggleTask(t.id)}
                        className="w-5 h-5 rounded-full border border-stone-400 hover:border-stone-700 transition"
                      />
                      <span className="text-sm font-medium text-stone-800">{t.title}</span>
                    </div>
                    <button
                      onClick={() => onDeleteTask(t.id)}
                      className="p-1 text-stone-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 flex justify-between items-center">
              <button
                onClick={() => {
                  setShowTasksDrawer(false);
                  onSwitchTab('inbox');
                }}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center gap-1"
              >
                <span>View Full 3-Tier Backlog</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setShowTasksDrawer(false);
                  openCapture('task');
                }}
                className="px-3 py-1.5 rounded-xl bg-[#223326] text-white text-xs font-bold"
              >
                + Add Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
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
  Flame,
  Timer,
  Eye,
  EyeOff,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task, HabitWithStreak, PriorityTier, DayEvent, Expense, Goal } from '../types/database';
import { storage } from '../lib/storage';
import { ScheduleModal, ExpensesModal, GoalsModal } from './InteractiveModals';
import { QuickCaptureModal, CaptureCategory } from './QuickCaptureModal';

interface TodayViewProps {
  tasks: Task[];
  habits: HabitWithStreak[];
  onToggleTask: (id: string) => void;
  onUpdateTaskTier: (id: string, tier: PriorityTier) => void;
  onDeleteTask: (id: string) => void;
  onAddTask: (title: string, tier: PriorityTier, description?: string, due_time?: string) => void;
  onToggleHabit: (id: string) => void;
  onSwitchTab: (tab: 'inbox' | 'wallet' | 'habits' | 'documents' | 'settings') => void;
}

function parseDueMinutes(timeStr?: string): number | null {
  if (!timeStr) return null;
  const now = new Date();
  let target: Date;

  if (timeStr.includes('T') || timeStr.includes('-')) {
    target = new Date(timeStr);
  } else if (timeStr.includes(':')) {
    const [h, m] = timeStr.split(':').map(Number);
    target = new Date();
    target.setHours(h, m, 0, 0);
  } else {
    return null;
  }

  if (isNaN(target.getTime())) return null;
  return Math.round((target.getTime() - now.getTime()) / 60000);
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
  // Local state for interactive day cards
  const [events, setEvents] = useState<DayEvent[]>(storage.getEvents());
  const [expenses, setExpenses] = useState<Expense[]>(storage.getExpenses());
  const [goals, setGoals] = useState<Goal[]>(storage.getGoals());

  // Quick inline add for task due in 10 mins
  const [showAddFocusForm, setShowAddFocusForm] = useState(false);
  const [showCompletedFocus, setShowCompletedFocus] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDueOption, setQuickDueOption] = useState<number>(5); // 0 = now, 5 = in 5m, 10 = in 10m

  // Live timer tick to re-evaluate due minutes every 15 seconds
  const [ticker, setTicker] = useState(Date.now());

  // Modals state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isExpensesOpen, setIsExpensesOpen] = useState(false);
  const [isGoalsOpen, setIsGoalsOpen] = useState(false);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [captureInitialCategory, setCaptureInitialCategory] = useState<CaptureCategory>('task');
  const [showTasksDrawer, setShowTasksDrawer] = useState(false);

  const refreshLocalState = () => {
    setEvents(storage.getEvents());
    setExpenses(storage.getExpenses());
    setGoals(storage.getGoals());
  };

  useEffect(() => {
    const unsub = storage.subscribe(refreshLocalState);
    const interval = setInterval(() => setTicker(Date.now()), 15000);
    return () => {
      unsub();
      clearInterval(interval);
    };
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

  // =========================================================================
  // DYNAMIC DERIVATION: "Today's Focus" derived from tasks & habits due in <= 10m
  // =========================================================================
  const derivedFocusItems = useMemo(() => {
    const list: {
      id: string;
      sourceType: 'task' | 'habit';
      sourceId: string;
      title: string;
      isCompleted: boolean;
      dueLabel: string;
      diffMinutes: number;
    }[] = [];

    // 1. Scan tasks
    tasks.forEach((t) => {
      if (t.due_time) {
        const diff = parseDueMinutes(t.due_time);
        // Due in 10 minutes or less (or overdue today within past 12h)
        if (diff !== null && diff <= 10 && diff >= -720) {
          let dueLabel = 'Due now';
          if (diff > 0) dueLabel = `in ${diff}m`;
          else if (diff < 0) dueLabel = `${Math.abs(diff)}m ago`;

          list.push({
            id: `task-${t.id}`,
            sourceType: 'task',
            sourceId: t.id,
            title: t.title,
            isCompleted: t.is_completed,
            dueLabel,
            diffMinutes: diff,
          });
        }
      }
    });

    // 2. Scan habits
    habits.forEach((h) => {
      if (h.scheduled_time) {
        const diff = parseDueMinutes(h.scheduled_time);
        if (diff !== null && diff <= 10 && diff >= -720) {
          let dueLabel = 'Due now';
          if (diff > 0) dueLabel = `in ${diff}m`;
          else if (diff < 0) dueLabel = `${Math.abs(diff)}m ago`;

          list.push({
            id: `habit-${h.id}`,
            sourceType: 'habit',
            sourceId: h.id,
            title: h.title,
            isCompleted: h.completedToday,
            dueLabel,
            diffMinutes: diff,
          });
        }
      }
    });

    // Sort: incomplete items first, then by earliest due
    return list.sort((a, b) => {
      if (a.isCompleted !== b.isCompleted) {
        return a.isCompleted ? 1 : -1;
      }
      return a.diffMinutes - b.diffMinutes;
    });
  }, [tasks, habits, ticker]);

  const completedFocusCount = derivedFocusItems.filter((f) => f.isCompleted).length;
  const totalFocusCount = derivedFocusItems.length;

  const visibleFocusItems = useMemo(() => {
    return derivedFocusItems.filter((item) => showCompletedFocus || !item.isCompleted);
  }, [derivedFocusItems, showCompletedFocus]);

  // Metrics
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
    goals.length === 0 ? 'No goals yet' : `${activeGoalsCount} active`;

  const triggerConfetti = (e: React.MouseEvent) => {
    try {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (rect.left + rect.width / 2) / window.innerWidth;
      const y = (rect.top + rect.height / 2) / window.innerHeight;
      confetti({
        particleCount: 30,
        spread: 50,
        origin: { x, y },
        colors: ['#223326', '#10b981', '#f59e0b', '#ffffff'],
        disableForReducedMotion: true,
      });
    } catch {}
  };

  const handleToggleDerivedFocus = (
    e: React.MouseEvent,
    item: { sourceType: 'task' | 'habit'; sourceId: string; isCompleted: boolean }
  ) => {
    if (!item.isCompleted) {
      triggerConfetti(e);
    }
    if (item.sourceType === 'task') {
      onToggleTask(item.sourceId);
    } else {
      onToggleHabit(item.sourceId);
    }
  };

  const handleCreateQuickFocusTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    const dueTimestamp = new Date(Date.now() + quickDueOption * 60 * 1000).toISOString();
    onAddTask(quickTitle.trim(), 'today', undefined, dueTimestamp);
    setQuickTitle('');
    setShowAddFocusForm(false);
  };

  const openCapture = (category: CaptureCategory = 'task') => {
    setCaptureInitialCategory(category);
    setIsCaptureOpen(true);
  };

  return (
    <div className="min-h-full bg-[#f6f4ee] text-stone-900 px-5 pt-safe pt-5 pb-24 font-sans select-none antialiased">
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
          className="w-12 h-12 rounded-full bg-stone-200/80 hover:bg-stone-300/80 text-stone-700 flex items-center justify-center transition active:scale-95 shadow-2xs"
          title="Account & Settings"
          aria-label="Profile and Settings"
        >
          <User className="w-5 h-5 text-stone-700" />
        </button>
      </div>

      <div className="space-y-4">
        {/* =========================================================================
            CARD 1: TODAY'S FOCUS (Derived dynamically from tasks & habits due in <= 10m)
           ========================================================================= */}
        <div className="bg-white rounded-[26px] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.03)] border border-stone-200/60">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-stone-900 tracking-tight">
                Today's focus
              </h2>
              <div className="text-[11px] text-stone-400 font-medium">
                Due in ≤ 10 minutes
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                {completedFocusCount}/{totalFocusCount}
              </span>

              {/* Eye toggle to show/hide completed focus items (hidden by default) */}
              <button
                onClick={() => setShowCompletedFocus(!showCompletedFocus)}
                className="w-7 h-7 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition active:scale-90"
                title={showCompletedFocus ? 'Hide completed focus items' : 'Show completed focus items'}
                aria-label="Toggle completed tasks"
              >
                {showCompletedFocus ? (
                  <EyeOff className="w-4 h-4 text-stone-700" />
                ) : (
                  <Eye className="w-4 h-4 text-stone-500" />
                )}
              </button>

              <button
                onClick={() => setShowAddFocusForm(!showAddFocusForm)}
                className="w-7 h-7 rounded-full hover:bg-stone-100 text-stone-500 hover:text-stone-800 flex items-center justify-center transition active:scale-90"
                title="Add task due in 10 minutes"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Inline Add Quick Urgent Task */}
          {showAddFocusForm && (
            <form
              onSubmit={handleCreateQuickFocusTask}
              className="mb-3.5 p-3 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2.5 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-stone-700">Add Urgent Focus Item</span>
                <button
                  type="button"
                  onClick={() => setShowAddFocusForm(false)}
                  className="text-[11px] text-stone-400 hover:text-stone-700"
                >
                  Cancel
                </button>
              </div>

              <input
                type="text"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                placeholder="What needs immediate attention?"
                autoFocus
                className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-xs font-medium text-stone-800 focus:outline-none focus:border-stone-400"
              />

              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-1.5">
                  {[
                    { label: 'Now', mins: 0 },
                    { label: 'In 5m', mins: 5 },
                    { label: 'In 10m', mins: 10 },
                  ].map((opt) => (
                    <button
                      key={opt.mins}
                      type="button"
                      onClick={() => setQuickDueOption(opt.mins)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                        quickDueOption === opt.mins
                          ? 'bg-[#223326] text-white'
                          : 'bg-white border border-stone-200 text-stone-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!quickTitle.trim()}
                  className="px-3 py-1 rounded-xl bg-[#223326] text-white text-xs font-bold disabled:opacity-40 hover:bg-[#2c4031] transition"
                >
                  Add to Focus
                </button>
              </div>
            </form>
          )}

          {/* Derived Items Checklist */}
          <div className="space-y-3">
            {visibleFocusItems.length === 0 ? (
              <div className="py-4 px-2 text-center text-stone-400">
                {derivedFocusItems.length > 0 && !showCompletedFocus ? (
                  <>
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1.5 text-emerald-600/80" />
                    <p className="text-xs font-semibold text-stone-700">
                      All due focus items completed ({completedFocusCount}/{totalFocusCount})
                    </p>
                    <button
                      onClick={() => setShowCompletedFocus(true)}
                      className="mt-2 text-xs font-bold text-[#223326] underline hover:text-[#2c4031] transition"
                    >
                      Show completed items
                    </button>
                  </>
                ) : (
                  <>
                    <Timer className="w-6 h-6 mx-auto mb-1.5 opacity-40 text-stone-500" />
                    <p className="text-xs font-medium text-stone-600">
                      No tasks or habits due in the next 10 minutes.
                    </p>
                    <p className="text-[11px] text-stone-400 mt-0.5">
                      Items automatically appear here when due in ≤ 10 min.
                    </p>
                    <button
                      onClick={() => setShowAddFocusForm(true)}
                      className="mt-2.5 text-xs font-bold text-[#223326] underline hover:text-[#2c4031] transition"
                    >
                      + Schedule a task for now
                    </button>
                  </>
                )}
              </div>
            ) : (
              visibleFocusItems.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center justify-between group cursor-pointer transition-opacity ${
                    item.isCompleted ? 'opacity-50' : 'opacity-100'
                  }`}
                  onClick={(e) => handleToggleDerivedFocus(e, item)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0 pr-2">
                    {/* Circle matching reference screenshot */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                        item.isCompleted
                          ? 'bg-[#223326] text-white shadow-2xs'
                          : 'bg-stone-400/80 text-transparent hover:bg-stone-500'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-sm font-medium leading-snug transition-colors truncate ${
                          item.isCompleted
                            ? 'line-through text-stone-400'
                            : 'text-stone-800'
                        }`}
                      >
                        {item.title}
                      </div>
                    </div>
                  </div>

                  {/* Due in Badge */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        item.isCompleted
                          ? 'bg-stone-100 text-stone-400'
                          : item.diffMinutes <= 0
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.dueLabel}
                    </span>
                    {item.sourceType === 'habit' && (
                      <span className="text-[10px] font-semibold text-stone-400">
                        Habit
                      </span>
                    )}
                  </div>
                </div>
              ))
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

          {/* Card 2: Monthly spending -> opens Wallet tab */}
          <div
            onClick={() => onSwitchTab('wallet')}
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

      {/* Quick Tasks Drawer */}
      {showTasksDrawer && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
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
                    className="flex items-center justify-between p-3 rounded-2xl bg-white border border-stone-200/70 shadow-2xs"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => onToggleTask(t.id)}
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

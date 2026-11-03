import {
  Task,
  Habit,
  HabitLog,
  HabitWithStreak,
  PriorityTier,
  Profile,
  SyncStatus,
  FocusItem,
  DayEvent,
  Expense,
  Goal,
  Note,
} from '../types/database';
import { getSupabaseClient } from './supabase';

const TASKS_KEY = 'kairon_tasks_v1';
const HABITS_KEY = 'kairon_habits_v1';
const LOGS_KEY = 'kairon_habit_logs_v1';
const USER_KEY = 'kairon_local_user_v1';
const FOCUS_KEY = 'kairon_focus_v1';
const EVENTS_KEY = 'kairon_events_v1';
const EXPENSES_KEY = 'kairon_expenses_v1';
const GOALS_KEY = 'kairon_goals_v1';
const NOTES_KEY = 'kairon_notes_v1';

// In-memory fallback if localStorage is unavailable or blocked in iframe
const memoryFallback: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // Fallback
    }
    return memoryFallback[key] || null;
  },
  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // Fallback
    }
    memoryFallback[key] = value;
  },
  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Fallback
    }
    delete memoryFallback[key];
  },
};

// Format date in YYYY-MM-DD
export function getIsoDate(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getPastDates(daysCount: number): string[] {
  const dates: string[] = [];
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(getIsoDate(d));
  }
  return dates;
}

// Default guest profile
const DEFAULT_PROFILE: Profile = {
  id: 'user-001',
  email: 'alex@example.com',
  full_name: 'Alex',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

// Seed Focus items (matches user screenshot exactly)
const SEED_FOCUS: FocusItem[] = [
  { id: 'focus-1', title: 'Choose your top priority', is_completed: false },
  { id: 'focus-2', title: 'Review today’s schedule', is_completed: false },
  { id: 'focus-3', title: 'Plan one personal activity', is_completed: false },
];

// Default seed data with everyday personal tasks
const SEED_TASKS: Task[] = [
  {
    id: 'seed-task-1',
    user_id: 'user-001',
    title: 'Grocery shopping & meal prep for the week',
    description: 'Pick up fresh produce, olive oil, and essentials.',
    priority_tier: 'today',
    is_completed: false,
    completed_at: null,
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'seed-task-2',
    user_id: 'user-001',
    title: 'Review monthly budget & pay utility bills',
    description: 'Electric and internet statements due on Friday.',
    priority_tier: 'today',
    is_completed: false,
    completed_at: null,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'seed-task-3',
    user_id: 'user-001',
    title: '30-minute afternoon walk or workout',
    description: 'Fresh air and light stretching.',
    priority_tier: 'today',
    is_completed: true,
    completed_at: new Date(Date.now() - 3600000).toISOString(),
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'seed-task-4',
    user_id: 'user-001',
    title: 'Schedule dentist check-up for next month',
    description: 'Call Dr. Miller office on Thursday morning.',
    priority_tier: 'upcoming',
    is_completed: false,
    completed_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'seed-task-5',
    user_id: 'user-001',
    title: 'Declutter and organize storage closet',
    description: 'Donate clothes and pack winter gear.',
    priority_tier: 'upcoming',
    is_completed: false,
    completed_at: null,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'seed-task-6',
    user_id: 'user-001',
    title: 'Plan ideas for weekend road trip getaway',
    description: 'Check cabin rentals and scenic hiking trails.',
    priority_tier: 'someday',
    is_completed: false,
    completed_at: null,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'seed-task-7',
    user_id: 'user-001',
    title: 'Try new sourdough baking recipe',
    description: 'Look up no-knead Dutch oven technique.',
    priority_tier: 'someday',
    is_completed: false,
    completed_at: null,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const SEED_HABITS: Habit[] = [
  {
    id: 'seed-habit-1',
    user_id: 'user-001',
    title: 'Drink 2L Water',
    icon: 'droplet',
    frequency: 'daily',
    archived: false,
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'seed-habit-2',
    user_id: 'user-001',
    title: 'Morning Walk or Stretch',
    icon: 'sun',
    frequency: 'daily',
    archived: false,
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'seed-habit-3',
    user_id: 'user-001',
    title: 'Read for 15 Minutes',
    icon: 'book-open',
    frequency: 'daily',
    archived: false,
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
  {
    id: 'seed-habit-4',
    user_id: 'user-001',
    title: '10-Minute Evening Tidy Up',
    icon: 'moon',
    frequency: 'daily',
    archived: false,
    created_at: new Date(Date.now() - 86400000 * 14).toISOString(),
  },
];

function generateSeedLogs(): HabitLog[] {
  const logs: HabitLog[] = [];
  const today = new Date();

  for (let i = 0; i < 6; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    logs.push({
      id: `seed-log-1-${i}`,
      habit_id: 'seed-habit-1',
      user_id: 'user-001',
      completed_date: getIsoDate(d),
      created_at: d.toISOString(),
    });
  }

  for (let i = 0; i < 12; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    logs.push({
      id: `seed-log-2-${i}`,
      habit_id: 'seed-habit-2',
      user_id: 'user-001',
      completed_date: getIsoDate(d),
      created_at: d.toISOString(),
    });
  }

  for (let i = 1; i <= 4; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    logs.push({
      id: `seed-log-3-${i}`,
      habit_id: 'seed-habit-3',
      user_id: 'user-001',
      completed_date: getIsoDate(d),
      created_at: d.toISOString(),
    });
  }

  logs.push({
    id: `seed-log-4-0`,
    habit_id: 'seed-habit-4',
    user_id: 'user-001',
    completed_date: getIsoDate(today),
    created_at: today.toISOString(),
  });

  return logs;
}

export class LocalFirstStorage {
  private listeners: Set<() => void> = new Set();
  private syncStatus: SyncStatus = 'synced';
  private syncListeners: Set<(status: SyncStatus) => void> = new Set();

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (!safeStorage.getItem(TASKS_KEY)) {
      safeStorage.setItem(TASKS_KEY, JSON.stringify(SEED_TASKS));
    }
    if (!safeStorage.getItem(HABITS_KEY)) {
      safeStorage.setItem(HABITS_KEY, JSON.stringify(SEED_HABITS));
    }
    if (!safeStorage.getItem(LOGS_KEY)) {
      safeStorage.setItem(LOGS_KEY, JSON.stringify(generateSeedLogs()));
    }
    if (!safeStorage.getItem(USER_KEY)) {
      safeStorage.setItem(USER_KEY, JSON.stringify(DEFAULT_PROFILE));
    }
    if (!safeStorage.getItem(FOCUS_KEY)) {
      safeStorage.setItem(FOCUS_KEY, JSON.stringify(SEED_FOCUS));
    }
    if (!safeStorage.getItem(EVENTS_KEY)) {
      safeStorage.setItem(EVENTS_KEY, JSON.stringify([]));
    }
    if (!safeStorage.getItem(EXPENSES_KEY)) {
      safeStorage.setItem(EXPENSES_KEY, JSON.stringify([]));
    }
    if (!safeStorage.getItem(GOALS_KEY)) {
      safeStorage.setItem(GOALS_KEY, JSON.stringify([]));
    }
    if (!safeStorage.getItem(NOTES_KEY)) {
      safeStorage.setItem(NOTES_KEY, JSON.stringify([]));
    }
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public subscribeSync(cb: (status: SyncStatus) => void): () => void {
    this.syncListeners.add(cb);
    cb(this.syncStatus);
    return () => this.syncListeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb());
  }

  private setSync(status: SyncStatus) {
    this.syncStatus = status;
    this.syncListeners.forEach((cb) => cb(status));
  }

  public getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  // Profile
  public getProfile(): Profile {
    try {
      const data = safeStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  }

  public setProfile(profile: Profile): void {
    safeStorage.setItem(USER_KEY, JSON.stringify(profile));
    this.notify();
  }

  // Focus Items
  public getFocusItems(): FocusItem[] {
    try {
      const raw = safeStorage.getItem(FOCUS_KEY);
      return raw ? JSON.parse(raw) : SEED_FOCUS;
    } catch {
      return SEED_FOCUS;
    }
  }

  public toggleFocusItem(id: string): void {
    const items = this.getFocusItems().map((item) =>
      item.id === id ? { ...item, is_completed: !item.is_completed } : item
    );
    safeStorage.setItem(FOCUS_KEY, JSON.stringify(items));
    this.notify();
  }

  public addFocusItem(title: string): void {
    const newItem: FocusItem = {
      id: 'focus_' + Date.now().toString(36),
      title: title.trim(),
      is_completed: false,
    };
    const items = [...this.getFocusItems(), newItem];
    safeStorage.setItem(FOCUS_KEY, JSON.stringify(items));
    this.notify();
  }

  public deleteFocusItem(id: string): void {
    const items = this.getFocusItems().filter((item) => item.id !== id);
    safeStorage.setItem(FOCUS_KEY, JSON.stringify(items));
    this.notify();
  }

  // Day Events / Schedule
  public getEvents(): DayEvent[] {
    try {
      const raw = safeStorage.getItem(EVENTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public addEvent(title: string, time: string = '10:00 AM', date: string = getIsoDate()): DayEvent {
    const newEvent: DayEvent = {
      id: 'event_' + Date.now().toString(36),
      title: title.trim(),
      time,
      date,
    };
    const events = [...this.getEvents(), newEvent];
    safeStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    this.notify();
    return newEvent;
  }

  public deleteEvent(id: string): void {
    const events = this.getEvents().filter((e) => e.id !== id);
    safeStorage.setItem(EVENTS_KEY, JSON.stringify(events));
    this.notify();
  }

  // Expenses & Spending
  public getExpenses(): Expense[] {
    try {
      const raw = safeStorage.getItem(EXPENSES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public addExpense(title: string, amount: number, date: string = getIsoDate()): Expense {
    const newExpense: Expense = {
      id: 'expense_' + Date.now().toString(36),
      title: title.trim(),
      amount: Math.abs(amount),
      date,
    };
    const list = [newExpense, ...this.getExpenses()];
    safeStorage.setItem(EXPENSES_KEY, JSON.stringify(list));
    this.notify();
    return newExpense;
  }

  public deleteExpense(id: string): void {
    const list = this.getExpenses().filter((e) => e.id !== id);
    safeStorage.setItem(EXPENSES_KEY, JSON.stringify(list));
    this.notify();
  }

  public getMonthlySpending(): number {
    const expenses = this.getExpenses();
    const currentMonth = new Date().toISOString().substring(0, 7); // 'YYYY-MM'
    return expenses
      .filter((e) => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);
  }

  // Goals
  public getGoals(): Goal[] {
    try {
      const raw = safeStorage.getItem(GOALS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public addGoal(title: string, target_date?: string): Goal {
    const newGoal: Goal = {
      id: 'goal_' + Date.now().toString(36),
      title: title.trim(),
      target_date,
      is_completed: false,
    };
    const goals = [...this.getGoals(), newGoal];
    safeStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    this.notify();
    return newGoal;
  }

  public toggleGoal(id: string): void {
    const goals = this.getGoals().map((g) =>
      g.id === id ? { ...g, is_completed: !g.is_completed } : g
    );
    safeStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    this.notify();
  }

  public deleteGoal(id: string): void {
    const goals = this.getGoals().filter((g) => g.id !== id);
    safeStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    this.notify();
  }

  // Notes
  public getNotes(): Note[] {
    try {
      const raw = safeStorage.getItem(NOTES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public addNote(content: string): Note {
    const newNote: Note = {
      id: 'note_' + Date.now().toString(36),
      content: content.trim(),
      created_at: new Date().toISOString(),
    };
    const list = [newNote, ...this.getNotes()];
    safeStorage.setItem(NOTES_KEY, JSON.stringify(list));
    this.notify();
    return newNote;
  }

  public deleteNote(id: string): void {
    const list = this.getNotes().filter((n) => n.id !== id);
    safeStorage.setItem(NOTES_KEY, JSON.stringify(list));
    this.notify();
  }

  // Tasks
  public getTasks(): Task[] {
    try {
      const raw = safeStorage.getItem(TASKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public addTask(title: string, priority_tier: PriorityTier = 'someday', description: string | null = null): Task {
    const profile = this.getProfile();
    const newTask: Task = {
      id: 'task_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      user_id: profile.id,
      title: title.trim(),
      description: description ? description.trim() : null,
      priority_tier,
      is_completed: false,
      completed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const tasks = [newTask, ...this.getTasks()];
    safeStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    this.notify();
    this.syncToCloud();
    return newTask;
  }

  public toggleTaskCompletion(id: string): void {
    const tasks = this.getTasks().map((t) => {
      if (t.id === id) {
        const nextCompleted = !t.is_completed;
        return {
          ...t,
          is_completed: nextCompleted,
          completed_at: nextCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });

    safeStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    this.notify();
    this.syncToCloud();
  }

  public updateTaskTier(id: string, priority_tier: PriorityTier): void {
    const tasks = this.getTasks().map((t) => {
      if (t.id === id) {
        return {
          ...t,
          priority_tier,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });

    safeStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    this.notify();
    this.syncToCloud();
  }

  public updateTask(id: string, updates: Partial<Task>): void {
    const tasks = this.getTasks().map((t) => {
      if (t.id === id) {
        return {
          ...t,
          ...updates,
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });

    safeStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    this.notify();
    this.syncToCloud();
  }

  public deleteTask(id: string): void {
    const tasks = this.getTasks().filter((t) => t.id !== id);
    safeStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    this.notify();
    this.syncToCloud();
  }

  // Habits
  public getHabits(): Habit[] {
    try {
      const raw = safeStorage.getItem(HABITS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public addHabit(title: string, icon: string = 'check', frequency: 'daily' | 'weekly' = 'daily'): Habit {
    const profile = this.getProfile();
    const newHabit: Habit = {
      id: 'habit_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      user_id: profile.id,
      title: title.trim(),
      icon,
      frequency,
      archived: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const habits = [...this.getHabits(), newHabit];
    safeStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    this.notify();
    this.syncToCloud();
    return newHabit;
  }

  public archiveHabit(id: string, archived: boolean = true): void {
    const habits = this.getHabits().map((h) => {
      if (h.id === id) {
        return { ...h, archived, updated_at: new Date().toISOString() };
      }
      return h;
    });
    safeStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    this.notify();
    this.syncToCloud();
  }

  public deleteHabit(id: string): void {
    const habits = this.getHabits().filter((h) => h.id !== id);
    const logs = this.getHabitLogs().filter((l) => l.habit_id !== id);
    safeStorage.setItem(HABITS_KEY, JSON.stringify(habits));
    safeStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    this.notify();
    this.syncToCloud();
  }

  // Habit Logs & Streak Computation
  public getHabitLogs(): HabitLog[] {
    try {
      const raw = safeStorage.getItem(LOGS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  public toggleHabitCompletion(habit_id: string, dateStr: string = getIsoDate()): boolean {
    const profile = this.getProfile();
    const logs = this.getHabitLogs();
    const existingIndex = logs.findIndex(
      (l) => l.habit_id === habit_id && l.completed_date === dateStr
    );

    let isCompletedNow = false;

    if (existingIndex >= 0) {
      logs.splice(existingIndex, 1);
      isCompletedNow = false;
    } else {
      logs.push({
        id: 'log_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
        habit_id,
        user_id: profile.id,
        completed_date: dateStr,
        created_at: new Date().toISOString(),
      });
      isCompletedNow = true;
    }

    safeStorage.setItem(LOGS_KEY, JSON.stringify(logs));
    this.notify();
    this.syncToCloud();
    return isCompletedNow;
  }

  public getHabitsWithStreaks(): HabitWithStreak[] {
    const habits = this.getHabits().filter((h) => !h.archived);
    const logs = this.getHabitLogs();
    const today = getIsoDate();
    const past7Days = getPastDates(7);

    const logsByHabit = new Map<string, Set<string>>();
    logs.forEach((log) => {
      if (!logsByHabit.has(log.habit_id)) {
        logsByHabit.set(log.habit_id, new Set());
      }
      logsByHabit.get(log.habit_id)!.add(log.completed_date);
    });

    return habits.map((habit) => {
      const dateSet = logsByHabit.get(habit.id) || new Set();
      const completedToday = dateSet.has(today);

      let currentStreak = 0;
      let checkDate = new Date();

      if (!completedToday) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (currentStreak < 3650) {
        const iso = getIsoDate(checkDate);
        if (dateSet.has(iso)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      const sortedDates = Array.from(dateSet).sort();
      let longestStreak = 0;
      let runningStreak = 0;
      let prevTimestamp: number | null = null;

      for (const dStr of sortedDates) {
        const parts = dStr.split('-').map(Number);
        const currentMs = Date.UTC(parts[0], parts[1] - 1, parts[2]);

        if (prevTimestamp === null) {
          runningStreak = 1;
        } else {
          const diffDays = Math.round((currentMs - prevTimestamp) / 86400000);
          if (diffDays === 1) {
            runningStreak++;
          } else if (diffDays > 1) {
            runningStreak = 1;
          }
        }
        prevTimestamp = currentMs;
        if (runningStreak > longestStreak) {
          longestStreak = runningStreak;
        }
      }

      const recentCompletions: Record<string, boolean> = {};
      past7Days.forEach((d) => {
        recentCompletions[d] = dateSet.has(d);
      });

      return {
        ...habit,
        currentStreak,
        longestStreak: Math.max(longestStreak, currentStreak),
        completedToday,
        recentCompletions,
      };
    });
  }

  public exportData(): string {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      profile: this.getProfile(),
      tasks: this.getTasks(),
      habits: this.getHabits(),
      habit_logs: this.getHabitLogs(),
      focus_items: this.getFocusItems(),
      events: this.getEvents(),
      expenses: this.getExpenses(),
      goals: this.getGoals(),
    };
    return JSON.stringify(payload, null, 2);
  }

  public importData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.tasks) safeStorage.setItem(TASKS_KEY, JSON.stringify(data.tasks));
      if (data.habits) safeStorage.setItem(HABITS_KEY, JSON.stringify(data.habits));
      if (data.habit_logs) safeStorage.setItem(LOGS_KEY, JSON.stringify(data.habit_logs));
      if (data.profile) safeStorage.setItem(USER_KEY, JSON.stringify(data.profile));
      if (data.focus_items) safeStorage.setItem(FOCUS_KEY, JSON.stringify(data.focus_items));
      if (data.events) safeStorage.setItem(EVENTS_KEY, JSON.stringify(data.events));
      if (data.expenses) safeStorage.setItem(EXPENSES_KEY, JSON.stringify(data.expenses));
      if (data.goals) safeStorage.setItem(GOALS_KEY, JSON.stringify(data.goals));
      this.notify();
      return true;
    } catch (e) {
      console.error('Failed to import data:', e);
      return false;
    }
  }

  public resetToDemo(): void {
    safeStorage.removeItem(TASKS_KEY);
    safeStorage.removeItem(HABITS_KEY);
    safeStorage.removeItem(LOGS_KEY);
    safeStorage.removeItem(USER_KEY);
    safeStorage.removeItem(FOCUS_KEY);
    safeStorage.removeItem(EVENTS_KEY);
    safeStorage.removeItem(EXPENSES_KEY);
    safeStorage.removeItem(GOALS_KEY);
    this.ensureInitialized();
    this.notify();
  }

  public async syncToCloud(): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      this.setSync('synced');
      return;
    }

    if (!navigator.onLine) {
      this.setSync('offline');
      return;
    }

    try {
      this.setSync('syncing');
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;

      if (!user) {
        this.setSync('synced');
        return;
      }

      const localTasks = this.getTasks();
      const syncedTasks = localTasks.map((t) => ({ ...t, user_id: user.id }));
      await (supabase.from('tasks') as any).upsert(syncedTasks, { onConflict: 'id' });

      const localHabits = this.getHabits().map((h) => ({ ...h, user_id: user.id }));
      await (supabase.from('habits') as any).upsert(localHabits, { onConflict: 'id' });

      const localLogs = this.getHabitLogs().map((l) => ({ ...l, user_id: user.id }));
      await (supabase.from('habit_logs') as any).upsert(localLogs, { onConflict: 'id' });

      this.setSync('cloud_connected');
    } catch (err) {
      console.warn('Background Supabase sync failed (will retry):', err);
      this.setSync('error');
    }
  }
}

export const storage = new LocalFirstStorage();

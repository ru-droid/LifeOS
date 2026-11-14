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
  WalletTransaction,
  BillSplit,
  UserDocument,
  DocumentCustomField,
  ScheduledTransaction,
  TransactionFrequency,
  TransactionStatus,
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
const WALLET_BALANCE_KEY = 'kairon_wallet_balance_v1';
const WALLET_TXS_KEY = 'kairon_wallet_txs_v1';
const WALLET_SPLITS_KEY = 'kairon_wallet_splits_v1';
const DOCUMENTS_KEY = 'kairon_documents_v1';
const SCHEDULED_TXS_KEY = 'kairon_scheduled_txs_v1';
const BALANCE_VISIBLE_KEY = 'kairon_balance_visible_v1';

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

// Seed Focus items (kept for backward compatibility)
const SEED_FOCUS: FocusItem[] = [
  { id: 'focus-1', title: 'Choose your top priority', is_completed: false },
  { id: 'focus-2', title: 'Review today’s schedule', is_completed: false },
  { id: 'focus-3', title: 'Plan one personal activity', is_completed: false },
];

// Seed tasks: tasks 1 & 2 have due_time within 10 minutes so "Today's focus" immediately shows active items!
const SEED_TASKS: Task[] = [
  {
    id: 'seed-task-1',
    user_id: 'user-001',
    title: 'Pick up fresh groceries & meal ingredients',
    description: 'Olive oil, sourdough bread, and greens.',
    priority_tier: 'today',
    is_completed: false,
    completed_at: null,
    due_time: new Date(Date.now() + 6 * 60 * 1000).toISOString(), // Due in 6 minutes
    created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'seed-task-2',
    user_id: 'user-001',
    title: 'Review weekly budget statement & pay utility bill',
    description: 'Electricity bill confirmation due.',
    priority_tier: 'today',
    is_completed: false,
    completed_at: null,
    due_time: new Date(Date.now() + 9 * 60 * 1000).toISOString(), // Due in 9 minutes
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

const SEED_WALLET_TXS: WalletTransaction[] = [
  {
    id: 'seed-tx-1',
    type: 'pay',
    amount: 450,
    description: 'Groceries & fresh vegetables',
    person: 'Fresh Supermarket',
    date: getIsoDate(),
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'seed-tx-2',
    type: 'receive',
    amount: 12000,
    description: 'Freelance UI Design Milestone',
    person: 'Studio Craft',
    date: getIsoDate(),
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
];

const SEED_SCHEDULED_TXS: ScheduledTransaction[] = [
  {
    id: 'seed-sch-1',
    user_id: 'user-001',
    amount: 649,
    recipient: 'Netflix 4K Ultra',
    category: 'Subscriptions',
    note: 'Family plan auto-debit',
    scheduled_date: getIsoDate(new Date(Date.now() + 86400000 * 2)),
    frequency: 'monthly',
    status: 'pending',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'seed-sch-2',
    user_id: 'user-001',
    amount: 1299,
    recipient: 'Airtel Fiber Broadband',
    category: 'Utilities',
    note: '300 Mbps unlimited fiber',
    scheduled_date: getIsoDate(new Date(Date.now() + 86400000 * 5)),
    frequency: 'monthly',
    status: 'pending',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const SEED_SPLITS: BillSplit[] = [
  {
    id: 'seed-split-1',
    title: 'Weekend Dinner & Cafe',
    total_amount: 1500,
    people_count: 3,
    split_type: 'equal',
    participants: [
      { id: 'p1', name: 'You', amount: 500, paid: true },
      { id: 'p2', name: 'Rahul', amount: 500, paid: false },
      { id: 'p3', name: 'Ananya', amount: 500, paid: true },
    ],
    created_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

const SEED_DOCUMENTS: UserDocument[] = [
  {
    id: 'doc-seed-1',
    user_id: 'user-001',
    name: 'Passport',
    doc_number: 'Z9823412',
    file_url: null,
    file_name: 'passport_scan.jpg',
    file_type: 'image/jpeg',
    custom_fields: [
      { id: 'cf-1', label: 'Expiry Date', value: '2032-08-14', show_on_card: true },
      { id: 'cf-2', label: 'Nationality', value: 'Indian', show_on_card: true },
      { id: 'cf-3', label: 'Place of Issue', value: 'Mumbai', show_on_card: false },
    ],
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  },
  {
    id: 'doc-seed-2',
    user_id: 'user-001',
    name: "Driver's License",
    doc_number: 'DL-0420110034567',
    file_url: null,
    file_name: 'drivers_license.pdf',
    file_type: 'application/pdf',
    custom_fields: [
      { id: 'cf-4', label: 'Class', value: 'LMV / MCWG', show_on_card: true },
      { id: 'cf-5', label: 'Valid Till', value: '2035-11-20', show_on_card: true },
      { id: 'cf-6', label: 'Blood Group', value: 'O+ Positive', show_on_card: false },
    ],
    created_at: new Date(Date.now() - 86400000 * 15).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 15).toISOString(),
  },
  {
    id: 'doc-seed-3',
    user_id: 'user-001',
    name: 'Health Insurance Policy',
    doc_number: 'POL-9021-X9',
    file_url: null,
    file_name: 'health_policy.pdf',
    file_type: 'application/pdf',
    custom_fields: [
      { id: 'cf-7', label: 'Provider', value: 'Star Health Care', show_on_card: true },
      { id: 'cf-8', label: 'Sum Insured', value: '₹10,00,000', show_on_card: true },
      { id: 'cf-9', label: 'TPA Contact', value: '1800-425-2255', show_on_card: false },
    ],
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

const SEED_HABITS: Habit[] = [
  {
    id: 'seed-habit-1',
    user_id: 'user-001',
    title: 'Drink 2L Water',
    icon: 'droplet',
    frequency: 'daily',
    scheduled_time: new Date(Date.now() + 4 * 60 * 1000).toISOString(), // Due in 4 minutes
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
    if (!safeStorage.getItem(WALLET_BALANCE_KEY)) {
      safeStorage.setItem(WALLET_BALANCE_KEY, JSON.stringify(25000));
    }
    if (!safeStorage.getItem(WALLET_TXS_KEY)) {
      safeStorage.setItem(WALLET_TXS_KEY, JSON.stringify(SEED_WALLET_TXS));
    }
    if (!safeStorage.getItem(WALLET_SPLITS_KEY)) {
      safeStorage.setItem(WALLET_SPLITS_KEY, JSON.stringify(SEED_SPLITS));
    }
    if (!safeStorage.getItem(DOCUMENTS_KEY)) {
      safeStorage.setItem(DOCUMENTS_KEY, JSON.stringify(SEED_DOCUMENTS));
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

  // Wallet Balance Visibility (Hidden by default)
  public isBalanceVisible(): boolean {
    try {
      const val = safeStorage.getItem(BALANCE_VISIBLE_KEY);
      // Default to false if not set
      return val === 'true';
    } catch {
      return false;
    }
  }

  public setBalanceVisible(visible: boolean): void {
    safeStorage.setItem(BALANCE_VISIBLE_KEY, visible ? 'true' : 'false');
    this.notify();
  }

  // Wallet State & Transactions
  public getWalletBalance(): number {
    try {
      const raw = safeStorage.getItem(WALLET_BALANCE_KEY);
      return raw ? Number(JSON.parse(raw)) : 25000;
    } catch {
      return 25000;
    }
  }

  public setWalletBalance(amount: number): void {
    safeStorage.setItem(WALLET_BALANCE_KEY, JSON.stringify(Math.max(0, amount)));
    this.notify();
  }

  public getWalletTransactions(): WalletTransaction[] {
    try {
      const raw = safeStorage.getItem(WALLET_TXS_KEY);
      return raw ? JSON.parse(raw) : SEED_WALLET_TXS;
    } catch {
      return SEED_WALLET_TXS;
    }
  }

  public addWalletTransaction(entry: {
    type: 'pay' | 'receive';
    amount: number;
    description: string;
    person: string;
    category?: string;
    date?: string;
  }): WalletTransaction {
    const currentBalance = this.getWalletBalance();
    const newTx: WalletTransaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      type: entry.type,
      amount: Math.abs(entry.amount),
      description: entry.description.trim(),
      person: entry.person.trim(),
      category: entry.category?.trim() || undefined,
      date: entry.date || getIsoDate(),
      created_at: new Date().toISOString(),
    };

    const updatedTxs = [newTx, ...this.getWalletTransactions()];
    safeStorage.setItem(WALLET_TXS_KEY, JSON.stringify(updatedTxs));

    // Update wallet balance automatically
    if (entry.type === 'pay') {
      this.setWalletBalance(Math.max(0, currentBalance - Math.abs(entry.amount)));
      // Also push to Today's Focus / Daily Hub spending metric
      this.addExpense(entry.description || `Payment to ${entry.person}`, Math.abs(entry.amount));
    } else {
      this.setWalletBalance(currentBalance + Math.abs(entry.amount));
    }

    this.notify();
    return newTx;
  }

  public deleteWalletTransaction(id: string): void {
    const txs = this.getWalletTransactions().filter((t) => t.id !== id);
    safeStorage.setItem(WALLET_TXS_KEY, JSON.stringify(txs));
    this.notify();
  }

  // Scheduled Transactions (Option 2)
  public getScheduledTransactions(): ScheduledTransaction[] {
    try {
      const raw = safeStorage.getItem(SCHEDULED_TXS_KEY);
      return raw ? JSON.parse(raw) : SEED_SCHEDULED_TXS;
    } catch {
      return SEED_SCHEDULED_TXS;
    }
  }

  public addScheduledTransaction(entry: {
    amount: number;
    recipient: string;
    category?: string;
    note?: string | null;
    scheduled_date: string;
    frequency?: TransactionFrequency;
  }): ScheduledTransaction {
    const profile = this.getProfile();
    const isToday = entry.scheduled_date === getIsoDate();
    const schId = 'sch_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

    // Update Today's Focus with upcoming payment reminder badge
    // Adds a high-priority task due in 10 minutes (or now) so it derives in Today's Focus!
    const dueTime = isToday
      ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
      : `${entry.scheduled_date}T09:00:00.000Z`;

    const linkedTask = this.addTask(
      `Pay ${entry.recipient} · ₹${entry.amount.toLocaleString()}`,
      isToday ? 'today' : 'upcoming',
      entry.note || `Scheduled payment (${entry.frequency || 'once'})`,
      dueTime,
      schId
    );

    const newScheduled: ScheduledTransaction = {
      id: schId,
      user_id: profile.id,
      amount: Math.abs(entry.amount),
      recipient: entry.recipient.trim(),
      category: entry.category?.trim() || 'General',
      note: entry.note?.trim() || null,
      scheduled_date: entry.scheduled_date,
      frequency: entry.frequency || 'once',
      status: 'pending',
      linked_task_id: linkedTask.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const list = [newScheduled, ...this.getScheduledTransactions()];
    safeStorage.setItem(SCHEDULED_TXS_KEY, JSON.stringify(list));
    this.notify();
    return newScheduled;
  }

  public updateScheduledTransaction(id: string, updates: Partial<ScheduledTransaction>): void {
    const list = this.getScheduledTransactions();
    const existing = list.find((s) => s.id === id);
    if (!existing) return;

    const updated = list.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          ...updates,
          amount: updates.amount !== undefined ? Math.abs(updates.amount) : s.amount,
          recipient: updates.recipient !== undefined ? updates.recipient.trim() : s.recipient,
          category: updates.category !== undefined ? updates.category.trim() : s.category,
          note: updates.note !== undefined ? (updates.note ? updates.note.trim() : null) : s.note,
          updated_at: new Date().toISOString(),
        };
      }
      return s;
    });

    safeStorage.setItem(SCHEDULED_TXS_KEY, JSON.stringify(updated));

    // Also update any linked task in Today's Focus / Tasks
    const nextItem = updated.find((s) => s.id === id);
    if (nextItem) {
      const tasks = this.getTasks().map((t) => {
        const isLinked = t.linked_transaction_id === id || t.id === existing.linked_task_id;
        if (isLinked) {
          const isToday = nextItem.scheduled_date === getIsoDate();
          return {
            ...t,
            title: `Pay ${nextItem.recipient} · ₹${nextItem.amount.toLocaleString()}`,
            description: nextItem.note || `Scheduled payment (${nextItem.frequency})`,
            priority_tier: (isToday ? 'today' : 'upcoming') as PriorityTier,
            due_time: isToday ? new Date(Date.now() + 5 * 60 * 1000).toISOString() : `${nextItem.scheduled_date}T09:00:00.000Z`,
            updated_at: new Date().toISOString(),
          };
        }
        return t;
      });
      safeStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    }

    this.notify();
  }

  public processScheduledTransaction(id: string): void {
    const list = this.getScheduledTransactions();
    const item = list.find((s) => s.id === id);
    if (!item) return;

    // 1. Deduct from balance and record in transaction history
    this.addWalletTransaction({
      type: 'pay',
      amount: item.amount,
      description: item.note || `Scheduled payment: ${item.recipient} (${item.category})`,
      person: item.recipient,
      category: item.category,
      date: getIsoDate(),
    });

    // 2. Set status to 'paid'
    const updated = list.map((s) => {
      if (s.id === id) {
        return {
          ...s,
          status: 'paid' as TransactionStatus,
          last_processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return s;
    });

    safeStorage.setItem(SCHEDULED_TXS_KEY, JSON.stringify(updated));

    // 3. Locate any linked task in Today's Focus and automatically mark it completed and hidden
    const tasks = this.getTasks().map((t) => {
      const isLinked =
        t.linked_transaction_id === id ||
        item.linked_task_id === t.id ||
        (t.title.toLowerCase().startsWith('pay ') && t.title.includes(item.recipient));
      if (isLinked) {
        return {
          ...t,
          is_completed: true,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }
      return t;
    });

    safeStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    this.notify();
  }

  public cancelScheduledTransaction(id: string): void {
    const updated = this.getScheduledTransactions().map((s) =>
      s.id === id ? { ...s, status: 'cancelled' as TransactionStatus, updated_at: new Date().toISOString() } : s
    );
    safeStorage.setItem(SCHEDULED_TXS_KEY, JSON.stringify(updated));
    this.notify();
  }

  public deleteScheduledTransaction(id: string): void {
    const filtered = this.getScheduledTransactions().filter((s) => s.id !== id);
    safeStorage.setItem(SCHEDULED_TXS_KEY, JSON.stringify(filtered));
    this.notify();
  }

  public getSplits(): BillSplit[] {
    try {
      const raw = safeStorage.getItem(WALLET_SPLITS_KEY);
      return raw ? JSON.parse(raw) : SEED_SPLITS;
    } catch {
      return SEED_SPLITS;
    }
  }

  public addSplit(split: Omit<BillSplit, 'id' | 'created_at'>): BillSplit {
    const newSplit: BillSplit = {
      ...split,
      id: 'split_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      created_at: new Date().toISOString(),
    };
    const splits = [newSplit, ...this.getSplits()];
    safeStorage.setItem(WALLET_SPLITS_KEY, JSON.stringify(splits));
    this.notify();
    return newSplit;
  }

  public updateSplit(id: string, updates: Partial<BillSplit>): void {
    const splits = this.getSplits().map((s) =>
      s.id === id ? { ...s, ...updates } : s
    );
    safeStorage.setItem(WALLET_SPLITS_KEY, JSON.stringify(splits));
    this.notify();
  }

  public toggleSplitParticipantPaid(splitId: string, participantId: string): void {
    const splits = this.getSplits().map((split) => {
      if (split.id === splitId) {
        return {
          ...split,
          participants: split.participants.map((p) =>
            p.id === participantId ? { ...p, paid: !p.paid } : p
          ),
        };
      }
      return split;
    });
    safeStorage.setItem(WALLET_SPLITS_KEY, JSON.stringify(splits));
    this.notify();
  }

  public deleteSplit(id: string): void {
    const splits = this.getSplits().filter((s) => s.id !== id);
    safeStorage.setItem(WALLET_SPLITS_KEY, JSON.stringify(splits));
    this.notify();
  }

  // Documents Vault
  public getDocuments(): UserDocument[] {
    try {
      const raw = safeStorage.getItem(DOCUMENTS_KEY);
      return raw ? JSON.parse(raw) : SEED_DOCUMENTS;
    } catch {
      return SEED_DOCUMENTS;
    }
  }

  public addDocument(doc: {
    name: string;
    doc_number?: string | null;
    file_url?: string | null;
    file_name?: string | null;
    file_type?: string | null;
    custom_fields?: DocumentCustomField[];
  }): UserDocument {
    const profile = this.getProfile();
    const newDoc: UserDocument = {
      id: 'doc_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36),
      user_id: profile.id,
      name: doc.name.trim(),
      doc_number: doc.doc_number ? doc.doc_number.trim() : null,
      file_url: doc.file_url || null,
      file_name: doc.file_name || null,
      file_type: doc.file_type || null,
      custom_fields: doc.custom_fields || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const updated = [newDoc, ...this.getDocuments()];
    safeStorage.setItem(DOCUMENTS_KEY, JSON.stringify(updated));
    this.notify();
    this.syncToCloud();
    return newDoc;
  }

  public updateDocument(id: string, updates: Partial<UserDocument>): void {
    const list = this.getDocuments().map((d) =>
      d.id === id ? { ...d, ...updates, updated_at: new Date().toISOString() } : d
    );
    safeStorage.setItem(DOCUMENTS_KEY, JSON.stringify(list));
    this.notify();
    this.syncToCloud();
  }

  public deleteDocument(id: string): void {
    const list = this.getDocuments().filter((d) => d.id !== id);
    safeStorage.setItem(DOCUMENTS_KEY, JSON.stringify(list));
    this.notify();
    this.syncToCloud();
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

  public addTask(
    title: string,
    priority_tier: PriorityTier = 'someday',
    description: string | null = null,
    due_time?: string,
    linked_transaction_id?: string | null
  ): Task {
    const profile = this.getProfile();
    const newTask: Task = {
      id: 'task_' + Math.random().toString(36).substring(2, 11) + Date.now().toString(36),
      user_id: profile.id,
      title: title.trim(),
      description: description ? description.trim() : null,
      priority_tier,
      is_completed: false,
      completed_at: null,
      due_time: due_time || undefined,
      linked_transaction_id: linked_transaction_id || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const tasks = [newTask, ...this.getTasks()];
    safeStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    this.notify();
    this.syncToCloud();
    return newTask;
  }

  public setTaskDueTime(id: string, due_time?: string): void {
    const tasks = this.getTasks().map((t) => (t.id === id ? { ...t, due_time, updated_at: new Date().toISOString() } : t));
    safeStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    this.notify();
  }

  public toggleTaskCompletion(id: string): void {
    const currentTask = this.getTasks().find((t) => t.id === id);
    if (!currentTask) return;
    const nextCompleted = !currentTask.is_completed;

    // Check if task is linked to a payment
    let linkedSch: ScheduledTransaction | undefined;
    if (currentTask.linked_transaction_id) {
      linkedSch = this.getScheduledTransactions().find((s) => s.id === currentTask.linked_transaction_id);
    } else {
      linkedSch = this.getScheduledTransactions().find(
        (s) =>
          s.linked_task_id === id ||
          (s.status !== 'paid' &&
            currentTask.title.toLowerCase().startsWith('pay ') &&
            currentTask.title.includes(s.recipient))
      );
    }

    // Two-Way Task <-> Wallet Sync:
    // When a task linked to a payment is marked completed in Today's Focus:
    // 1. Deduct the amount from the Wallet balance.
    // 2. Add an entry to the transactions history table.
    // 3. Update the corresponding scheduled_transactions record to status 'paid'.
    if (nextCompleted && linkedSch && linkedSch.status !== 'paid') {
      this.addWalletTransaction({
        type: 'pay',
        amount: linkedSch.amount,
        description: linkedSch.note || `Payment: ${linkedSch.recipient} (${linkedSch.category})`,
        person: linkedSch.recipient,
        category: linkedSch.category,
        date: getIsoDate(),
      });

      const updatedSchs = this.getScheduledTransactions().map((s) => {
        if (s.id === linkedSch!.id) {
          return {
            ...s,
            status: 'paid' as TransactionStatus,
            last_processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        }
        return s;
      });
      safeStorage.setItem(SCHEDULED_TXS_KEY, JSON.stringify(updatedSchs));
    }

    const tasks = this.getTasks().map((t) => {
      if (t.id === id) {
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
    safeStorage.removeItem(WALLET_BALANCE_KEY);
    safeStorage.removeItem(WALLET_TXS_KEY);
    safeStorage.removeItem(WALLET_SPLITS_KEY);
    safeStorage.removeItem(DOCUMENTS_KEY);
    safeStorage.removeItem(SCHEDULED_TXS_KEY);
    safeStorage.removeItem(BALANCE_VISIBLE_KEY);
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
      const { error: tasksError } = await (supabase.from('tasks') as any).upsert(syncedTasks, { onConflict: 'id' });

    if (tasksError) {
      console.error('Supabase tasks sync failed:', tasksError);
      throw tasksError;
    }

      const localHabits = this.getHabits().map((h) => ({ ...h, user_id: user.id }));
      await (supabase.from('habits') as any).upsert(localHabits, { onConflict: 'id' });

      const localLogs = this.getHabitLogs().map((l) => ({ ...l, user_id: user.id }));
      await (supabase.from('habit_logs') as any).upsert(localLogs, { onConflict: 'id' });

      const localDocs = this.getDocuments().map((d) => ({ ...d, user_id: user.id }));
      await (supabase.from('documents') as any).upsert(localDocs, { onConflict: 'id' });

      this.setSync('cloud_connected');
    } catch (err) {
      console.warn('Background Supabase sync failed (will retry):', err);
      this.setSync('error');
    }
  }
}

export const storage = new LocalFirstStorage();

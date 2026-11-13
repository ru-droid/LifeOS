export type PriorityTier = 'today' | 'upcoming' | 'someday';
export type HabitFrequency = 'daily' | 'weekly';

export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  priority_tier: PriorityTier;
  is_completed: boolean;
  completed_at: string | null;
  due_time?: string; // Optional time or ISO string (e.g. "14:30" or ISO timestamp)
  linked_transaction_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  icon: string;
  frequency: HabitFrequency;
  scheduled_time?: string; // Optional reminder time (e.g. "09:00" or ISO timestamp)
  archived: boolean;
  created_at: string;
  updated_at?: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  user_id: string;
  completed_date: string; // ISO 'YYYY-MM-DD'
  created_at: string;
}

export interface HabitWithStreak extends Habit {
  currentStreak: number;
  longestStreak: number;
  completedToday: boolean;
  recentCompletions: Record<string, boolean>; // 'YYYY-MM-DD': boolean
}

export interface FocusItem {
  id: string;
  title: string;
  is_completed: boolean;
  type?: 'task' | 'habit';
  source_id?: string;
  due_label?: string;
}

export interface DayEvent {
  id: string;
  title: string;
  time: string;
  date: string; // YYYY-MM-DD
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string; // YYYY-MM-DD
}

export interface Goal {
  id: string;
  title: string;
  target_date?: string;
  is_completed: boolean;
}

export interface Note {
  id: string;
  content: string;
  created_at: string;
}

export type TransactionFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type TransactionStatus = 'pending' | 'processed' | 'paid' | 'cancelled';

export interface WalletTransaction {
  id: string;
  type: 'pay' | 'receive';
  amount: number;
  description: string;
  person: string; // 'To' for pay, 'From' for receive
  category?: string;
  date: string; // YYYY-MM-DD
  created_at: string;
}

export interface ScheduledTransaction {
  id: string;
  user_id?: string;
  amount: number;
  recipient: string;
  category: string;
  note?: string | null;
  scheduled_date: string; // YYYY-MM-DD
  frequency: TransactionFrequency;
  status: TransactionStatus;
  last_processed_at?: string | null;
  linked_task_id?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SplitParticipant {
  id: string;
  name: string;
  amount: number;
  paid?: boolean;
}

export interface BillSplit {
  id: string;
  title: string;
  total_amount: number;
  people_count: number;
  split_type: 'equal' | 'custom';
  participants: SplitParticipant[];
  created_at: string;
}

export interface DocumentCustomField {
  id: string;
  label: string;
  value: string;
  show_on_card: boolean;
}

export interface UserDocument {
  id: string;
  user_id: string;
  name: string; // ONLY required field
  doc_number: string | null;
  file_url: string | null;
  file_name: string | null;
  file_type: string | null; // MIME type (e.g. 'application/pdf', 'image/jpeg', 'image/png')
  custom_fields: DocumentCustomField[];
  created_at: string;
  updated_at: string;
}

// Supabase generated database type definition
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string };
        Update: Partial<Profile>;
      };
      tasks: {
        Row: Task;
        Insert: Omit<Task, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Task>;
      };
      habits: {
        Row: Habit;
        Insert: Omit<Habit, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Habit>;
      };
      habit_logs: {
        Row: HabitLog;
        Insert: Omit<HabitLog, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<HabitLog>;
      };
      documents: {
        Row: UserDocument;
        Insert: Omit<UserDocument, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<UserDocument>;
      };
    };
  };
}

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'cloud_connected' | 'error';


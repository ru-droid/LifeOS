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
  created_at: string;
  updated_at?: string;
}

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  icon: string;
  frequency: HabitFrequency;
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
    };
  };
}

export type SyncStatus = 'offline' | 'syncing' | 'synced' | 'cloud_connected' | 'error';

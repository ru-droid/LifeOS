import React, { useState } from 'react';
import {
  Settings,
  Database,
  Cloud,
  Copy,
  Check,
  Download,
  Upload,
  RotateCcw,
  User,
  ShieldCheck,
  ExternalLink,
  Code2,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
  LogOut,
  LogIn,
} from 'lucide-react';
import { Profile, SyncStatus } from '../types/database';
import { getSupabaseConfig, saveSupabaseConfig, testSupabaseConnection } from '../lib/supabase';
import { storage } from '../lib/storage';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface SettingsViewProps {
  profile: Profile;
  syncStatus: SyncStatus;
  onOpenAuth: () => void;
  onSignOut: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- ==============================================================================
-- KAIRON - PERSONAL MANAGER PWA
-- Supabase PostgreSQL Schema & Row Level Security (RLS) Policies
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$ BEGIN
    CREATE TYPE priority_tier AS ENUM ('today', 'upcoming', 'someday');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tasks Table
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    priority_tier priority_tier NOT NULL DEFAULT 'someday',
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habits Table
CREATE TABLE IF NOT EXISTS public.habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT 'check',
    frequency TEXT NOT NULL DEFAULT 'daily',
    archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Habit Logs Table
CREATE TABLE IF NOT EXISTS public.habit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_habit_completed_date UNIQUE (habit_id, completed_date)
);

-- High-Performance Indices
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON public.tasks (user_id, priority_tier, is_completed);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_habits_user_archived ON public.habits (user_id, archived);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user_date ON public.habit_logs (user_id, completed_date);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habit_logs ENABLE ROW LEVEL SECURITY;

-- Strict Isolation Policies (auth.uid() = user_id)
CREATE POLICY "Users can access own profile" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can access own tasks" ON public.tasks FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can access own habits" ON public.habits FOR ALL TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can access own logs" ON public.habit_logs FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Automatic Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.raw_user_meta_data->>'avatar_url')
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();`;

export const SettingsView: React.FC<SettingsViewProps> = ({
  profile,
  syncStatus,
  onOpenAuth,
  onSignOut,
}) => {
  const currentConfig = getSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(currentConfig.url);
  const [supabaseKey, setSupabaseKey] = useState(currentConfig.anonKey);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [testing, setTesting] = useState(false);
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [showSqlViewer, setShowSqlViewer] = useState(false);

  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveConfig = () => {
    saveSupabaseConfig(supabaseUrl, supabaseKey);
    setTestResult({
      success: true,
      message: 'Supabase configuration saved. Storage re-initialized.',
    });
    showToast('success', 'Supabase credentials saved successfully.');
  };

  const handleTestConnection = async () => {
    if (!supabaseUrl.trim() || !supabaseKey.trim()) {
      setTestResult({ success: false, message: 'Please enter both Supabase URL and Anon Key.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection(supabaseUrl.trim(), supabaseKey.trim());
    setTesting(false);
    setTestResult(res);
  };

  const handleCopySchema = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2000);
  };

  const handleExportJson = () => {
    const dataStr = storage.exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kairon-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Backup JSON file exported successfully.');
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importData(content);
      if (success) {
        showToast('success', 'Data imported successfully!');
      } else {
        showToast('error', 'Failed to parse JSON backup file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmResetDemo = () => {
    storage.resetToDemo();
    setShowResetConfirm(false);
    showToast('success', 'Reset complete: Demo dataset restored.');
  };

  const [showDevTools, setShowDevTools] = useState(false);

  return (
    <div className="space-y-4 px-5 pt-5 pb-24 bg-[#f6f4ee] min-h-full text-stone-900">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
          <span>Settings</span>
        </h2>
        <p className="text-xs text-stone-500 mt-1">
          Manage your profile, sync preferences, and offline data.
        </p>
      </div>

      {/* =========================================================================
          SECTION 1: USER ACCOUNT & PROFILE
         ========================================================================= */}
      <section className="bg-white border border-stone-200/80 rounded-[24px] p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-stone-700" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Account & Profile
            </h3>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 font-semibold">
            {profile.email?.includes('alex') || profile.email?.includes('guest') ? 'Personal Mode' : 'Connected'}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-bold text-stone-900 truncate">{profile.full_name}</p>
            <p className="text-xs text-stone-500 truncate">{profile.email}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#223326] text-white text-xs font-semibold hover:bg-[#2b4030] transition shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              onClick={onSignOut}
              className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-stone-200/50 transition"
              title="Sign out / Reset"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: APP INSTALLATION (PWA)
         ========================================================================= */}
      <section className="bg-[#12151f] border border-[#1f2434] rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
              Install to Home Screen
            </h3>
          </div>
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Works Offline</span>
          </span>
        </div>

        {isInstalled ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Installed as an app on this device. Fast offline access enabled!</span>
          </div>
        ) : (
          <div className="space-y-2.5">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Add this app to your phone or desktop home screen for one-tap access and offline use anywhere.
            </p>

            {isInstallable && (
              <button
                onClick={install}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Install App on this Device</span>
              </button>
            )}

            {isIOS && (
              <div>
                <button
                  onClick={() => setShowIOSGuide(true)}
                  className="w-full py-2 rounded-xl bg-[#181d2a] border border-[#272f44] text-amber-300 text-xs font-semibold transition"
                >
                  iPhone / iPad Installation Guide
                </button>

                {showIOSGuide && (
                  <div className="mt-2 p-3.5 rounded-xl bg-[#0a0c10] border border-[#222736] text-xs text-zinc-300 space-y-2">
                    <p className="font-semibold text-white">How to add to your iPhone/iPad:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-zinc-400 text-xs">
                      <li>Tap the <strong>Share</strong> button (box with arrow pointing up) at the bottom of Safari.</li>
                      <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                      <li>Tap <strong>Add</strong> in the top-right corner.</li>
                    </ol>
                    <button
                      onClick={() => setShowIOSGuide(false)}
                      className="text-xs text-amber-400 hover:underline pt-1"
                    >
                      Close guide
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </section>

      {/* =========================================================================
          SECTION 3: DATA BACKUP & RESTORE
         ========================================================================= */}
      <section className="bg-[#12151f] border border-[#1f2434] rounded-2xl p-4 shadow-sm space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-200">
          Your Data & Backups
        </h3>
        <p className="text-xs text-zinc-400 leading-relaxed">
          Your tasks and habits are saved securely on your device. You can download a backup copy anytime.
        </p>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleExportJson}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#181d2a] hover:bg-[#20273a] border border-[#272f44] text-xs text-zinc-200 transition"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Download Backup</span>
          </button>

          <label className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-[#181d2a] hover:bg-[#20273a] border border-[#272f44] text-xs text-zinc-200 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>Restore Backup</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
        </div>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-medium transition flex items-center justify-center gap-1.5 active:scale-98"
        >
          <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
          <span>Reset Sample Tasks & Habits</span>
        </button>
      </section>

      {/* =========================================================================
          SECTION 4: ADVANCED DEVELOPER / CLOUD DATABASE SETTINGS (COLLAPSIBLE)
         ========================================================================= */}
      <section className="bg-[#12151f] border border-[#1f2434] rounded-2xl p-4 shadow-sm space-y-3">
        <button
          onClick={() => setShowDevTools(!showDevTools)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-zinc-400" />
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Advanced: Cloud Sync & Database
              </h3>
              <p className="text-[11px] text-zinc-500">
                Optional Supabase PostgreSQL configuration & SQL migration script
              </p>
            </div>
          </div>
          <span className="text-xs text-amber-400 font-medium">
            {showDevTools ? 'Hide' : 'Configure'}
          </span>
        </button>

        {showDevTools && (
          <div className="pt-3 border-t border-[#1f2434] space-y-4 animate-in fade-in duration-150">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Connect your own Supabase project to sync your tasks and habits across multiple devices in real-time.
            </p>

            <div className="space-y-2.5">
              <div>
                <label className="block text-xs text-zinc-300 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  value={supabaseUrl}
                  onChange={(e) => setSupabaseUrl(e.target.value)}
                  placeholder="https://xyzcompany.supabase.co"
                  className="w-full bg-[#0a0c10] border border-[#242b3d] focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs text-zinc-300 mb-1">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  value={supabaseKey}
                  onChange={(e) => setSupabaseKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full bg-[#0a0c10] border border-[#242b3d] focus:border-amber-500 rounded-xl px-3 py-2 text-xs font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={handleSaveConfig}
                  className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition active:scale-95"
                >
                  Save Credentials
                </button>
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-3.5 py-2 rounded-xl bg-[#181d2a] hover:bg-[#20273a] border border-[#272f44] text-amber-300 text-xs transition"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                  )}
                  <span className="leading-snug">{testResult.message}</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-[#1f2434] space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-zinc-300">Database Schema (SQL)</h4>
                <button
                  onClick={handleCopySchema}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-medium hover:bg-amber-500/25 transition active:scale-95"
                >
                  {copiedSchema ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSchema ? 'Copied!' : 'Copy SQL'}</span>
                </button>
              </div>
              <p className="text-[11px] text-zinc-500">
                You can copy this SQL schema and run it directly in your Supabase SQL Editor.
              </p>
              <button
                onClick={() => setShowSqlViewer(!showSqlViewer)}
                className="w-full py-2 px-3 rounded-xl bg-[#0a0c10] border border-[#212738] text-xs text-zinc-400 hover:text-white flex items-center justify-between transition"
              >
                <span>{showSqlViewer ? 'Hide Full SQL Script' : 'Preview SQL Script'}</span>
                <Code2 className="w-4 h-4 text-amber-400" />
              </button>
              {showSqlViewer && (
                <pre className="p-3 rounded-xl bg-[#07090e] border border-[#1d2232] text-[10px] font-mono text-zinc-300 overflow-x-auto max-h-56 leading-relaxed">
                  {SUPABASE_SCHEMA_SQL}
                </pre>
              )}
            </div>
          </div>
        )}
      </section>

      {/* In-app Toast Banner */}
      {toastMessage && (
        <div
          className={`fixed bottom-24 left-4 right-4 max-w-sm mx-auto z-50 p-3 rounded-xl border shadow-xl text-xs font-mono flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-[#0f1914] border-emerald-500/40 text-emerald-300'
              : 'bg-[#1c0f13] border-rose-500/40 text-rose-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      {showResetConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={() => setShowResetConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-[#12151f] border border-[#2e374f] rounded-2xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5 text-rose-400">
              <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold font-mono uppercase tracking-tight">Confirm Reset</h4>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to restore the default starter demo tasks, habits, and streaks? Any local unsynced edits will be overwritten.
            </p>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="flex-1 py-2 rounded-xl bg-[#181d2a] hover:bg-[#20273a] text-zinc-300 text-xs font-mono transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmResetDemo}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs font-mono transition shadow-lg shadow-rose-600/20 active:scale-95"
              >
                Reset Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


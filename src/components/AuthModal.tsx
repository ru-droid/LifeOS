import React, { useState } from 'react';
import { X, Lock, Mail, KeyRound, AlertCircle, CheckCircle } from 'lucide-react';
import { getSupabaseClient } from '../lib/supabase';
import { storage } from '../lib/storage';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'signup' | 'magiclink'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const supabase = getSupabaseClient();

    try {
      if (mode === 'magiclink') {
        if (!email.trim()) throw new Error('Please provide a valid email address.');
        if (supabase) {
          const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
            options: { emailRedirectTo: window.location.origin },
          });
          if (error) throw error;
          setSuccessMsg(`Magic login link sent to ${email}! Check your inbox.`);
        } else {
          // Local simulation
          storage.setProfile({
            ...storage.getProfile(),
            email: email.trim(),
            full_name: email.split('@')[0],
          });
          setSuccessMsg(`Simulated magic link login for ${email}. Profile updated!`);
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 1000);
        }
      } else if (mode === 'signup') {
        if (!email.trim() || !password.trim()) throw new Error('Email and password are required.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');

        if (supabase) {
          const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password: password.trim(),
          });
          if (error) throw error;
          if (data.user) {
            storage.setProfile({
              id: data.user.id,
              email: data.user.email || email,
              full_name: email.split('@')[0],
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            setSuccessMsg('Account created! Signed in to cloud session.');
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 800);
          }
        } else {
          storage.setProfile({
            id: 'user_' + Math.random().toString(36).substring(2, 9),
            email: email.trim(),
            full_name: email.split('@')[0],
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setSuccessMsg('Created local account profile!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      } else {
        // Sign In
        if (!email.trim() || !password.trim()) throw new Error('Email and password are required.');

        if (supabase) {
          const { data, error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password: password.trim(),
          });
          if (error) throw error;
          if (data.user) {
            storage.setProfile({
              id: data.user.id,
              email: data.user.email || email,
              full_name: data.user.user_metadata?.full_name || email.split('@')[0],
              avatar_url: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
            setSuccessMsg('Signed in successfully!');
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 800);
          }
        } else {
          storage.setProfile({
            id: 'user_' + Math.random().toString(36).substring(2, 9),
            email: email.trim(),
            full_name: email.split('@')[0],
            avatar_url: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
          setSuccessMsg('Signed in to local session!');
          setTimeout(() => {
            onSuccess();
            onClose();
          }, 800);
        }
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#faf8f5] text-stone-900 border border-stone-200 rounded-t-[28px] sm:rounded-[28px] p-6 shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-stone-700" />
            <h3 className="text-sm font-bold text-stone-900">
              {mode === 'signin'
                ? 'Sign In to Your Account'
                : mode === 'signup'
                ? 'Create a Free Account'
                : 'Send Magic Email Link'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-stone-200/70 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('signin');
              setErrorMsg(null);
            }}
            className={`py-1.5 rounded-xl text-xs font-semibold transition ${
              mode === 'signin'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
            }}
            className={`py-1.5 rounded-xl text-xs font-semibold transition ${
              mode === 'signup'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            New Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('magiclink');
              setErrorMsg(null);
            }}
            className={`py-1.5 rounded-xl text-xs font-semibold transition ${
              mode === 'magiclink'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Magic Link
          </button>
        </div>

        {errorMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Email address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full bg-white border border-stone-300 focus:border-[#223326] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none transition shadow-xs"
              />
            </div>
          </div>

          {mode !== 'magiclink' && (
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Password</label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-white border border-stone-300 focus:border-[#223326] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none transition shadow-xs"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-xl bg-[#223326] hover:bg-[#2b4030] text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="animate-pulse">Processing...</span>
            ) : mode === 'signin' ? (
              'Sign In'
            ) : mode === 'signup' ? (
              'Create Account'
            ) : (
              'Send Magic Link'
            )}
          </button>
        </form>

        <p className="mt-3 text-xs text-stone-400 text-center">
          You can also continue using the app completely offline on your device without signing in.
        </p>
      </div>
    </div>
  );
};

import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { safeStorage } from './storage';

const STORAGE_URL_KEY = 'kairon_supabase_url';
const STORAGE_KEY_KEY = 'kairon_supabase_anon_key';

export function getSupabaseConfig(): { url: string; anonKey: string } {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

  const localUrl = safeStorage.getItem(STORAGE_URL_KEY) || '';
  const localKey = safeStorage.getItem(STORAGE_KEY_KEY) || '';

  return {
    url: localUrl || envUrl,
    anonKey: localKey || envKey,
  };
}

export function saveSupabaseConfig(url: string, anonKey: string): void {
  if (url && anonKey) {
    safeStorage.setItem(STORAGE_URL_KEY, url.trim());
    safeStorage.setItem(STORAGE_KEY_KEY, anonKey.trim());
  } else {
    safeStorage.removeItem(STORAGE_URL_KEY);
    safeStorage.removeItem(STORAGE_KEY_KEY);
  }
  reinitClient();
}

let clientInstance: SupabaseClient<Database> | null = null;

function initClient(): SupabaseClient<Database> | null {
  const { url, anonKey } = getSupabaseConfig();
  if (!url || !anonKey) {
    return null;
  }
  try {
    return createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!clientInstance) {
    clientInstance = initClient();
  }
  return clientInstance;
}

export function reinitClient(): SupabaseClient<Database> | null {
  clientInstance = initClient();
  return clientInstance;
}

export async function testSupabaseConnection(url: string, anonKey: string): Promise<{ success: boolean; message: string }> {
  try {
    const tempClient = createClient(url, anonKey);
    const { data: _, error } = await tempClient.from('profiles').select('id').limit(1);
    if (error && error.code !== 'PGRST116' && !error.message.includes('permission denied')) {
      // Note: If RLS denies anonymous read or table is empty, the connection is still valid!
      if (error.code === '42P01') {
        return { success: false, message: 'Connected to Supabase, but "profiles" table does not exist. Please run schema.sql in Supabase SQL editor.' };
      }
    }
    return { success: true, message: 'Successfully connected to Supabase endpoint.' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to reach Supabase project.' };
  }
}

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your secrets.');
}

// We use a dummy object to avoid "Cannot read properties of null" crashes
// while still allowing "if (supabase)" checks to behave correctly in JS.
// We cast to any to satisfy the complex SupabaseClient type requirements.
const dummyClient = {
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    signInWithPassword: () => Promise.resolve({ data: {}, error: new Error("Supabase not configured") }),
    signUp: () => Promise.resolve({ data: {}, error: new Error("Supabase not configured") }),
    signOut: () => Promise.resolve({ error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: () => Promise.resolve({ data: null, error: new Error("Supabase not configured") }),
        order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
      }),
      order: () => ({
        limit: () => Promise.resolve({ data: [], error: null }),
      }),
    }),
    insert: () => Promise.resolve({ error: new Error("Supabase not configured") }),
    update: () => ({ eq: () => Promise.resolve({ error: new Error("Supabase not configured") }) }),
    delete: () => ({ eq: () => ({ eq: () => Promise.resolve({ error: new Error("Supabase not configured") }) }) }),
  }),
  channel: () => ({
    on: () => ({
      on: () => ({
        subscribe: () => ({}),
      }),
      subscribe: () => ({}),
    }),
    subscribe: () => ({}),
  }),
  removeChannel: () => {},
  isDummy: true
} as any;

export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : dummyClient; 

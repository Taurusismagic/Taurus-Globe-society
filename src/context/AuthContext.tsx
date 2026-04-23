import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  display_name: string;
  avatar_url: string | null;
  city: string;
  latitude: number;
  longitude: number;
  user_type: 'business' | 'fun';
  bio: string | null;
  instagram_handle: string | null;
  twitter_handle: string | null;
  is_visible: boolean;
  tier: 'member' | 'paid';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  blockedIds: string[];
  whoBlockedMeIds: string[];
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshBlocks: () => Promise<void>;
  isAdmin: boolean;
}

const ADMIN_EMAIL = "allabouttaurus@gmail.com";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [whoBlockedMeIds, setWhoBlockedMeIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocks = async (uid: string) => {
    if (!supabase || supabase.isDummy) return;
    // Users I blocked
    const { data: myBlocks } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', uid);
    
    // Users who blocked me (to hide myself from them)
    const { data: blockedMe } = await supabase
      .from('blocks')
      .select('blocker_id')
      .eq('blocked_id', uid);

    if (myBlocks) setBlockedIds(myBlocks.map(b => b.blocked_id));
    if (blockedMe) setWhoBlockedMeIds(blockedMe.map(b => b.blocker_id));
  };

  const fetchProfile = async (uid: string) => {
    if (!supabase || supabase.isDummy) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    if (!supabase || supabase.isDummy) {
      setLoading(false);
      return;
    }

    // Initial check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([
          fetchProfile(session.user.id),
          fetchBlocks(session.user.id)
        ]);
      }
      setLoading(false);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setLoading(true);
      setUser(session?.user ?? null);
      if (session?.user) {
        await Promise.all([
          fetchProfile(session.user.id),
          fetchBlocks(session.user.id)
        ]);
      } else {
        setProfile(null);
        setBlockedIds([]);
        setWhoBlockedMeIds([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    if (supabase && !supabase.isDummy) await supabase.auth.signOut();
  };

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id);
  };

  const refreshBlocks = async () => {
    if (user) await fetchBlocks(user.id);
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <AuthContext.Provider value={{ user, profile, blockedIds, whoBlockedMeIds, loading, signOut, refreshProfile, refreshBlocks, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

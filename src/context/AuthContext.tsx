import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/errorUtils';

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
  is_banned?: boolean;
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
    const path = 'blocks';
    try {
      // Users I blocked
      const myBlocksQuery = query(collection(db, path), where('blocker_id', '==', uid));
      const myBlocksSnap = await getDocs(myBlocksQuery);
      
      // Users who blocked me (to hide myself from them)
      const blockedMeQuery = query(collection(db, path), where('blocked_id', '==', uid));
      const blockedMeSnap = await getDocs(blockedMeQuery);

      setBlockedIds(Array.from(new Set(myBlocksSnap.docs.map(doc => doc.data().blocked_id))));
      setWhoBlockedMeIds(Array.from(new Set(blockedMeSnap.docs.map(doc => doc.data().blocker_id))));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  };

  const fetchProfile = async (uid: string) => {
    const path = `profiles/${uid}`;
    try {
      const docRef = doc(db, 'profiles', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Profile;
        if (data.is_banned) {
          await firebaseSignOut(auth);
          setProfile(null);
          setUser(null);
          return;
        }
        setProfile({ id: docSnap.id, ...data } as Profile);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setUser(currentUser);
      if (currentUser) {
        await Promise.all([
          fetchProfile(currentUser.uid),
          fetchBlocks(currentUser.uid)
        ]);
      } else {
        setProfile(null);
        setBlockedIds([]);
        setWhoBlockedMeIds([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfile(user.uid);
  }, [user]);

  const refreshBlocks = useCallback(async () => {
    if (user) await fetchBlocks(user.uid);
  }, [user]);

  const isAdmin = useMemo(() => user?.email === ADMIN_EMAIL, [user?.email]);

  const value = useMemo(() => ({ 
    user, 
    profile, 
    blockedIds, 
    whoBlockedMeIds, 
    loading, 
    signOut, 
    refreshProfile, 
    refreshBlocks, 
    isAdmin 
  }), [user, profile, blockedIds, whoBlockedMeIds, loading, signOut, refreshProfile, refreshBlocks, isAdmin]);

  return (
    <AuthContext.Provider value={value}>
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

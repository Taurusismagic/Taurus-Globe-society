import { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { handleFirestoreError, OperationType } from "@/lib/errorUtils";

export function useMembers() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, blockedIds, whoBlockedMeIds } = useAuth();

  const allRelatedBlockIds = useMemo(() => [...blockedIds, ...whoBlockedMeIds], [blockedIds, whoBlockedMeIds]);

  useEffect(() => {
    setLoading(true);
    const path = 'profiles';
    const profilesRef = collection(db, path);
    // Only show people who are visible and NOT banned
    const q = query(profilesRef, where('is_visible', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const uniqueMap = new Map();
      snapshot.docs.forEach(doc => {
        const data = doc.data() as any;
        if (!data.is_banned && (!allRelatedBlockIds.length || !allRelatedBlockIds.includes(doc.id))) {
          uniqueMap.set(doc.id, { id: doc.id, ...data });
        }
      });
      
      setMembers(Array.from(uniqueMap.values()));
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [allRelatedBlockIds]);

  const globeMarkers = useMemo(() => members.map(m => ({
    location: [m.latitude, m.longitude] as [number, number],
    size: profile ? 0.08 : 0.04,
  })), [members, profile]);

  return { members, globeMarkers, loading };
}

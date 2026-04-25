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
    const q = query(profilesRef, where('is_visible', '==', true));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      let filteredDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Client-side filtering for blocks (Firestore 'not-in' is limited to 10 elements)
      if (allRelatedBlockIds.length > 0) {
        filteredDocs = filteredDocs.filter(d => !allRelatedBlockIds.includes(d.id));
      }

      setMembers(filteredDocs);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => unsubscribe();
  }, [allRelatedBlockIds]);

  const globeMarkers = members.map(m => ({
    location: [m.latitude, m.longitude] as [number, number],
    size: profile ? 0.08 : 0.04,
  }));

  return { members, globeMarkers, loading };
}

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "@/lib/errorUtils";

export interface Post {
  id: string;
  title: string;
  description?: string;
  email: string;
  city: string;
  latitude: number;
  longitude: number;
  flyer_url?: string;
  type: 'job' | 'event';
  created_at: any;
}

export function usePosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('created_at', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      setLoading(false);
      handleFirestoreError(error, OperationType.LIST, 'posts');
    });

    return () => unsubscribe();
  }, []);

  return { posts, loading };
}

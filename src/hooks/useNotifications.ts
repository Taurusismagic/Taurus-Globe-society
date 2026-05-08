import { useState, useEffect } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  serverTimestamp, 
  setDoc,
  getDoc,
  limit
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { handleFirestoreError, OperationType } from '@/lib/errorUtils';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'message' | 'task' | 'update';
  is_read: boolean;
  link?: string;
  created_at: any;
}

export interface NotificationPreferences {
  system_enabled: boolean;
  message_enabled: boolean;
  task_enabled: boolean;
  update_enabled: boolean;
  email_digest: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  system_enabled: true,
  message_enabled: true,
  task_enabled: true,
  update_enabled: true,
  email_digest: false,
};

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'profiles', userId, 'notifications');
    const q = query(notificationsRef, orderBy('created_at', 'desc'), limit(50));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      
      setNotifications(msgs);
      setUnreadCount(msgs.filter(m => !m.is_read).length);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `profiles/${userId}/notifications`);
    });

    // Fetch preferences
    const prefsRef = doc(db, 'profiles', userId, 'preferences', 'notifications');
    getDoc(prefsRef).then(docSnap => {
      if (docSnap.exists()) {
        setPreferences(docSnap.data() as NotificationPreferences);
      } else {
        // Initialize with defaults if not exists
        setDoc(prefsRef, DEFAULT_PREFERENCES).catch(err => {
          console.error("Failed to initialize preferences", err);
        });
      }
    });

    return () => unsubscribe();
  }, [userId]);

  const markAsRead = async (notificationId: string) => {
    if (!userId) return;
    const ref = doc(db, 'profiles', userId, 'notifications', notificationId);
    try {
      await updateDoc(ref, { is_read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `profiles/${userId}/notifications/${notificationId}`);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    const unread = notifications.filter(n => !n.is_read);
    const promises = unread.map(n => 
      updateDoc(doc(db, 'profiles', userId, 'notifications', n.id), { is_read: true })
    );
    try {
      await Promise.all(promises);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `profiles/${userId}/notifications`);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    if (!userId) return;
    const ref = doc(db, 'profiles', userId, 'notifications', notificationId);
    try {
      await deleteDoc(ref);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `profiles/${userId}/notifications/${notificationId}`);
    }
  };

  const updatePreferences = async (newPrefs: Partial<NotificationPreferences>) => {
    if (!userId) return;
    const updated = { ...preferences, ...newPrefs };
    setPreferences(updated);
    const ref = doc(db, 'profiles', userId, 'preferences', 'notifications');
    try {
      await setDoc(ref, updated, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `profiles/${userId}/preferences/notifications`);
    }
  };

  const sendMockNotification = async (type: Notification['type'], title: string, message: string) => {
    if (!userId) return;
    const ref = collection(db, 'profiles', userId, 'notifications');
    try {
      await addDoc(ref, {
        title,
        message,
        type,
        is_read: false,
        created_at: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `profiles/${userId}/notifications`);
    }
  };

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    updatePreferences,
    sendMockNotification
  };
}

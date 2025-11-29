import { useState, useEffect } from 'react';
import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface AarogyaDB extends DBSchema {
  doseEvents: {
    key: string;
    value: {
      id: string;
      medicationId: string;
      scheduledTime: string;
      takenAt?: string;
      status: 'pending' | 'taken' | 'missed' | 'skipped';
      verificationImageUrl?: string;
      notes?: string;
      synced: number; // 0 = not synced, 1 = synced
      createdAt: string;
    };
    indexes: { 'by-synced': number };
  };
  medications: {
    key: string;
    value: {
      id: string;
      name: string;
      strength: string;
      dosage: string;
      frequency: string;
      timing: string[];
      duration: string;
      instructions: string;
      imageUrl?: string;
      createdAt: string;
    };
  };
  reminders: {
    key: string;
    value: {
      id: string;
      medicationId: string;
      scheduledTime: string;
      message: string;
      tone: string;
      notified: boolean;
    };
    indexes: { 'by-time': string };
  };
}

export function useOfflineSync() {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [pendingCount, setPendingCount] = useState(0);
  const [db, setDb] = useState<IDBPDatabase<AarogyaDB> | null>(null);

  useEffect(() => {
    initDB();
  }, []);

  const initDB = async () => {
    const database = await openDB<AarogyaDB>('aarogya-db', 1, {
      upgrade(db) {
        // Dose events store
        if (!db.objectStoreNames.contains('doseEvents')) {
          const doseStore = db.createObjectStore('doseEvents', { keyPath: 'id' });
          doseStore.createIndex('by-synced', 'synced');
        }

        // Medications store
        if (!db.objectStoreNames.contains('medications')) {
          db.createObjectStore('medications', { keyPath: 'id' });
        }

        // Reminders store
        if (!db.objectStoreNames.contains('reminders')) {
          const reminderStore = db.createObjectStore('reminders', { keyPath: 'id' });
          reminderStore.createIndex('by-time', 'scheduledTime');
        }
      }
    });

    setDb(database);
    await checkPendingEvents(database);
  };

  const checkPendingEvents = async (database: IDBPDatabase<AarogyaDB>) => {
    const tx = database.transaction('doseEvents', 'readonly');
    const index = tx.store.index('by-synced');
    const pending = await index.getAll(IDBKeyRange.only(0));
    setPendingCount(pending.length);
  };

  const saveDoseEvent = async (event: any) => {
    if (!db) return;

    const eventWithSync = {
      ...event,
      synced: 0,
      createdAt: new Date().toISOString()
    };

    await db.put('doseEvents', eventWithSync);
    await checkPendingEvents(db);

    // Try to sync if online
    if (navigator.onLine) {
      await syncPendingEvents();
    }
  };

  const saveMedication = async (medication: any) => {
    if (!db) return;
    await db.put('medications', medication);
  };

  const getMedications = async () => {
    if (!db) return [];
    return await db.getAll('medications');
  };

  const saveReminder = async (reminder: any) => {
    if (!db) return;
    await db.put('reminders', reminder);
  };

  const getUpcomingReminders = async (hours: number = 24) => {
    if (!db) return [];
    
    const now = new Date();
    const future = new Date(now.getTime() + hours * 60 * 60 * 1000);
    
    const tx = db.transaction('reminders', 'readonly');
    const index = tx.store.index('by-time');
    const range = IDBKeyRange.bound(now.toISOString(), future.toISOString());
    
    return await index.getAll(range);
  };

  const syncPendingEvents = async () => {
    if (!db || !navigator.onLine) return;

    setSyncStatus('syncing');

    try {
      const tx = db.transaction('doseEvents', 'readonly');
      const index = tx.store.index('by-synced');
      const pending = await index.getAll(IDBKeyRange.only(0));

      // Get access token from session
      const supabase = (await import('../utils/supabase/client')).getSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.log('No auth session, skipping sync');
        setSyncStatus('idle');
        return;
      }

      const { getServerEndpoint, getAuthHeaders } = await import('../utils/supabase/client');

      for (const event of pending) {
        try {
          // POST to Supabase Edge Function
          const response = await fetch(getServerEndpoint('/dose-events'), {
            method: 'POST',
            headers: getAuthHeaders(session.access_token),
            body: JSON.stringify(event)
          });

          if (!response.ok) {
            console.error('Failed to sync event:', event.id);
            continue;
          }

          // Mark as synced
          const writeTx = db.transaction('doseEvents', 'readwrite');
          await writeTx.store.put({ ...event, synced: 1 });
          await writeTx.done;
        } catch (error) {
          console.error('Error syncing event:', error);
        }
      }

      await checkPendingEvents(db);
      setSyncStatus('idle');
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
    }
  };

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      syncPendingEvents();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [db]);

  return {
    syncStatus,
    pendingCount,
    saveDoseEvent,
    saveMedication,
    getMedications,
    saveReminder,
    getUpcomingReminders,
    syncPendingEvents
  };
}
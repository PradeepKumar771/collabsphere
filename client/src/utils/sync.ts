// Background Sync Orchestrator for CollabSphere PWA Offline Mutations
import { getOfflineMessages, clearOfflineMessage } from './db';
import type { OfflineMessage } from './db';

type SyncCallback = (msg: OfflineMessage) => Promise<boolean>;

let isSyncing = false;

export async function flushOfflineQueue(syncCallback: SyncCallback) {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;
  
  try {
    const queue = await getOfflineMessages();
    if (queue.length === 0) {
      isSyncing = false;
      return;
    }
    
    console.log(`🔌 Online! Synchronizing ${queue.length} offline-drafted message(s)...`);
    
    for (const msg of queue) {
      if (msg.id !== undefined) {
        const success = await syncCallback(msg);
        if (success) {
          await clearOfflineMessage(msg.id);
        }
      }
    }
    
    console.log('🏁 Offline message queue synchronized successfully!');
  } catch (error) {
    console.error('Error flushing offline message queue:', error);
  } finally {
    isSyncing = false;
  }
}

export function registerOnlineListener(syncCallback: SyncCallback) {
  if (typeof window === 'undefined') return;
  
  window.addEventListener('online', () => {
    flushOfflineQueue(syncCallback);
  });
}

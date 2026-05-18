// Pure TypeScript IndexedDB Wrapper for Offline-First Support on CollabSphere

export interface OfflineMessage {
  id?: number;
  gigId: string;
  content: string;
  createdAt: string;
}

export interface CachedPortfolio {
  id: string;
  title: string;
  description: string;
  skills: string[];
  mediaUrl?: string;
  updatedAt: string;
}

const DB_NAME = 'CollabSphereDB';
const DB_VERSION = 1;

export function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;
      
      // Store cached gigs
      if (!db.objectStoreNames.contains('gigs')) {
        db.createObjectStore('gigs', { keyPath: 'id' });
      }
      
      // Store portfolio details
      if (!db.objectStoreNames.contains('portfolio')) {
        db.createObjectStore('portfolio', { keyPath: 'id' });
      }
      
      // Store pending messages to send when back online
      if (!db.objectStoreNames.contains('messageQueue')) {
        db.createObjectStore('messageQueue', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

// Gigs Cache Methods
export async function cacheGigs(gigs: any[]): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('gigs', 'readwrite');
  const store = tx.objectStore('gigs');
  
  for (const gig of gigs) {
    store.put(gig);
  }
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedGigs(): Promise<any[]> {
  const db = await openDB();
  const tx = db.transaction('gigs', 'readonly');
  const store = tx.objectStore('gigs');
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Portfolio Cache Methods
export async function cachePortfolio(portfolio: CachedPortfolio): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('portfolio', 'readwrite');
  const store = tx.objectStore('portfolio');
  store.put(portfolio);
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getCachedPortfolio(id: string = 'me'): Promise<CachedPortfolio | null> {
  const db = await openDB();
  const tx = db.transaction('portfolio', 'readonly');
  const store = tx.objectStore('portfolio');
  const request = store.get(id);
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

// Offline Message Queue
export async function queueOfflineMessage(msg: OfflineMessage): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('messageQueue', 'readwrite');
  const store = tx.objectStore('messageQueue');
  store.add(msg);
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getOfflineMessages(): Promise<OfflineMessage[]> {
  const db = await openDB();
  const tx = db.transaction('messageQueue', 'readonly');
  const store = tx.objectStore('messageQueue');
  const request = store.getAll();
  
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function clearOfflineMessage(id: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('messageQueue', 'readwrite');
  const store = tx.objectStore('messageQueue');
  store.delete(id);
  
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

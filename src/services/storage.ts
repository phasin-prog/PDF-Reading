import { DocumentItem, ReadingProgress, UserBookmark } from '../types';

const DB_NAME = 'pdf_tts_offline_db';
const BOOKMARKS_STORAGE_KEY = 'pdf_tts_user_bookmarks';
const DB_VERSION = 1;
const STORE_NAME = 'documents';
const BUFFERS_STORE_NAME = 'pdf_buffers';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported on this browser'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, 2);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('lastReadAt', 'lastReadAt', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }
      if (!db.objectStoreNames.contains(BUFFERS_STORE_NAME)) {
        db.createObjectStore(BUFFERS_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export async function savePdfBuffer(docId: string, buffer: ArrayBuffer): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BUFFERS_STORE_NAME, 'readwrite');
      const store = tx.objectStore(BUFFERS_STORE_NAME);
      const req = store.put(buffer, docId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not save PDF buffer in IndexedDB:', err);
  }
}

export async function getPdfBuffer(docId: string): Promise<ArrayBuffer | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(BUFFERS_STORE_NAME, 'readonly');
      const store = tx.objectStore(BUFFERS_STORE_NAME);
      const req = store.get(docId);
      req.onsuccess = () => resolve((req.result as ArrayBuffer) || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Could not retrieve PDF buffer from IndexedDB:', err);
    return null;
  }
}

export async function saveDocument(doc: DocumentItem): Promise<void> {
  localStorage.removeItem('pdf_tts_library_cleared');
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(doc);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falling back to localStorage for saveDocument:', err);
    try {
      localStorage.setItem(`pdf_tts_doc_${doc.id}`, JSON.stringify(doc));
    } catch (e) {
      console.error('LocalStorage save failed:', e);
    }
  }
}

export async function getAllDocuments(): Promise<DocumentItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const docs = (req.result as DocumentItem[]) || [];
        docs.sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0));
        resolve(docs);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falling back to localStorage for getAllDocuments:', err);
    const docs: DocumentItem[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('pdf_tts_doc_')) {
        try {
          const item = JSON.parse(localStorage.getItem(key) || '');
          if (item?.id) docs.push(item);
        } catch {
          // ignore corrupted items
        }
      }
    }
    docs.sort((a, b) => (b.lastReadAt || 0) - (a.lastReadAt || 0));
    return docs;
  }
}

export async function getDocument(id: string): Promise<DocumentItem | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falling back to localStorage for getDocument:', err);
    const val = localStorage.getItem(`pdf_tts_doc_${id}`);
    if (val) {
      try {
        return JSON.parse(val);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function deleteDocument(id: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falling back to localStorage for deleteDocument:', err);
  }
  
  localStorage.removeItem(`pdf_tts_doc_${id}`);

  // Clean up bookmarks for this document
  try {
    const bookmarks = getUserBookmarks();
    const updatedBookmarks = bookmarks.filter((b) => b.documentId !== id);
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updatedBookmarks));
  } catch (e) {
    console.error('Failed to clean up bookmarks after doc deletion:', e);
  }

  // Check remaining docs to mark library cleared if empty
  const remaining = await getAllDocuments();
  if (remaining.length === 0) {
    localStorage.setItem('pdf_tts_library_cleared', 'true');
  }
}

export async function deleteAllDocuments(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.clear();

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Falling back to localStorage for deleteAllDocuments:', err);
  }

  // Clear localStorage keys
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const key = localStorage.key(i);
    if (key?.startsWith('pdf_tts_doc_')) {
      localStorage.removeItem(key);
    }
  }

  // Clear bookmarks
  localStorage.removeItem(BOOKMARKS_STORAGE_KEY);
  localStorage.setItem('pdf_tts_library_cleared', 'true');
}

export async function updateReadingProgress(id: string, progress: ReadingProgress): Promise<void> {
  const doc = await getDocument(id);
  if (!doc) return;
  doc.readingProgress = progress;
  doc.lastReadAt = Date.now();
  await saveDocument(doc);
}

// User Bookmarks Functions
export function getUserBookmarks(): UserBookmark[] {
  try {
    const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as UserBookmark[];
  } catch (e) {
    console.error('Failed to load bookmarks from localStorage:', e);
    return [];
  }
}

export function saveUserBookmark(bookmark: UserBookmark): UserBookmark[] {
  const current = getUserBookmarks();
  const filtered = current.filter((b) => b.id !== bookmark.id);
  const updated = [bookmark, ...filtered];
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save bookmark:', e);
  }
  return updated;
}

export function deleteUserBookmark(id: string): UserBookmark[] {
  const current = getUserBookmarks();
  const updated = current.filter((b) => b.id !== id);
  try {
    localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to delete bookmark:', e);
  }
  return updated;
}

export function isPageBookmarked(documentId: string, pageIndex: number): boolean {
  const current = getUserBookmarks();
  return current.some((b) => b.documentId === documentId && b.pageIndex === pageIndex);
}

export function toggleUserBookmark(doc: DocumentItem, pageIndex: number): { isBookmarked: boolean; bookmarks: UserBookmark[] } {
  const current = getUserBookmarks();
  const existingIndex = current.findIndex((b) => b.documentId === doc.id && b.pageIndex === pageIndex);

  if (existingIndex !== -1) {
    const bookmarkId = current[existingIndex].id;
    const updated = deleteUserBookmark(bookmarkId);
    return { isBookmarked: false, bookmarks: updated };
  } else {
    const page = doc.pages[pageIndex];
    const snippet = page?.text ? page.text.slice(0, 160) + '...' : `หน้า ${pageIndex + 1}`;
    const newBookmark: UserBookmark = {
      id: `bm_${doc.id}_p${pageIndex}_${Date.now()}`,
      documentId: doc.id,
      documentName: doc.name,
      pageIndex,
      pageNumber: page?.pageNumber || pageIndex + 1,
      snippet,
      createdAt: Date.now(),
      chapterTitle: page?.chapterTitle,
    };
    const updated = saveUserBookmark(newBookmark);
    return { isBookmarked: true, bookmarks: updated };
  }
}

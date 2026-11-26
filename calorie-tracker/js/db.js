// IndexedDB storage for meals, photos, activities, custom foods and weigh-ins.
// Settings live in localStorage (see settings.js).

const DB_NAME = 'calorie-tracker';
const DB_VERSION = 1;
const STORES = {
  meals: { keyPath: 'id', indexes: [['date', 'date']] },
  photos: { keyPath: 'id' },
  activities: { keyPath: 'id', indexes: [['date', 'date']] },
  foods: { keyPath: 'id' },
  weights: { keyPath: 'date' },
};

let dbPromise = null;

export function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      for (const [name, def] of Object.entries(STORES)) {
        if (!db.objectStoreNames.contains(name)) {
          const store = db.createObjectStore(name, { keyPath: def.keyPath });
          for (const [idx, key] of def.indexes || []) store.createIndex(idx, key);
        }
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(store, mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(store, mode);
        const s = t.objectStore(store);
        let result;
        Promise.resolve(fn(s)).then((r) => (result = r));
        t.oncomplete = () => resolve(result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      })
  );
}

function reqP(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const put = (store, value) => tx(store, 'readwrite', (s) => reqP(s.put(value)));
export const get = (store, key) => tx(store, 'readonly', (s) => reqP(s.get(key)));
export const del = (store, key) => tx(store, 'readwrite', (s) => reqP(s.delete(key)));
export const getAll = (store) => tx(store, 'readonly', (s) => reqP(s.getAll()));
export const clear = (store) => tx(store, 'readwrite', (s) => reqP(s.clear()));

export function getByDate(store, date) {
  return tx(store, 'readonly', (s) => reqP(s.index('date').getAll(date)));
}

export function getByDateRange(store, from, to) {
  return tx(store, 'readonly', (s) => reqP(s.index('date').getAll(IDBKeyRange.bound(from, to))));
}

export function uid(prefix = '') {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Ask the browser not to evict our data when storage is low. */
export async function requestPersistence() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      const already = await navigator.storage.persisted();
      if (already) return true;
      return await navigator.storage.persist();
    }
  } catch (e) {
    /* ignore */
  }
  return false;
}

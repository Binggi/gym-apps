// Penyimpanan di HP (IndexedDB). Datanya kecil, jadi semua dimuat ke memori saat aplikasi dibuka
// dan setiap perubahan langsung ditulis balik (write-through).
import { BACKUP_APP, BACKUP_VERSION, validateBackup } from './logic.js';

const DB_NAME = 'catatan-gym';
const STORES = { workouts: 'id', body: 'date', daily: 'date' };

let db;
export const state = { workouts: [], body: [], daily: [] };

function req(r) {
  return new Promise((resolve, reject) => { r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error); });
}

function tx(store, mode = 'readonly') {
  return db.transaction(store, mode).objectStore(store);
}

export async function open() {
  const r = indexedDB.open(DB_NAME, 1);
  r.onupgradeneeded = () => {
    for (const [name, keyPath] of Object.entries(STORES)) {
      if (!r.result.objectStoreNames.contains(name)) r.result.createObjectStore(name, { keyPath });
    }
  };
  db = await req(r);
  for (const name of Object.keys(STORES)) state[name] = await req(tx(name).getAll());
  // Minta browser tidak menghapus data saat memori HP penuh. Jangan ditunggu:
  // di beberapa browser janji ini tidak pernah selesai, dan aplikasi akan macet di "Memuat…".
  try { navigator.storage?.persist?.().catch(() => {}); } catch { /* tidak didukung */ }
}

/** Simpan / perbarui satu catatan dan sinkronkan dengan state di memori. */
export async function put(store, obj) {
  const key = STORES[store];
  const list = state[store];
  const i = list.findIndex((x) => x[key] === obj[key]);
  if (i >= 0) list[i] = obj; else list.push(obj);
  await req(tx(store, 'readwrite').put(obj));
  return obj;
}

export async function remove(store, keyValue) {
  const key = STORES[store];
  state[store] = state[store].filter((x) => x[key] !== keyValue);
  await req(tx(store, 'readwrite').delete(keyValue));
}

export const find = (store, keyValue) => state[store].find((x) => x[STORES[store]] === keyValue);

export function exportData() {
  return { app: BACKUP_APP, version: BACKUP_VERSION, exportedAt: new Date().toISOString(), ...structuredClone(state) };
}

/** Ganti semua data dengan isi cadangan (setelah divalidasi). */
export async function importData(data) {
  validateBackup(data);
  const t = db.transaction(Object.keys(STORES), 'readwrite');
  for (const name of Object.keys(STORES)) {
    const s = t.objectStore(name);
    s.clear();
    for (const row of data[name]) s.put(row);
  }
  await new Promise((resolve, reject) => { t.oncomplete = resolve; t.onerror = () => reject(t.error); t.onabort = () => reject(t.error); });
  for (const name of Object.keys(STORES)) state[name] = structuredClone(data[name]);
}

export async function storageInfo() {
  try {
    const [est, persisted] = await Promise.all([navigator.storage?.estimate?.(), navigator.storage?.persisted?.()]);
    return { usage: est?.usage ?? null, persisted: !!persisted };
  } catch {
    return { usage: null, persisted: false };
  }
}

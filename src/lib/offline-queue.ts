"use client";

export interface QueuedAction {
  id: string;
  type: "payment" | "resident_add" | "vacate" | "transfer";
  payload: any;
  timestamp: number;
  status: "pending" | "syncing" | "synced" | "failed";
}

const DB_NAME = "amh_offline_db";
const STORE_NAME = "queued_actions";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB not supported"));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function enqueueAction(
  type: QueuedAction["type"],
  payload: any
): Promise<QueuedAction> {
  const action: QueuedAction = {
    id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    type,
    payload,
    timestamp: Date.now(),
    status: "pending",
  };

  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).add(action);
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  } catch (err) {
    console.warn("Failed to store action in IndexedDB, fallback to localStorage", err);
    try {
      const existing = JSON.parse(localStorage.getItem("amh_offline_queue") || "[]");
      existing.push(action);
      localStorage.setItem("amh_offline_queue", JSON.stringify(existing));
    } catch (e) {
      console.error(e);
    }
  }

  return action;
}

export async function getPendingActions(): Promise<QueuedAction[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    try {
      return JSON.parse(localStorage.getItem("amh_offline_queue") || "[]");
    } catch {
      return [];
    }
  }
}

export async function removeAction(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
    });
  } catch {
    try {
      const existing: QueuedAction[] = JSON.parse(
        localStorage.getItem("amh_offline_queue") || "[]"
      );
      const filtered = existing.filter((a) => a.id !== id);
      localStorage.setItem("amh_offline_queue", JSON.stringify(filtered));
    } catch {}
  }
}

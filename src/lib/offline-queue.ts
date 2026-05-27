import type { QueuedDevisPayload } from "./schemas/forms";

export interface QueuedDevis {
  id: string;
  payload: QueuedDevisPayload;
  createdAt: string;
}

const STORAGE_KEY = "devispropre-offline-devis";

function readQueue(): QueuedDevis[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as QueuedDevis[]) : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueuedDevis[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function isBrowserOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export function enqueueDevis(payload: QueuedDevisPayload): string {
  const id = crypto.randomUUID();
  const item: QueuedDevis = { id, payload, createdAt: new Date().toISOString() };
  writeQueue([...readQueue(), item]);
  return id;
}

export function listQueuedDevis(): QueuedDevis[] {
  return readQueue();
}

export function queuedDevisCount(): number {
  return readQueue().length;
}

export function removeQueuedDevis(id: string): void {
  writeQueue(readQueue().filter((q) => q.id !== id));
}

/** Synchronise la file d'attente locale vers l'API. */
export async function flushOfflineQueue(): Promise<{ synced: number; failed: number }> {
  let synced = 0;
  let failed = 0;

  for (const item of readQueue()) {
    try {
      let clientId = item.payload.clientId;

      if (item.payload.newClient?.trim()) {
        const cr = await fetch("/api/clients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nom: item.payload.newClient.trim() }),
        });
        if (!cr.ok) throw new Error("client");
        const client = await cr.json();
        clientId = client.id;
      }

      const res = await fetch("/api/devis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, lignes: item.payload.lignes }),
      });

      if (!res.ok) throw new Error("devis");
      removeQueuedDevis(item.id);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  return { synced, failed };
}

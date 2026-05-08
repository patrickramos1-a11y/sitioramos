import { openDB, DBSchema, IDBPDatabase } from "idb";
import { supabase } from "@/integrations/supabase/client";

interface QueuedAttachment {
  kind: "audio" | "photo" | "video";
  blob: Blob;
  mime_type: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
}

export interface QueuedJournalPoint {
  nome: string;
  observacao: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  captured_at: string;
  ordem: number;
  manual: boolean;
  geometry_type: string;
  coordinates: any | null;
}

export interface QueuedJournalEntry {
  id: string;
  createdAt: number;
  entry: Record<string, any>;
  attachments: QueuedAttachment[];
  points?: QueuedJournalPoint[];
}

interface OfflineDB extends DBSchema {
  journal_queue: {
    key: string;
    value: QueuedJournalEntry;
  };
}

const BUCKET = "journal-media";
let dbPromise: Promise<IDBPDatabase<OfflineDB>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineDB>("sitio-ramos-offline", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("journal_queue")) {
          db.createObjectStore("journal_queue", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export async function enqueueJournalEntry(
  entry: Record<string, any>,
  attachments: QueuedAttachment[],
  points: QueuedJournalPoint[] = [],
): Promise<string> {
  const db = await getDb();
  const id = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.put("journal_queue", { id, createdAt: Date.now(), entry, attachments, points });
  notify();
  return id;
}

export async function getQueueCount(): Promise<number> {
  try {
    const db = await getDb();
    return await db.count("journal_queue");
  } catch {
    return 0;
  }
}

export async function listQueue(): Promise<QueuedJournalEntry[]> {
  const db = await getDb();
  return await db.getAll("journal_queue");
}

async function uploadOne(item: QueuedJournalEntry) {
  const { data: row, error } = await supabase
    .from("journal_entries" as any)
    .insert(item.entry as any)
    .select()
    .single();
  if (error) throw error;
  const entryId = (row as any).id as string;

  for (let i = 0; i < item.attachments.length; i++) {
    const att = item.attachments[i];
    const ext = att.mime_type.split("/")[1]?.split(";")[0] || "bin";
    const folder = att.kind === "audio" ? "audios" : att.kind === "photo" ? "photos" : "videos";
    const path = `${folder}/${entryId}/${Date.now()}-${i}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from(BUCKET)
      .upload(path, att.blob, { contentType: att.mime_type, upsert: false });
    if (upErr) throw upErr;
    const { error: attErr } = await supabase.from("journal_attachments" as any).insert({
      entry_id: entryId,
      kind: att.kind,
      storage_path: path,
      mime_type: att.mime_type,
      duration_seconds: att.duration_seconds ?? null,
      size_bytes: att.blob.size,
      width: att.width ?? null,
      height: att.height ?? null,
    } as any);
    if (attErr) throw attErr;
  }
}

let syncing = false;
export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  if (syncing || !navigator.onLine) return { synced: 0, failed: 0 };
  syncing = true;
  let synced = 0;
  let failed = 0;
  try {
    const db = await getDb();
    const items = await db.getAll("journal_queue");
    for (const item of items) {
      try {
        await uploadOne(item);
        await db.delete("journal_queue", item.id);
        synced++;
        notify();
      } catch (e) {
        console.warn("Falha ao sincronizar registro offline", e);
        failed++;
      }
    }
  } finally {
    syncing = false;
  }
  return { synced, failed };
}

// --- pub/sub simples ---
type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribeQueue(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach((l) => l());
}

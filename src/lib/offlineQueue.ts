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

export interface QueuedDiaryGeometry {
  geometry_type: string;
  name: string | null;
  description: string | null;
  geojson: any;
  area_m2: number | null;
  length_m: number | null;
  ordem: number;
}

export interface QueuedJournalEntry {
  id: string;
  createdAt: number;
  updatedAt: number;
  status: "pending" | "syncing" | "error";
  attempts: number;
  lastError: string | null;
  localEntryId: string;
  entry: Record<string, any>;
  attachments: QueuedAttachment[];
  points?: QueuedJournalPoint[];
  geometries?: QueuedDiaryGeometry[];
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
    dbPromise = openDB<OfflineDB>("sitio-ramos-offline", 2, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains("journal_queue")) {
          db.createObjectStore("journal_queue", { keyPath: "id" });
        }
        if (oldVersion < 2) {
          const tx = (db as any).transaction?.("journal_queue", "readwrite");
          if (tx) {
            const store = tx.objectStore("journal_queue");
            store.getAll().onsuccess = (event: any) => {
              const items = event.target.result || [];
              items.forEach((item: any) => {
                store.put({
                  ...item,
                  updatedAt: item.updatedAt || item.createdAt || Date.now(),
                  status: item.status || "pending",
                  attempts: item.attempts || 0,
                  lastError: item.lastError || null,
                  localEntryId: item.localEntryId || item.id,
                });
              });
            };
          }
        }
      },
    });
  }
  return dbPromise;
}

function makeLocalEntryId() {
  return `offline-entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function enqueueJournalEntry(
  entry: Record<string, any>,
  attachments: QueuedAttachment[],
  points: QueuedJournalPoint[] = [],
  geometries: QueuedDiaryGeometry[] = [],
): Promise<string> {
  const db = await getDb();
  const now = Date.now();
  const id = `q_${now}_${Math.random().toString(36).slice(2, 8)}`;
  await db.put("journal_queue", {
    id,
    createdAt: now,
    updatedAt: now,
    status: "pending",
    attempts: 0,
    lastError: null,
    localEntryId: makeLocalEntryId(),
    entry,
    attachments,
    points,
    geometries,
  });
  notify();
  return id;
}

export async function getQueueCount(): Promise<number> {
  try {
    const db = await getDb();
    const items = await db.getAll("journal_queue");
    return items.filter((item) => item.status !== "syncing").length;
  } catch {
    return 0;
  }
}

export async function listQueue(): Promise<QueuedJournalEntry[]> {
  const db = await getDb();
  return await db.getAll("journal_queue");
}

export async function getQueueState(): Promise<{
  pending: number;
  syncing: number;
  failed: number;
  lastError: string | null;
}> {
  try {
    const items = await listQueue();
    return {
      pending: items.filter((item) => item.status === "pending").length,
      syncing: items.filter((item) => item.status === "syncing").length,
      failed: items.filter((item) => item.status === "error").length,
      lastError: items.find((item) => item.lastError)?.lastError || null,
    };
  } catch {
    return { pending: 0, syncing: 0, failed: 0, lastError: null };
  }
}

async function updateQueueItem(id: string, patch: Partial<QueuedJournalEntry>) {
  const db = await getDb();
  const current = await db.get("journal_queue", id);
  if (!current) return;
  await db.put("journal_queue", {
    ...current,
    ...patch,
    updatedAt: Date.now(),
  });
  notify();
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

  if (item.points && item.points.length) {
    const rows = item.points.map((p, i) => ({
      entry_id: entryId,
      nome: p.nome,
      observacao: p.observacao,
      latitude: p.latitude,
      longitude: p.longitude,
      accuracy: p.accuracy,
      captured_at: p.captured_at,
      ordem: i,
      manual: p.manual,
      geometry_type: p.geometry_type,
      coordinates: p.coordinates,
    }));
    const { error: ptErr } = await supabase.from("journal_points" as any).insert(rows as any);
    if (ptErr) throw ptErr;
  }

  if (item.geometries && item.geometries.length) {
    const grows = item.geometries.map((g, i) => ({
      entry_id: entryId,
      geometry_type: g.geometry_type,
      name: g.name,
      description: g.description,
      geojson: g.geojson,
      area_m2: g.area_m2,
      length_m: g.length_m,
      ordem: i,
      responsavel_id: null,
    }));
    const { error: gErr } = await supabase.from("diary_geometries" as any).insert(grows as any);
    if (gErr) throw gErr;
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
    const ordered = items.sort((a, b) => a.createdAt - b.createdAt);

    for (const item of ordered) {
      try {
        await updateQueueItem(item.id, {
          status: "syncing",
          attempts: item.attempts + 1,
          lastError: null,
        });
        await uploadOne(item);
        await db.delete("journal_queue", item.id);
        synced++;
        notify();
      } catch (error: any) {
        failed++;
        await updateQueueItem(item.id, {
          status: "error",
          lastError: error?.message || "Falha ao sincronizar item offline.",
        });
        console.warn("Falha ao sincronizar registro offline", error);
      }
    }
  } finally {
    syncing = false;
    notify();
  }
  return { synced, failed };
}

export async function retryErroredQueueItems() {
  const db = await getDb();
  const items = await db.getAll("journal_queue");
  await Promise.all(
    items
      .filter((item) => item.status === "error")
      .map((item) =>
        db.put("journal_queue", {
          ...item,
          status: "pending",
          updatedAt: Date.now(),
        }),
      ),
  );
  notify();
}

type Listener = () => void;
const listeners = new Set<Listener>();
export function subscribeQueue(fn: Listener) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
function notify() {
  listeners.forEach((listener) => listener());
}

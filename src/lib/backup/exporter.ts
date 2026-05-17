import { supabase } from "@/integrations/supabase/client";
import {
  BACKUP_TABLES,
  BACKUP_VERSION,
  SCHEMA_VERSION,
  type BackupFile,
} from "./schema";

const PAGE = 1000;

async function fetchAll(table: string): Promise<any[]> {
  const all: any[] = [];
  let from = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { data, error } = await (supabase as any)
      .from(table)
      .select("*")
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`[${table}] ${error.message}`);
    if (!data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

export async function exportAllData(
  onProgress?: (table: string, idx: number, total: number) => void
): Promise<BackupFile> {
  const data: Record<string, any[]> = {};
  const counts: Record<string, number> = {};
  for (let i = 0; i < BACKUP_TABLES.length; i++) {
    const t = BACKUP_TABLES[i];
    onProgress?.(t, i, BACKUP_TABLES.length);
    try {
      const rows = await fetchAll(t);
      data[t] = rows;
      counts[t] = rows.length;
    } catch (err: any) {
      // Skip tables that fail (e.g. dropped) but record empty
      console.warn("export failed for", t, err?.message);
      data[t] = [];
      counts[t] = 0;
    }
  }
  return {
    manifest: {
      app: "Sítio Ramos",
      backup_version: BACKUP_VERSION,
      schema_version: SCHEMA_VERSION,
      generated_at: new Date().toISOString(),
      backup_id: crypto.randomUUID(),
      counts,
      description: "Backup JSON dos dados estruturados",
    },
    data,
  };
}

export function downloadBackup(file: BackupFile) {
  const blob = new Blob([JSON.stringify(file, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date()
    .toISOString()
    .replace(/[:T]/g, "-")
    .slice(0, 16);
  a.href = url;
  a.download = `sitio-ramos-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

import { supabase } from "@/integrations/supabase/client";
import {
  BACKUP_TABLES,
  BACKUP_VERSION,
  type BackupFile,
} from "./schema";

const BATCH = 500;
const LS_IMPORTED = "backup_imported_ids";

export interface ValidationResult {
  ok: boolean;
  error?: string;
  file?: BackupFile;
  totalRows?: number;
  counts?: Record<string, number>;
  alreadyImported?: boolean;
  envHasData?: boolean;
}

export interface ImportReport {
  startedAt: string;
  finishedAt: string;
  totalInserted: number;
  totalSkipped: number;
  totalErrors: number;
  perTable: Record<
    string,
    { inserted: number; skipped: number; errors: { id?: string; message: string }[] }
  >;
}

export async function parseAndValidate(fileText: string): Promise<ValidationResult> {
  let parsed: any;
  try {
    parsed = JSON.parse(fileText);
  } catch {
    return { ok: false, error: "Arquivo não é um JSON válido." };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Arquivo de backup inválido." };
  }
  const { manifest, data } = parsed;
  if (!manifest || typeof manifest !== "object") {
    return { ok: false, error: "Manifest ausente no arquivo." };
  }
  if (!data || typeof data !== "object") {
    return { ok: false, error: "Bloco de dados ausente no arquivo." };
  }
  if (!manifest.backup_version) {
    return { ok: false, error: "Versão de backup ausente." };
  }
  const major = String(manifest.backup_version).split(".")[0];
  const currentMajor = BACKUP_VERSION.split(".")[0];
  if (major !== currentMajor) {
    return {
      ok: false,
      error: `Versão incompatível (arquivo: ${manifest.backup_version}, atual: ${BACKUP_VERSION}).`,
    };
  }

  const counts: Record<string, number> = {};
  let total = 0;
  for (const t of BACKUP_TABLES) {
    const rows = Array.isArray(data[t]) ? data[t] : [];
    counts[t] = rows.length;
    total += rows.length;
  }
  if (total === 0) {
    return { ok: false, error: "Backup vazio: nenhum registro encontrado." };
  }

  const importedIds: string[] = JSON.parse(
    localStorage.getItem(LS_IMPORTED) ?? "[]"
  );
  const alreadyImported = manifest.backup_id
    ? importedIds.includes(manifest.backup_id)
    : false;

  // Quick env-has-data probe
  let envHasData = false;
  for (const t of ["areas", "cycles", "cash_transactions"]) {
    const { count } = await (supabase as any)
      .from(t)
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) > 0) {
      envHasData = true;
      break;
    }
  }

  return {
    ok: true,
    file: parsed as BackupFile,
    totalRows: total,
    counts,
    alreadyImported,
    envHasData,
  };
}

export async function runImport(
  file: BackupFile,
  onProgress?: (table: string, done: number, total: number) => void
): Promise<ImportReport> {
  const startedAt = new Date().toISOString();
  const report: ImportReport = {
    startedAt,
    finishedAt: "",
    totalInserted: 0,
    totalSkipped: 0,
    totalErrors: 0,
    perTable: {},
  };

  for (let i = 0; i < BACKUP_TABLES.length; i++) {
    const t = BACKUP_TABLES[i];
    const rows: any[] = Array.isArray(file.data[t]) ? file.data[t] : [];
    const stat = { inserted: 0, skipped: 0, errors: [] as { id?: string; message: string }[] };
    report.perTable[t] = stat;
    onProgress?.(t, i, BACKUP_TABLES.length);

    if (rows.length === 0) continue;

    for (let off = 0; off < rows.length; off += BATCH) {
      const chunk = rows.slice(off, off + BATCH);
      const { error, data: ret } = await (supabase as any)
        .from(t)
        .upsert(chunk, { onConflict: "id", ignoreDuplicates: true })
        .select("id");
      if (error) {
        // Fall back to per-row to isolate failures
        for (const row of chunk) {
          const { error: e2 } = await (supabase as any)
            .from(t)
            .upsert(row, { onConflict: "id", ignoreDuplicates: true });
          if (e2) {
            stat.errors.push({ id: row?.id, message: e2.message });
            report.totalErrors++;
          } else {
            stat.inserted++;
            report.totalInserted++;
          }
        }
      } else {
        const inserted = ret?.length ?? 0;
        stat.inserted += inserted;
        stat.skipped += chunk.length - inserted;
        report.totalInserted += inserted;
        report.totalSkipped += chunk.length - inserted;
      }
    }
  }

  report.finishedAt = new Date().toISOString();

  // Mark as imported
  if (file.manifest?.backup_id) {
    const ids: string[] = JSON.parse(localStorage.getItem(LS_IMPORTED) ?? "[]");
    if (!ids.includes(file.manifest.backup_id)) {
      ids.push(file.manifest.backup_id);
      localStorage.setItem(LS_IMPORTED, JSON.stringify(ids));
    }
  }

  return report;
}

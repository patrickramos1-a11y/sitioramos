// Ordered list of tables for backup export/import.
// Order matters for import: parents before children to keep FKs consistent.
// Excluded by design (Phase 1): journal_attachments (files), auth.*, storage.*, secrets.
export const BACKUP_TABLES = [
  "propriedade",
  "responsaveis",
  "contatos",
  "talhoes",
  "areas",
  "cycles",
  "cycle_stages",
  "cycle_stage_history",
  "cycle_area_allocations",
  "culture_cost_templates",
  "stage_templates",
  "fin_naturezas",
  "fin_centros_custo",
  "fin_categorias",
  "fin_projetos_investimento",
  "loans",
  "installments",
  "costs",
  "revenues",
  "investments",
  "cash_transactions",
  "fin_classificacoes",
  "operational_stages",
  "operational_tasks",
  "task_checklist_items",
  "task_logs",
  "operation_change_logs",
  "journal_entries",
  "journal_points",
  "diary_geometries",
  "territorial_events",
] as const;

export type BackupTable = (typeof BACKUP_TABLES)[number];

export const BACKUP_VERSION = "1.0";
export const SCHEMA_VERSION = "1";

export interface BackupManifest {
  app: string;
  backup_version: string;
  schema_version: string;
  generated_at: string;
  backup_id: string;
  counts: Record<string, number>;
  description?: string;
}

export interface BackupFile {
  manifest: BackupManifest;
  data: Record<string, any[]>;
}

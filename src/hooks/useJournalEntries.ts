import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface JournalAttachment {
  id: string;
  entry_id: string;
  kind: "audio" | "photo" | "video";
  storage_path: string;
  mime_type: string | null;
  duration_seconds: number | null;
  size_bytes: number | null;
  width: number | null;
  height: number | null;
  created_at: string;
  url?: string;
}

export interface JournalEntry {
  id: string;
  entry_date: string;
  area_id: string | null;
  cycle_id: string | null;
  entry_type: string;
  title: string | null;
  description: string | null;
  responsavel_id: string | null;
  notes: string | null;
  status: string;
  reviewed: boolean;
  tags: string[];
  weather: string | null;
  is_important: boolean;
  latitude: number | null;
  longitude: number | null;
  location_accuracy: number | null;
  created_at: string;
  updated_at: string;
  attachments?: JournalAttachment[];
}

export type JournalEntryInsert = Partial<Omit<JournalEntry, "id" | "created_at" | "updated_at" | "attachments">>;

export interface PendingAttachment {
  kind: "audio" | "photo" | "video";
  blob: Blob;
  mime_type: string;
  duration_seconds?: number;
  width?: number;
  height?: number;
}

export interface JournalFilters {
  dateFrom?: string;
  dateTo?: string;
  type?: string;
  areaId?: string;
  cycleId?: string;
  reviewed?: boolean;
  important?: boolean;
}

const BUCKET = "journal-media";

function publicUrl(path: string) {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export function useJournalEntries(limit?: number, filters?: JournalFilters) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["journal_entries", limit ?? "all", filters ?? {}],
    queryFn: async () => {
      let q = supabase
        .from("journal_entries" as any)
        .select("*, journal_attachments(*)")
        .order("created_at", { ascending: false });
      if (filters?.dateFrom) q = q.gte("entry_date", filters.dateFrom);
      if (filters?.dateTo) q = q.lte("entry_date", filters.dateTo);
      if (filters?.type) q = q.eq("entry_type", filters.type);
      if (filters?.areaId) q = q.eq("area_id", filters.areaId);
      if (filters?.cycleId) q = q.eq("cycle_id", filters.cycleId);
      if (typeof filters?.reviewed === "boolean") q = q.eq("reviewed", filters.reviewed);
      if (filters?.important) q = q.eq("is_important", true);
      if (limit) q = q.limit(limit);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []).map((row: any) => ({
        ...row,
        attachments: (row.journal_attachments || []).map((a: any) => ({
          ...a,
          url: publicUrl(a.storage_path),
        })),
      })) as JournalEntry[];
    },
  });

  const create = useMutation({
    mutationFn: async ({
      entry,
      attachments,
    }: {
      entry: JournalEntryInsert;
      attachments?: PendingAttachment[];
    }) => {
      const { data: row, error } = await supabase
        .from("journal_entries" as any)
        .insert(entry as any)
        .select()
        .single();
      if (error) throw error;
      const entryId = (row as any).id as string;

      if (attachments && attachments.length) {
        for (let i = 0; i < attachments.length; i++) {
          const att = attachments[i];
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
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("Registro salvo");
    },
    onError: (e: any) => toast.error(e.message || "Falha ao salvar"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & JournalEntryInsert) => {
      const { error } = await supabase.from("journal_entries" as any).update(patch as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal_entries"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_entries" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("Registro removido");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markReviewed = useMutation({
    mutationFn: async ({ id, reviewed = true }: { id: string; reviewed?: boolean }) => {
      const { error } = await supabase
        .from("journal_entries" as any)
        .update({ reviewed } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("Marcado como revisado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const convertToTask = useMutation({
    mutationFn: async (entry: JournalEntry) => {
      const titulo =
        (entry.description?.split("\n")[0]?.slice(0, 80)) ||
        entry.title ||
        `Registro de ${new Date(entry.created_at).toLocaleDateString("pt-BR")}`;
      const { data, error } = await supabase
        .from("operational_tasks" as any)
        .insert({
          titulo,
          descricao: entry.description || entry.notes || null,
          tipo: "operacional",
          status: "pendente",
          area_id: entry.area_id,
          cycle_id: entry.cycle_id,
          responsavel_id: entry.responsavel_id,
          observacoes: `Originado do Diário de Campo (${entry.id})`,
        } as any)
        .select()
        .single();
      if (error) throw error;
      await supabase
        .from("journal_entries" as any)
        .update({ reviewed: true } as any)
        .eq("id", entry.id);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      qc.invalidateQueries({ queryKey: ["operational_tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarefa criada a partir do registro");
    },
    onError: (e: any) => toast.error(e.message || "Falha ao converter em tarefa"),
  });

  return { ...query, create, update, remove, markReviewed, convertToTask };
}

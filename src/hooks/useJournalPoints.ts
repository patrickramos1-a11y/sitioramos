import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface JournalPoint {
  id: string;
  entry_id: string;
  nome: string;
  observacao: string | null;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  captured_at: string;
  ordem: number;
  manual: boolean;
  geometry_type: "point" | "line" | "polygon";
  coordinates: any | null;
  attachment_id: string | null;
  created_at: string;
  updated_at: string;
}

export type JournalPointInsert = Omit<
  JournalPoint,
  "id" | "created_at" | "updated_at"
>;

export type DraftPoint = Omit<
  JournalPoint,
  "id" | "entry_id" | "created_at" | "updated_at"
> & { tempId: string };

export function useJournalPoints(entryId?: string) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["journal_points", entryId],
    enabled: !!entryId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_points" as any)
        .select("*")
        .eq("entry_id", entryId)
        .order("ordem", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as JournalPoint[];
    },
  });

  const add = useMutation({
    mutationFn: async (point: Partial<JournalPointInsert> & { entry_id: string; nome: string; latitude: number; longitude: number }) => {
      const { data, error } = await supabase
        .from("journal_points" as any)
        .insert(point as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal_points", entryId] }),
    onError: (e: any) => toast.error(e.message || "Falha ao adicionar ponto"),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<JournalPoint>) => {
      const { error } = await supabase
        .from("journal_points" as any)
        .update(patch as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal_points", entryId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("journal_points" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["journal_points", entryId] }),
    onError: (e: any) => toast.error(e.message),
  });

  return { ...query, add, update, remove };
}

export async function batchInsertPoints(
  entryId: string,
  drafts: DraftPoint[],
): Promise<void> {
  if (!drafts.length) return;
  const rows = drafts.map((d, i) => ({
    entry_id: entryId,
    nome: d.nome,
    observacao: d.observacao,
    latitude: d.latitude,
    longitude: d.longitude,
    accuracy: d.accuracy,
    captured_at: d.captured_at,
    ordem: i,
    manual: d.manual,
    geometry_type: d.geometry_type,
    coordinates: d.coordinates,
    attachment_id: d.attachment_id,
  }));
  const { error } = await supabase.from("journal_points" as any).insert(rows as any);
  if (error) throw error;
}

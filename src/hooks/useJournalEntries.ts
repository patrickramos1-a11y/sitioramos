import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface JournalEntry {
  id: string;
  entry_date: string;
  area_id: string | null;
  cycle_id: string | null;
  entry_type: string;
  title: string;
  description: string | null;
  responsavel_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type JournalEntryInsert = Omit<JournalEntry, "id" | "created_at" | "updated_at">;

export function useJournalEntries() {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["journal_entries"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("journal_entries" as any)
        .select("*")
        .order("entry_date", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as JournalEntry[];
    },
  });

  const create = useMutation({
    mutationFn: async (data: Partial<JournalEntryInsert>) => {
      const { data: row, error } = await supabase
        .from("journal_entries" as any)
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["journal_entries"] });
      toast.success("Registro salvo no Diário de Campo");
    },
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

  return { ...query, create, remove };
}

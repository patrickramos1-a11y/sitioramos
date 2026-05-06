import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Responsavel {
  id: string;
  nome: string;
  apelido: string | null;
  cor: string;
  icone: string | null;
  status: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type ResponsavelInsert = Omit<Responsavel, "id" | "created_at" | "updated_at">;

export function useResponsaveis(includeInactive = false) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["responsaveis", includeInactive],
    queryFn: async () => {
      let q = supabase.from("responsaveis" as any).select("*").order("nome");
      if (!includeInactive) q = q.eq("status", "ativo");
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as Responsavel[];
    },
  });

  const create = useMutation({
    mutationFn: async (data: Partial<ResponsavelInsert>) => {
      const { data: row, error } = await supabase
        .from("responsaveis" as any)
        .insert(data as any)
        .select()
        .single();
      if (error) throw error;
      return row;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success("Responsável criado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }: Partial<Responsavel> & { id: string }) => {
      const { error } = await supabase.from("responsaveis" as any).update(data as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success("Responsável atualizado");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("responsaveis" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["responsaveis"] });
      toast.success("Responsável removido");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return { ...query, create, update, remove };
}

export function useResponsavel(id: string | null | undefined) {
  const { data } = useResponsaveis(true);
  return data?.find((r) => r.id === id) || null;
}

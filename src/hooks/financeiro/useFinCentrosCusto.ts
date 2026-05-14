import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type FinCentroCusto = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
};

export function useFinCentrosCusto() {
  return useQuery({
    queryKey: ["fin_centros_custo"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_centros_custo")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as FinCentroCusto[];
    },
  });
}

export function useUpsertCentroCusto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<FinCentroCusto> & { nome: string; codigo: string }) => {
      if (input.id) {
        const { error } = await supabase
          .from("fin_centros_custo")
          .update(input)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fin_centros_custo").insert(input);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin_centros_custo"] });
      toast.success("Centro de custo salvo");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteCentroCusto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fin_centros_custo").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin_centros_custo"] });
      toast.success("Centro de custo removido");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

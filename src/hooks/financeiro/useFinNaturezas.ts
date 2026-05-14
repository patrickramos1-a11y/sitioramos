import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type FinNatureza = {
  id: string;
  codigo: string;
  nome: string;
  tipo: "entrada" | "saida" | "ajuste";
  descricao: string | null;
  ativo: boolean;
  ordem: number;
};

export function useFinNaturezas() {
  return useQuery({
    queryKey: ["fin_naturezas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_naturezas")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as FinNatureza[];
    },
  });
}

export function useToggleNaturezaAtivo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase
        .from("fin_naturezas")
        .update({ ativo })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin_naturezas"] });
      toast.success("Natureza atualizada");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

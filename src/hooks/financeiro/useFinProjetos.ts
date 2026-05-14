import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type FinProjeto = {
  id: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  status: "planejado" | "em_andamento" | "concluido" | "pausado" | "cancelado";
  data_inicio: string | null;
  data_conclusao: string | null;
  valor_previsto: number | null;
  ativo: boolean;
};

export function useFinProjetos() {
  return useQuery({
    queryKey: ["fin_projetos_investimento"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_projetos_investimento")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as FinProjeto[];
    },
  });
}

export function useUpsertProjeto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<FinProjeto> & { nome: string }) => {
      if (input.id) {
        const { error } = await supabase
          .from("fin_projetos_investimento")
          .update(input)
          .eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fin_projetos_investimento").insert(input);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin_projetos_investimento"] });
      toast.success("Projeto salvo");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteProjeto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fin_projetos_investimento").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin_projetos_investimento"] });
      toast.success("Projeto removido");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

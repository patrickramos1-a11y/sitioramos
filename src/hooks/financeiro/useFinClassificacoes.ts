import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type FinClassificacao = {
  id: string;
  cash_transaction_id: string;
  natureza_id: string | null;
  categoria_id: string | null;
  centro_custo_id: string | null;
  propriedade_id: string | null;
  area_id: string | null;
  talhao_id: string | null;
  cycle_id: string | null;
  projeto_investimento_id: string | null;
  origem: "manual" | "automatica" | "sugerida";
  confianca: "alta" | "media" | "baixa" | null;
  revisado: boolean;
  observacao: string | null;
};

export function useFinClassificacoes() {
  return useQuery({
    queryKey: ["fin_classificacoes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fin_classificacoes").select("*");
      if (error) throw error;
      return (data ?? []) as FinClassificacao[];
    },
  });
}

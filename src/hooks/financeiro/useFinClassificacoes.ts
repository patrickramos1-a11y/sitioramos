import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type LoanEvent =
  | "recebimento"
  | "pagamento_parcela"
  | "juros"
  | "tarifa"
  | "amortizacao"
  | "ajuste";

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
  loan_id: string | null;
  installment_id: string | null;
  tipo_evento_emprestimo: LoanEvent | null;
  origem: "manual" | "automatica" | "sugerida";
  confianca: "alta" | "media" | "baixa" | null;
  revisado: boolean;
  observacao: string | null;
};

export type FinClassificacaoInput = Partial<
  Omit<FinClassificacao, "id" | "cash_transaction_id">
> & {
  cash_transaction_id: string;
};

export function useFinClassificacoes() {
  return useQuery({
    queryKey: ["fin_classificacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_classificacoes")
        .select("*");
      if (error) throw error;
      return (data ?? []) as FinClassificacao[];
    },
  });
}

export function useUpsertClassificacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: FinClassificacaoInput) => {
      const { data: existing } = await supabase
        .from("fin_classificacoes")
        .select("id")
        .eq("cash_transaction_id", input.cash_transaction_id)
        .maybeSingle();

      const payload = {
        ...input,
        origem: input.origem ?? "manual",
      };

      if (existing?.id) {
        const { error } = await supabase
          .from("fin_classificacoes")
          .update(payload as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("fin_classificacoes")
          .insert(payload as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin_classificacoes"] });
      toast.success("Classificação salva");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteClassificacao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cash_transaction_id: string) => {
      const { error } = await supabase
        .from("fin_classificacoes")
        .delete()
        .eq("cash_transaction_id", cash_transaction_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin_classificacoes"] });
      toast.success("Classificação removida");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useToggleRevisado() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, revisado }: { id: string; revisado: boolean }) => {
      const { error } = await supabase
        .from("fin_classificacoes")
        .update({ revisado })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin_classificacoes"] });
    },
    onError: (e: any) => toast.error(e.message),
  });
}

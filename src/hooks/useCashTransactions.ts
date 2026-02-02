import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CashTransaction {
  id: string;
  data: string;
  tipo: "entrada" | "saida";
  categoria: 
    | "emprestimo_entrada"
    | "receita_venda"
    | "aporte"
    | "custo_operacional"
    | "investimento"
    | "parcela_emprestimo"
    | "quitacao_emprestimo"
    | "despesa_financeira"
    | "transferencia";
  valor: number;
  descricao: string | null;
  loan_id: string | null;
  installment_id: string | null;
  cost_id: string | null;
  revenue_id: string | null;
  investment_id: string | null;
  area_id: string | null;
  cycle_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashTransactionInsert {
  data: string;
  tipo: "entrada" | "saida";
  categoria: CashTransaction["categoria"];
  valor: number;
  descricao?: string | null;
  loan_id?: string | null;
  installment_id?: string | null;
  cost_id?: string | null;
  revenue_id?: string | null;
  investment_id?: string | null;
  area_id?: string | null;
  cycle_id?: string | null;
  observacoes?: string | null;
}

export interface CashBalance {
  total_entradas: number;
  total_saidas: number;
  saldo_atual: number;
}

const categoriaLabels: Record<CashTransaction["categoria"], string> = {
  emprestimo_entrada: "Recebimento de Empréstimo",
  receita_venda: "Receita de Venda",
  aporte: "Aporte de Capital",
  custo_operacional: "Custo Operacional",
  investimento: "Investimento",
  parcela_emprestimo: "Pagamento de Parcela",
  quitacao_emprestimo: "Quitação de Empréstimo",
  despesa_financeira: "Despesa Financeira",
  transferencia: "Transferência",
};

export { categoriaLabels };

export function useCashTransactions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ["cash-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_transactions")
        .select("*, areas(nome), loans(origem_credor)")
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as (CashTransaction & { areas?: { nome: string } | null; loans?: { origem_credor: string } | null })[];
    },
  });

  const { data: balance } = useQuery({
    queryKey: ["cash-balance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cash_balance")
        .select("*")
        .maybeSingle();
      
      if (error) throw error;
      return data as CashBalance | null;
    },
  });

  const createTransaction = useMutation({
    mutationFn: async (newTransaction: CashTransactionInsert) => {
      const { data, error } = await supabase
        .from("cash_transactions")
        .insert(newTransaction)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Movimentação registrada",
        description: "A movimentação foi cadastrada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar movimentação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cash_transactions")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Movimentação excluída",
        description: "A movimentação foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir movimentação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    transactions,
    balance,
    isLoading,
    error,
    createTransaction,
    deleteTransaction,
  };
}

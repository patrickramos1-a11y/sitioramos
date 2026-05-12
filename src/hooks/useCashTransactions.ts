import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CashCategory, cashCategoryConfig } from "@/lib/categoryConfig";

export interface CashTransaction {
  id: string;
  data: string;
  tipo: "entrada" | "saida";
  categoria: CashCategory;
  valor: number;
  descricao: string | null;
  loan_id: string | null;
  installment_id: string | null;
  cost_id: string | null;
  revenue_id: string | null;
  investment_id: string | null;
  area_id: string | null;
  cycle_id: string | null;
  operation_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  contato_id?: string | null;
  areas?: { nome: string } | null;
  loans?: { origem_credor: string } | null;
  cycles?: { cultura: string } | null;
  contatos?: { nome: string } | null;
}

export interface CashTransactionInsert {
  data: string;
  tipo: "entrada" | "saida";
  categoria: CashCategory;
  valor: number;
  descricao?: string | null;
  loan_id?: string | null;
  installment_id?: string | null;
  cost_id?: string | null;
  revenue_id?: string | null;
  investment_id?: string | null;
  area_id?: string | null;
  cycle_id?: string | null;
  operation_id?: string | null;
  contato_id?: string | null;
  observacoes?: string | null;
}

export interface CashBalance {
  total_entradas: number;
  total_saidas: number;
  saldo_atual: number;
}

export interface CashFilters {
  categoria?: CashCategory;
  areaId?: string;
  cycleId?: string;
  operationId?: string;
  tipo?: "entrada" | "saida";
  startDate?: string;
  endDate?: string;
}

// Re-export for backward compatibility
export const categoriaLabels = Object.fromEntries(
  Object.entries(cashCategoryConfig).map(([key, val]) => [key, val.label])
) as Record<CashCategory, string>;

export function useCashTransactions(filters?: CashFilters) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: transactions = [], isLoading, error } = useQuery({
    queryKey: ["cash-transactions", filters],
    queryFn: async () => {
      let query = supabase
        .from("cash_transactions")
        .select("*, areas(nome), loans(origem_credor), cycles(cultura), contatos(nome)")
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      
      if (filters?.categoria) {
        query = query.eq("categoria", filters.categoria);
      }
      if (filters?.areaId) {
        query = query.eq("area_id", filters.areaId);
      }
      if (filters?.cycleId) {
        query = query.eq("cycle_id", filters.cycleId);
      }
      if (filters?.operationId) {
        query = query.eq("operation_id", filters.operationId);
      }
      if (filters?.tipo) {
        query = query.eq("tipo", filters.tipo);
      }
      if (filters?.startDate) {
        query = query.gte("data", filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte("data", filters.endDate);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as CashTransaction[];
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

  // Get filtered totals (for when filters are applied)
  const filteredTotals = {
    totalEntradas: transactions
      .filter(t => t.tipo === "entrada")
      .reduce((sum, t) => sum + Number(t.valor), 0),
    totalSaidas: transactions
      .filter(t => t.tipo === "saida")
      .reduce((sum, t) => sum + Number(t.valor), 0),
  };

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

  const updateTransaction = useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Partial<CashTransactionInsert>) => {
      const { data, error } = await supabase
        .from("cash_transactions")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: "Movimentação atualizada" });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar movimentação", description: error.message, variant: "destructive" });
    },
  });

  const bulkUpdateTransactions = useMutation({
    mutationFn: async ({ ids, patch }: { ids: string[]; patch: Partial<CashTransactionInsert> }) => {
      if (!ids.length) return;
      const { error } = await supabase
        .from("cash_transactions")
        .update(patch)
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({ title: `${vars.ids.length} movimentações atualizadas` });
    },
    onError: (error) => {
      toast({ title: "Erro na atualização em massa", description: error.message, variant: "destructive" });
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
    filteredTotals,
    isLoading,
    error,
    createTransaction,
    updateTransaction,
    bulkUpdateTransactions,
    deleteTransaction,
  };
}

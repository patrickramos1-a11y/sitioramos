import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Investment = Tables<"investments">;
export type InvestmentInsert = TablesInsert<"investments">;
export type InvestmentUpdate = TablesUpdate<"investments">;

export function useInvestments() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: investments = [], isLoading, error } = useQuery({
    queryKey: ["investments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*, areas(nome)")
        .order("data", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createInvestment = useMutation({
    mutationFn: async (newInvestment: InvestmentInsert) => {
      // 1. Create the investment record
      const { data: invData, error: invError } = await supabase
        .from("investments")
        .insert(newInvestment)
        .select()
        .single();
      
      if (invError) throw invError;

      // 2. Create a cash transaction (exit) for the investment
      const { error: txError } = await supabase
        .from("cash_transactions")
        .insert({
          data: newInvestment.data,
          tipo: "saida",
          categoria: "investimento",
          valor: newInvestment.valor,
          descricao: newInvestment.descricao || `Investimento: ${newInvestment.tipo}`,
          investment_id: invData.id,
          area_id: newInvestment.area_id || null,
        });
      
      if (txError) {
        // Rollback the investment if transaction fails
        await supabase.from("investments").delete().eq("id", invData.id);
        throw txError;
      }

      return invData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Investimento registrado",
        description: "O investimento foi cadastrado e o caixa atualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar investimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateInvestment = useMutation({
    mutationFn: async ({ id, ...updates }: InvestmentUpdate & { id: string }) => {
      // Get the old investment
      const { data: oldInv } = await supabase
        .from("investments")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("investments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;

      // Update the related cash transaction
      await supabase.from("cash_transactions").delete().eq("investment_id", id);
      await supabase.from("cash_transactions").insert({
        data: updates.data || oldInv?.data,
        tipo: "saida",
        categoria: "investimento",
        valor: updates.valor || oldInv?.valor,
        descricao: updates.descricao || oldInv?.descricao || `Investimento: ${updates.tipo || oldInv?.tipo}`,
        investment_id: id,
        area_id: updates.area_id || oldInv?.area_id || null,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Investimento atualizado",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar investimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteInvestment = useMutation({
    mutationFn: async (id: string) => {
      // Delete related cash transaction first
      await supabase.from("cash_transactions").delete().eq("investment_id", id);
      
      const { error } = await supabase
        .from("investments")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Investimento excluído",
        description: "O investimento foi removido e o caixa atualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir investimento",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    investments,
    isLoading,
    error,
    createInvestment,
    updateInvestment,
    deleteInvestment,
  };
}

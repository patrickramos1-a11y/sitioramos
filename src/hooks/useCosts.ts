import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Cost = Tables<"costs">;
export type CostInsert = TablesInsert<"costs">;
export type CostUpdate = TablesUpdate<"costs">;

interface CostFilters {
  areaId?: string;
  cycleId?: string;
  tipo?: "preparo_solo" | "mudas" | "adubacao" | "herbicida" | "mao_obra" | "combustivel" | "trator" | "outros" | "juros_bancarios" | "tarifas_bancarias";
  startDate?: string;
  endDate?: string;
}

export function useCosts(filters?: CostFilters) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: costs = [], isLoading, error } = useQuery({
    queryKey: ["costs", filters],
    queryFn: async () => {
      let query = supabase
        .from("costs")
        .select("*, areas(nome), cycles(cultura)")
        .order("data", { ascending: false });
      
      if (filters?.areaId) {
        query = query.eq("area_id", filters.areaId);
      }
      if (filters?.cycleId) {
        query = query.eq("cycle_id", filters.cycleId);
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
      return data;
    },
  });

  const createCost = useMutation({
    mutationFn: async (newCost: CostInsert) => {
      // 1. Create the cost record
      const { data: costData, error: costError } = await supabase
        .from("costs")
        .insert(newCost)
        .select()
        .single();
      
      if (costError) throw costError;

      // 2. If paid with cash (dinheiro), create a cash transaction (exit)
      if (newCost.forma_pagamento === "dinheiro") {
        const { error: txError } = await supabase
          .from("cash_transactions")
          .insert({
            data: newCost.data,
            tipo: "saida",
            categoria: "custo",
            subcategoria: newCost.tipo as any,
            valor: newCost.valor,
            descricao: newCost.descricao || `Custo: ${newCost.tipo}`,
            cost_id: costData.id,
            area_id: newCost.area_id,
            cycle_id: newCost.cycle_id || null,
            contato_id: (newCost as any).contato_id || null,
          } as any);
        
        if (txError) {
          // Rollback the cost if transaction fails
          await supabase.from("costs").delete().eq("id", costData.id);
          throw txError;
        }
      }

      return costData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Custo registrado",
        description: "O custo foi cadastrado e o caixa atualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar custo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCost = useMutation({
    mutationFn: async ({ id, ...updates }: CostUpdate & { id: string }) => {
      // Get the old cost to check if we need to update cash transaction
      const { data: oldCost } = await supabase
        .from("costs")
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("costs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;

      // Update the related cash transaction if exists
      if (oldCost?.forma_pagamento === "dinheiro" || updates.forma_pagamento === "dinheiro") {
        // Delete existing transaction
        await supabase.from("cash_transactions").delete().eq("cost_id", id);

        // Create new one if still dinheiro
        if (updates.forma_pagamento === "dinheiro" || (updates.forma_pagamento === undefined && oldCost?.forma_pagamento === "dinheiro")) {
          await supabase.from("cash_transactions").insert({
            data: updates.data || oldCost?.data,
            tipo: "saida",
            categoria: "custo",
            subcategoria: (updates.tipo || oldCost?.tipo) as any,
            valor: updates.valor || oldCost?.valor,
            descricao: updates.descricao || oldCost?.descricao || `Custo: ${updates.tipo || oldCost?.tipo}`,
            cost_id: id,
            area_id: updates.area_id || oldCost?.area_id,
            cycle_id: updates.cycle_id || oldCost?.cycle_id || null,
          } as any);
        }
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Custo atualizado",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar custo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCost = useMutation({
    mutationFn: async (id: string) => {
      // Delete related cash transaction first
      await supabase.from("cash_transactions").delete().eq("cost_id", id);
      
      const { error } = await supabase
        .from("costs")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Custo excluído",
        description: "O custo foi removido e o caixa atualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir custo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    costs,
    isLoading,
    error,
    createCost,
    updateCost,
    deleteCost,
  };
}

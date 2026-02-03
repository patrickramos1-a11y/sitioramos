import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Revenue = Tables<"revenues">;
export type RevenueInsert = TablesInsert<"revenues">;
export type RevenueUpdate = TablesUpdate<"revenues">;

export function useRevenues() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: revenues = [], isLoading, error } = useQuery({
    queryKey: ["revenues"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenues")
        .select("*, areas(nome), cycles(cultura)")
        .order("data", { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const createRevenue = useMutation({
    mutationFn: async (newRevenue: RevenueInsert) => {
      const valorTotal = Number(newRevenue.quantidade) * Number(newRevenue.preco_unitario);
      
      // 1. Create the revenue record
      const { data: revData, error: revError } = await supabase
        .from("revenues")
        .insert({
          ...newRevenue,
          valor_total: valorTotal,
        })
        .select()
        .single();
      
      if (revError) throw revError;

      // 2. Create a cash transaction (entry) for the revenue
      const { error: txError } = await supabase
        .from("cash_transactions")
        .insert({
          data: newRevenue.data,
          tipo: "entrada",
          categoria: "receita_venda",
          valor: valorTotal,
          descricao: `Venda: ${newRevenue.produto}${newRevenue.cliente ? ` - ${newRevenue.cliente}` : ""}`,
          revenue_id: revData.id,
          area_id: newRevenue.area_id,
          cycle_id: newRevenue.cycle_id || null,
        });
      
      if (txError) {
        // Rollback the revenue if transaction fails
        await supabase.from("revenues").delete().eq("id", revData.id);
        throw txError;
      }

      return revData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Receita registrada",
        description: "A receita foi cadastrada e o caixa atualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao registrar receita",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateRevenue = useMutation({
    mutationFn: async ({ id, ...updates }: RevenueUpdate & { id: string }) => {
      const { data: oldRev } = await supabase
        .from("revenues")
        .select("*")
        .eq("id", id)
        .single();

      const quantidade = updates.quantidade ?? oldRev?.quantidade ?? 0;
      const precoUnitario = updates.preco_unitario ?? oldRev?.preco_unitario ?? 0;
      const valorTotal = Number(quantidade) * Number(precoUnitario);

      const { data, error } = await supabase
        .from("revenues")
        .update({
          ...updates,
          valor_total: valorTotal,
        })
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;

      // Update the related cash transaction
      await supabase.from("cash_transactions").delete().eq("revenue_id", id);
      await supabase.from("cash_transactions").insert({
        data: updates.data || oldRev?.data,
        tipo: "entrada",
        categoria: "receita_venda",
        valor: valorTotal,
        descricao: `Venda: ${updates.produto || oldRev?.produto}${(updates.cliente || oldRev?.cliente) ? ` - ${updates.cliente || oldRev?.cliente}` : ""}`,
        revenue_id: id,
        area_id: updates.area_id || oldRev?.area_id,
        cycle_id: updates.cycle_id || oldRev?.cycle_id || null,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Receita atualizada",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar receita",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteRevenue = useMutation({
    mutationFn: async (id: string) => {
      // Delete related cash transaction first
      await supabase.from("cash_transactions").delete().eq("revenue_id", id);
      
      const { error } = await supabase
        .from("revenues")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      queryClient.invalidateQueries({ queryKey: ["cash-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cash-balance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
      toast({
        title: "Receita excluída",
        description: "A receita foi removida e o caixa atualizado.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir receita",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    revenues,
    isLoading,
    error,
    createRevenue,
    updateRevenue,
    deleteRevenue,
  };
}

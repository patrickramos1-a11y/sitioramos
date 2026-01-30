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
  tipo?: "preparo_solo" | "mudas" | "adubacao" | "herbicida" | "mao_obra" | "combustivel" | "trator" | "outros";
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
      const { data, error } = await supabase
        .from("costs")
        .insert(newCost)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast({
        title: "Custo registrado",
        description: "O custo foi cadastrado com sucesso.",
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
      const { data, error } = await supabase
        .from("costs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
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
      const { error } = await supabase
        .from("costs")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["costs"] });
      toast({
        title: "Custo excluído",
        description: "O custo foi removido com sucesso.",
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

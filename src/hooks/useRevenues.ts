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
      const { data, error } = await supabase
        .from("revenues")
        .insert(newRevenue)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      toast({
        title: "Receita registrada",
        description: "A receita foi cadastrada com sucesso.",
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
      const { data, error } = await supabase
        .from("revenues")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
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
      const { error } = await supabase
        .from("revenues")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["revenues"] });
      toast({
        title: "Receita excluída",
        description: "A receita foi removida com sucesso.",
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

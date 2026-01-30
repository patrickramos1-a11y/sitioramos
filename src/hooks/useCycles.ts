import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Cycle = Tables<"cycles">;
export type CycleInsert = TablesInsert<"cycles">;
export type CycleUpdate = TablesUpdate<"cycles">;

export function useCycles(areaId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: cycles = [], isLoading, error } = useQuery({
    queryKey: ["cycles", areaId],
    queryFn: async () => {
      let query = supabase
        .from("cycles")
        .select("*, areas(nome)")
        .order("data_inicio_plantio", { ascending: false });
      
      if (areaId) {
        query = query.eq("area_id", areaId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const createCycle = useMutation({
    mutationFn: async (newCycle: CycleInsert) => {
      const { data, error } = await supabase
        .from("cycles")
        .insert(newCycle)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      toast({
        title: "Ciclo criado",
        description: "O ciclo foi cadastrado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar ciclo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateCycle = useMutation({
    mutationFn: async ({ id, ...updates }: CycleUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("cycles")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      toast({
        title: "Ciclo atualizado",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar ciclo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteCycle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("cycles")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      toast({
        title: "Ciclo excluído",
        description: "O ciclo foi removido com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir ciclo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    cycles,
    isLoading,
    error,
    createCycle,
    updateCycle,
    deleteCycle,
  };
}

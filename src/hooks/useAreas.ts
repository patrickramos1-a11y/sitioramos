import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

export type Area = Tables<"areas">;
export type AreaInsert = TablesInsert<"areas">;
export type AreaUpdate = TablesUpdate<"areas">;

export function useAreas() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: areas = [], isLoading, error } = useQuery({
    queryKey: ["areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("areas")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Area[];
    },
  });

  const createArea = useMutation({
    mutationFn: async (newArea: AreaInsert) => {
      const { data, error } = await supabase
        .from("areas")
        .insert(newArea)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast({
        title: "Área criada",
        description: "A área foi cadastrada com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar área",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateArea = useMutation({
    mutationFn: async ({ id, ...updates }: AreaUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("areas")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast({
        title: "Área atualizada",
        description: "As alterações foram salvas.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar área",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteArea = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("areas")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["areas"] });
      toast({
        title: "Área excluída",
        description: "A área foi removida com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao excluir área",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    areas,
    isLoading,
    error,
    createArea,
    updateArea,
    deleteArea,
  };
}

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
      const { data, error } = await supabase
        .from("investments")
        .insert(newInvestment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      toast({
        title: "Investimento registrado",
        description: "O investimento foi cadastrado com sucesso.",
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
      const { data, error } = await supabase
        .from("investments")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
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
      const { error } = await supabase
        .from("investments")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      toast({
        title: "Investimento excluído",
        description: "O investimento foi removido com sucesso.",
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

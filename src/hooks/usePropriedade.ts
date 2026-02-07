import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Propriedade {
  id: string;
  nome: string;
  area_total_hectares: number;
  area_app_hectares: number;
  metros_rio_total: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PropriedadeInsert {
  nome: string;
  area_total_hectares: number;
  area_app_hectares?: number;
  metros_rio_total?: number;
  observacoes?: string | null;
}

export interface PropriedadeUpdate extends Partial<PropriedadeInsert> {
  id: string;
}

export function usePropriedade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: propriedade, isLoading, error } = useQuery({
    queryKey: ["propriedade"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("propriedade" as any)
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return (data as unknown) as Propriedade | null;
    },
  });

  const savePropriedade = useMutation({
    mutationFn: async (input: PropriedadeInsert & { id?: string }) => {
      if (input.id) {
        const { id, ...updates } = input;
        const { data, error } = await supabase
          .from("propriedade" as any)
          .update(updates)
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("propriedade" as any)
          .insert(input)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["propriedade"] });
      toast({
        title: "Propriedade salva",
        description: "Os dados da propriedade foram atualizados.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar propriedade",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    propriedade,
    isLoading,
    error,
    savePropriedade,
  };
}

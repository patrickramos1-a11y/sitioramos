import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type FinCategoria = {
  id: string;
  codigo: string;
  nome: string;
  natureza_id: string | null;
  centro_custo_id: string | null;
  ativo: boolean;
  ordem: number;
};

export function useFinCategorias() {
  return useQuery({
    queryKey: ["fin_categorias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fin_categorias")
        .select("*")
        .order("ordem");
      if (error) throw error;
      return (data ?? []) as FinCategoria[];
    },
  });
}

export function useUpsertCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<FinCategoria> & { nome: string; codigo: string }) => {
      if (input.id) {
        const { error } = await supabase.from("fin_categorias").update(input).eq("id", input.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fin_categorias").insert(input);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin_categorias"] });
      toast.success("Categoria salva");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteCategoria() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fin_categorias").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["fin_categorias"] });
      toast.success("Categoria removida");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

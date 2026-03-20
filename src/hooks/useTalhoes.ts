import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Talhao {
  id: string;
  propriedade_id: string | null;
  area_id: string | null; // deprecated
  nome: string;
  area_total_hectares: number;
  area_produtiva_hectares: number;
  area_app_hectares: number;
  metros_rio: number;
  status: string;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TalhaoInsert {
  propriedade_id?: string | null;
  nome: string;
  area_total_hectares: number;
  area_produtiva_hectares?: number;
  area_app_hectares?: number;
  metros_rio?: number;
  status?: string;
  observacoes?: string | null;
}

export interface TalhaoUpdate extends Partial<Omit<TalhaoInsert, "propriedade_id">> {
  id: string;
}

export function useTalhoes(propriedadeId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: talhoes = [], isLoading, error } = useQuery({
    queryKey: ["talhoes", propriedadeId],
    queryFn: async () => {
      let query = supabase
        .from("talhoes" as any)
        .select("*")
        .order("created_at", { ascending: false });
      
      if (propriedadeId) {
        query = query.eq("propriedade_id", propriedadeId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return (data as unknown) as Talhao[];
    },
  });

  const createTalhao = useMutation({
    mutationFn: async (input: TalhaoInsert) => {
      const { data, error } = await supabase
        .from("talhoes" as any)
        .insert(input)
        .select()
        .single();
      if (error) throw error;

      await supabase.from("territorial_events" as any).insert({
        tipo: "criacao",
        descricao: `Talhão "${input.nome}" criado`,
        entidades_envolvidas: { propriedade_id: input.propriedade_id },
        dados_depois: input,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talhoes"] });
      toast({ title: "Talhão criado", description: "O talhão foi cadastrado com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao criar talhão", description: error.message, variant: "destructive" });
    },
  });

  const updateTalhao = useMutation({
    mutationFn: async ({ id, ...updates }: TalhaoUpdate) => {
      const { data: before } = await supabase
        .from("talhoes" as any)
        .select("*")
        .eq("id", id)
        .single();

      const { data, error } = await supabase
        .from("talhoes" as any)
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      await supabase.from("territorial_events" as any).insert({
        tipo: "alteracao",
        descricao: `Talhão atualizado`,
        entidades_envolvidas: { talhao_id: id },
        dados_antes: before,
        dados_depois: data,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talhoes"] });
      toast({ title: "Talhão atualizado", description: "As alterações foram salvas." });
    },
    onError: (error) => {
      toast({ title: "Erro ao atualizar talhão", description: error.message, variant: "destructive" });
    },
  });

  const deleteTalhao = useMutation({
    mutationFn: async (id: string) => {
      const { data: before } = await supabase
        .from("talhoes" as any)
        .select("*")
        .eq("id", id)
        .single();

      const { error } = await supabase
        .from("talhoes" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;

      const beforeData = before as unknown as Talhao | null;
      await supabase.from("territorial_events" as any).insert({
        tipo: "exclusao",
        descricao: `Talhão "${beforeData?.nome || ''}" excluído`,
        entidades_envolvidas: { talhao_id: id },
        dados_antes: before,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["talhoes"] });
      toast({ title: "Talhão excluído", description: "O talhão foi removido com sucesso." });
    },
    onError: (error) => {
      toast({ title: "Erro ao excluir talhão", description: error.message, variant: "destructive" });
    },
  });

  return { talhoes, isLoading, error, createTalhao, updateTalhao, deleteTalhao };
}

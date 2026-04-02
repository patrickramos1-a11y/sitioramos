import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Stage {
  id: string;
  parent_id: string | null;
  propriedade_id: string | null;
  talhao_id: string | null;
  area_id: string;
  cycle_id: string;
  nome: string;
  tipo: string;
  descricao: string | null;
  status: string;
  prioridade: string | null;
  data_inicio_prevista: string | null;
  data_inicio_real: string | null;
  data_fim_prevista: string | null;
  data_fim_real: string | null;
  responsavel: string | null;
  progresso_percentual: number | null;
  custo_total: number | null;
  ordem: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StageInsert {
  propriedade_id?: string | null;
  talhao_id?: string | null;
  area_id: string;
  cycle_id: string;
  nome: string;
  tipo?: string;
  descricao?: string | null;
  status?: string;
  prioridade?: string | null;
  data_inicio_prevista?: string | null;
  data_inicio_real?: string | null;
  data_fim_prevista?: string | null;
  data_fim_real?: string | null;
  responsavel?: string | null;
  progresso_percentual?: number | null;
  ordem?: number;
  observacoes?: string | null;
}

export interface StageTemplate {
  id: string;
  cultura: string;
  nome: string;
  tipo: string;
  ordem: number;
  duracao_padrao_dias: number | null;
  obrigatoria: boolean;
}

export function useStages(cycleId?: string, areaId?: string) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stages = [], isLoading } = useQuery({
    queryKey: ["operational_stages", cycleId, areaId],
    queryFn: async () => {
      let query = supabase
        .from("operational_stages")
        .select("*")
        .order("ordem", { ascending: true });

      if (cycleId) query = query.eq("cycle_id", cycleId);
      if (areaId) query = query.eq("area_id", areaId);

      const { data, error } = await query;
      if (error) throw error;
      return data as Stage[];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["stage_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stage_templates")
        .select("*")
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as StageTemplate[];
    },
  });

  const createStage = useMutation({
    mutationFn: async (stage: StageInsert) => {
      const { data, error } = await supabase
        .from("operational_stages")
        .insert(stage as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational_stages"] });
      toast({ title: "Etapa criada", description: "A etapa foi cadastrada com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar etapa", description: error.message, variant: "destructive" });
    },
  });

  const updateStage = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Stage> & { id: string }) => {
      const { data, error } = await supabase
        .from("operational_stages")
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational_stages"] });
      toast({ title: "Etapa atualizada" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar etapa", description: error.message, variant: "destructive" });
    },
  });

  const deleteStage = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("operational_stages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational_stages"] });
      toast({ title: "Etapa excluída" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir etapa", description: error.message, variant: "destructive" });
    },
  });

  const createFromTemplate = useMutation({
    mutationFn: async ({ cultura, cycleId, areaId, talhaoId }: { cultura: string; cycleId: string; areaId: string; talhaoId?: string }) => {
      const matchingTemplates = templates.filter(t => t.cultura.toLowerCase() === cultura.toLowerCase());
      if (matchingTemplates.length === 0) throw new Error("Nenhum template encontrado para esta cultura");

      const stages = matchingTemplates.map(t => ({
        cycle_id: cycleId,
        area_id: areaId,
        talhao_id: talhaoId || null,
        nome: t.nome,
        tipo: t.tipo,
        ordem: t.ordem,
        status: "nao_iniciada",
        prioridade: "media",
      }));

      const { error } = await supabase.from("operational_stages").insert(stages as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational_stages"] });
      toast({ title: "Etapas criadas", description: "Etapas padrão geradas a partir do template." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar etapas", description: error.message, variant: "destructive" });
    },
  });

  return { stages, isLoading, templates, createStage, updateStage, deleteStage, createFromTemplate };
}

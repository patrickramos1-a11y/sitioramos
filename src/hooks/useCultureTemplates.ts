import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CultureTemplateEtapa {
  nome: string;
  tipo: string;
  duracao_dias: number;
  custo_medio: number;
  ordem: number;
}

export interface CultureTemplate {
  id: string;
  cultura: string;
  custo_estimado_por_ha: number;
  etapas: CultureTemplateEtapa[];
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export function useCultureTemplates() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["culture_cost_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("culture_cost_templates" as any)
        .select("*")
        .order("cultura", { ascending: true });
      if (error) throw error;
      return ((data as any[]) ?? []).map((t) => ({
        ...t,
        etapas: Array.isArray(t.etapas) ? t.etapas : [],
      })) as CultureTemplate[];
    },
  });

  const applyTemplate = useMutation({
    mutationFn: async ({
      template,
      cycleId,
      areaId,
      talhaoId,
      dataInicio,
    }: {
      template: CultureTemplate;
      cycleId: string;
      areaId: string;
      talhaoId?: string | null;
      dataInicio: string;
    }) => {
      let cursor = new Date(dataInicio);
      const stages = template.etapas
        .sort((a, b) => a.ordem - b.ordem)
        .map((etapa) => {
          const inicio = new Date(cursor);
          const fim = new Date(cursor);
          fim.setDate(fim.getDate() + (etapa.duracao_dias || 0));
          cursor = new Date(fim);
          return {
            cycle_id: cycleId,
            area_id: areaId,
            talhao_id: talhaoId || null,
            nome: etapa.nome,
            tipo: etapa.tipo || "outro",
            ordem: etapa.ordem,
            status: "nao_iniciada",
            prioridade: "media",
            data_inicio_prevista: inicio.toISOString().slice(0, 10),
            data_fim_prevista: fim.toISOString().slice(0, 10),
            duracao_prevista_dias: etapa.duracao_dias || null,
            custo_total: etapa.custo_medio || 0,
          };
        });

      if (stages.length === 0) throw new Error("Template sem etapas");

      const { error } = await supabase.from("operational_stages").insert(stages as any);
      if (error) throw error;
      return stages.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["operational_stages"] });
      toast({
        title: "Padrão aplicado",
        description: `${count} etapa(s) criadas a partir do template.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao aplicar padrão",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return { templates, isLoading, applyTemplate };
}

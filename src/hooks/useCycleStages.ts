import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CycleStage {
  id: string;
  cycle_id: string;
  nome: string;
  descricao: string | null;
  ordem: number;
  inicio_relativo_dias: number;
  duracao_dias: number;
  status: "nao_iniciada" | "em_andamento" | "concluida" | "atrasada" | "cancelada";
  responsavel_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type CycleStageInsert = Omit<CycleStage, "id" | "created_at" | "updated_at">;
export type CycleStageUpdate = Partial<CycleStageInsert> & { id: string };

export function useCycleStages(cycleId?: string) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["cycle_stages", cycleId || "all"],
    queryFn: async () => {
      let q = supabase
        .from("cycle_stages" as any)
        .select("*")
        .order("inicio_relativo_dias", { ascending: true })
        .order("ordem", { ascending: true });
      if (cycleId) q = q.eq("cycle_id", cycleId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as CycleStage[];
    },
    enabled: cycleId !== undefined,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["cycle_stages"] });

  const create = useMutation({
    mutationFn: async (payload: CycleStageInsert) => {
      const { data, error } = await supabase
        .from("cycle_stages" as any)
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CycleStage;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Etapa criada" });
    },
    onError: (e: any) => toast({ title: "Erro ao criar etapa", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...rest }: CycleStageUpdate) => {
      const { data, error } = await supabase
        .from("cycle_stages" as any)
        .update(rest as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as CycleStage;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Etapa atualizada" });
    },
    onError: (e: any) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cycle_stages" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Etapa removida" });
    },
    onError: (e: any) => toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });

  const duplicateFromCycle = useMutation({
    mutationFn: async ({ sourceCycleId, targetCycleId }: { sourceCycleId: string; targetCycleId: string }) => {
      const { data: source, error: e1 } = await supabase
        .from("cycle_stages" as any)
        .select("*")
        .eq("cycle_id", sourceCycleId);
      if (e1) throw e1;
      const rows = (source || []) as unknown as CycleStage[];
      if (rows.length === 0) return [];
      const payload = rows.map((s) => ({
        cycle_id: targetCycleId,
        nome: s.nome,
        descricao: s.descricao,
        ordem: s.ordem,
        inicio_relativo_dias: s.inicio_relativo_dias,
        duracao_dias: s.duracao_dias,
        status: "nao_iniciada" as const,
        responsavel_id: s.responsavel_id,
        observacoes: s.observacoes,
      }));
      const { data, error } = await supabase
        .from("cycle_stages" as any)
        .insert(payload as any)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Etapas duplicadas" });
    },
    onError: (e: any) => toast({ title: "Erro ao duplicar", description: e.message, variant: "destructive" }),
  });

  return {
    stages: query.data || [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
    duplicateFromCycle,
  };
}

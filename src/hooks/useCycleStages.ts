import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CycleStage {
  id: string;
  cycle_id: string;
  nome: string;
  descricao: string | null;
  atividade: string | null;
  ordem: number;
  inicio_relativo_dias: number;
  inicio_relativo_dias_min: number | null;
  duracao_dias: number;
  status:
    | "nao_iniciada"
    | "em_andamento"
    | "concluida"
    | "realizada"
    | "atrasada"
    | "reprogramada"
    | "cancelada";
  responsavel_id: string | null;
  observacoes: string | null;
  data_inicio_real: string | null;
  data_fim_real: string | null;
  motivo_reprogramacao: string | null;
  created_at: string;
  updated_at: string;
}

export type CycleStageInsert = Omit<CycleStage, "id" | "created_at" | "updated_at">;
export type CycleStageUpdate = Partial<CycleStageInsert> & { id: string };

async function logHistory(stage_id: string | null, cycle_id: string | null, acao: string, dados: any) {
  try {
    await supabase.from("cycle_stage_history" as any).insert({ stage_id, cycle_id, acao, dados } as any);
  } catch {
    /* non-blocking */
  }
}

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
      const row = data as unknown as CycleStage;
      await logHistory(row.id, row.cycle_id, "criada", payload);
      return row;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Etapa criada" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao criar etapa", description: e.message, variant: "destructive" }),
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
      const row = data as unknown as CycleStage;
      await logHistory(row.id, row.cycle_id, "editada", rest);
      return row;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Etapa atualizada" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { data: existing } = await supabase
        .from("cycle_stages" as any)
        .select("cycle_id")
        .eq("id", id)
        .maybeSingle();
      const { error } = await supabase.from("cycle_stages" as any).delete().eq("id", id);
      if (error) throw error;
      await logHistory(id, (existing as any)?.cycle_id || null, "excluida", null);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Etapa removida" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });

  const confirmExecution = useMutation({
    mutationFn: async (p: {
      id: string;
      data_inicio_real: string;
      data_fim_real: string;
      observacao?: string | null;
      responsavel_id?: string | null;
    }) => {
      const patch: any = {
        data_inicio_real: p.data_inicio_real,
        data_fim_real: p.data_fim_real,
        status: "realizada",
      };
      if (p.observacao !== undefined) patch.observacoes = p.observacao;
      if (p.responsavel_id !== undefined) patch.responsavel_id = p.responsavel_id;
      const { data, error } = await supabase
        .from("cycle_stages" as any)
        .update(patch)
        .eq("id", p.id)
        .select()
        .single();
      if (error) throw error;
      const row = data as unknown as CycleStage;
      await logHistory(row.id, row.cycle_id, "confirmada", patch);
      return row;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Execução confirmada" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao confirmar", description: e.message, variant: "destructive" }),
  });

  const reschedule = useMutation({
    mutationFn: async (p: {
      id: string;
      inicio_relativo_dias: number;
      duracao_dias: number;
      motivo?: string;
    }) => {
      const patch: any = {
        inicio_relativo_dias: p.inicio_relativo_dias,
        duracao_dias: p.duracao_dias,
        motivo_reprogramacao: p.motivo || null,
        status: "reprogramada",
      };
      const { data, error } = await supabase
        .from("cycle_stages" as any)
        .update(patch)
        .eq("id", p.id)
        .select()
        .single();
      if (error) throw error;
      const row = data as unknown as CycleStage;
      await logHistory(row.id, row.cycle_id, "reprogramada", patch);
      return row;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Etapa reprogramada" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao reprogramar", description: e.message, variant: "destructive" }),
  });

  const pushFuture = useMutation({
    mutationFn: async (p: { cycle_id: string; fromOrdem: number; deltaDias: number }) => {
      if (p.deltaDias === 0) return [];
      const { data: rows, error: e1 } = await supabase
        .from("cycle_stages" as any)
        .select("*")
        .eq("cycle_id", p.cycle_id)
        .gt("ordem", p.fromOrdem);
      if (e1) throw e1;
      const list = (rows || []) as unknown as CycleStage[];
      for (const s of list) {
        await supabase
          .from("cycle_stages" as any)
          .update({
            inicio_relativo_dias: Math.max(0, s.inicio_relativo_dias + p.deltaDias),
          })
          .eq("id", s.id);
      }
      await logHistory(null, p.cycle_id, "empurrada", {
        fromOrdem: p.fromOrdem,
        deltaDias: p.deltaDias,
        count: list.length,
      });
      return list;
    },
    onSuccess: (list) => {
      invalidate();
      if (list && list.length > 0) toast({ title: `${list.length} etapa(s) reagendadas` });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao reagendar", description: e.message, variant: "destructive" }),
  });

  const duplicateFromCycle = useMutation({
    mutationFn: async ({
      sourceCycleId,
      targetCycleId,
    }: {
      sourceCycleId: string;
      targetCycleId: string;
    }) => {
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
        atividade: s.atividade,
        ordem: s.ordem,
        inicio_relativo_dias: s.inicio_relativo_dias,
        inicio_relativo_dias_min: s.inicio_relativo_dias_min,
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
    onError: (e: any) =>
      toast({ title: "Erro ao duplicar", description: e.message, variant: "destructive" }),
  });

  return {
    stages: query.data || [],
    isLoading: query.isLoading,
    create,
    update,
    remove,
    confirmExecution,
    reschedule,
    pushFuture,
    duplicateFromCycle,
  };
}

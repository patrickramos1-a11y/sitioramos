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

async function logHistory(stage_id: string | null, cycle_id: string | null, acao: string, dados: any) {
  try {
    await supabase.from("cycle_stage_history" as any).insert({ stage_id, cycle_id, acao, dados } as any);
  } catch {
    /* non-blocking */
  }
}

/** Recompute ordem (1..N) and inicio_relativo_dias = sum of previous duracoes,
 * persisting only when values change. */
async function recalcSequence(cycleId: string) {
  const { data: rows, error } = await supabase
    .from("cycle_stages" as any)
    .select("*")
    .eq("cycle_id", cycleId)
    .order("ordem", { ascending: true });
  if (error) throw error;
  const stages = (rows || []) as unknown as CycleStage[];
  let cum = 0;
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    const newOrdem = i + 1;
    const newIni = cum;
    if (s.ordem !== newOrdem || s.inicio_relativo_dias !== newIni || s.inicio_relativo_dias_min !== newIni) {
      await supabase
        .from("cycle_stages" as any)
        .update({ ordem: newOrdem, inicio_relativo_dias: newIni, inicio_relativo_dias_min: newIni })
        .eq("id", s.id);
    }
    cum += Math.max(1, s.duracao_dias);
  }
  // sync cycle.duracao_total_dias
  await supabase.from("cycles").update({ duracao_total_dias: cum }).eq("id", cycleId);
  return cum;
}

export interface CreateStageInput {
  cycle_id: string;
  nome: string;
  duracao_dias: number;
  atividade: string | null;
  observacoes: string | null;
  responsavel_id: string | null;
  position?: { mode: "after_last" | "before" | "after"; refStageId?: string };
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
        .order("ordem", { ascending: true });
      if (cycleId) q = q.eq("cycle_id", cycleId);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as unknown as CycleStage[];
    },
    enabled: cycleId !== undefined,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["cycle_stages"] });
    qc.invalidateQueries({ queryKey: ["cycles"] });
  };

  const create = useMutation({
    mutationFn: async (p: CreateStageInput) => {
      // fetch existing to compute insertion ordem
      const { data: rows } = await supabase
        .from("cycle_stages" as any)
        .select("id, ordem, duracao_dias")
        .eq("cycle_id", p.cycle_id)
        .order("ordem", { ascending: true });
      const list = (rows || []) as any[];

      let insertOrdem = list.length + 1;
      const mode = p.position?.mode || "after_last";
      if (mode !== "after_last" && p.position?.refStageId) {
        const ref = list.find((s) => s.id === p.position!.refStageId);
        if (ref) insertOrdem = mode === "before" ? ref.ordem : ref.ordem + 1;
      }

      // shift down ordens >= insertOrdem
      for (const s of list) {
        if (s.ordem >= insertOrdem) {
          await supabase.from("cycle_stages" as any).update({ ordem: s.ordem + 1 }).eq("id", s.id);
        }
      }

      const payload: any = {
        cycle_id: p.cycle_id,
        nome: p.nome,
        atividade: p.atividade,
        observacoes: p.observacoes,
        responsavel_id: p.responsavel_id,
        duracao_dias: Math.max(1, p.duracao_dias),
        ordem: insertOrdem,
        inicio_relativo_dias: 0, // recalcSequence vai ajustar
        inicio_relativo_dias_min: 0,
        status: "nao_iniciada",
      };

      const { data, error } = await supabase.from("cycle_stages" as any).insert(payload).select().single();
      if (error) throw error;
      const row = data as unknown as CycleStage;
      await recalcSequence(p.cycle_id);
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
    mutationFn: async (p: {
      id: string;
      nome?: string;
      duracao_dias?: number;
      atividade?: string | null;
      observacoes?: string | null;
      responsavel_id?: string | null;
    }) => {
      const { id, ...rest } = p;
      const { data, error } = await supabase
        .from("cycle_stages" as any)
        .update(rest as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      const row = data as unknown as CycleStage;
      await recalcSequence(row.cycle_id);
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
      const cyc = (existing as any)?.cycle_id;
      const { error } = await supabase.from("cycle_stages" as any).delete().eq("id", id);
      if (error) throw error;
      if (cyc) await recalcSequence(cyc);
      await logHistory(id, cyc || null, "excluida", null);
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Etapa removida" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
  });

  const move = useMutation({
    mutationFn: async (p: { id: string; direction: "up" | "down" }) => {
      const { data: row } = await supabase
        .from("cycle_stages" as any)
        .select("cycle_id, ordem")
        .eq("id", p.id)
        .maybeSingle();
      if (!row) return;
      const cur = row as any;
      const targetOrdem = p.direction === "up" ? cur.ordem - 1 : cur.ordem + 1;
      const { data: neighbor } = await supabase
        .from("cycle_stages" as any)
        .select("id, ordem")
        .eq("cycle_id", cur.cycle_id)
        .eq("ordem", targetOrdem)
        .maybeSingle();
      if (!neighbor) return;
      const n = neighbor as any;
      // swap ordens via temporary slot
      await supabase.from("cycle_stages" as any).update({ ordem: -1 }).eq("id", p.id);
      await supabase.from("cycle_stages" as any).update({ ordem: cur.ordem }).eq("id", n.id);
      await supabase.from("cycle_stages" as any).update({ ordem: n.ordem }).eq("id", p.id);
      await recalcSequence(cur.cycle_id);
    },
    onSuccess: () => invalidate(),
    onError: (e: any) =>
      toast({ title: "Erro ao mover", description: e.message, variant: "destructive" }),
  });

  const concluir = useMutation({
    mutationFn: async (p: {
      id: string;
      data_real: string;
      observacao?: string | null;
      responsavel_id?: string | null;
    }) => {
      // need data_inicio_real too; use previous stage's fim_real or hoje - duracao + 1
      const { data: row } = await supabase
        .from("cycle_stages" as any)
        .select("*")
        .eq("id", p.id)
        .maybeSingle();
      const s = row as any as CycleStage | null;
      const duracao = s?.duracao_dias ?? 1;
      const fim = new Date(p.data_real);
      const ini = new Date(fim);
      ini.setDate(ini.getDate() - (duracao - 1));
      const patch: any = {
        data_inicio_real: s?.data_inicio_real || ini.toISOString().slice(0, 10),
        data_fim_real: p.data_real,
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
      const r = data as unknown as CycleStage;
      await logHistory(r.id, r.cycle_id, "concluida", patch);
      return r;
    },
    onSuccess: () => {
      invalidate();
      toast({ title: "Etapa concluída" });
    },
    onError: (e: any) =>
      toast({ title: "Erro ao concluir", description: e.message, variant: "destructive" }),
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
        .eq("cycle_id", sourceCycleId)
        .order("ordem", { ascending: true });
      if (e1) throw e1;
      const rows = (source || []) as unknown as CycleStage[];
      if (rows.length === 0) return [];
      const payload = rows.map((s, i) => ({
        cycle_id: targetCycleId,
        nome: s.nome,
        atividade: s.atividade,
        observacoes: s.observacoes,
        responsavel_id: s.responsavel_id,
        duracao_dias: s.duracao_dias,
        ordem: i + 1,
        inicio_relativo_dias: 0,
        inicio_relativo_dias_min: 0,
        status: "nao_iniciada" as const,
      }));
      const { data, error } = await supabase.from("cycle_stages" as any).insert(payload as any).select();
      if (error) throw error;
      await recalcSequence(targetCycleId);
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
    move,
    concluir,
    duplicateFromCycle,
  };
}

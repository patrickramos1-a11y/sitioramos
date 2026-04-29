import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { addDaysISO } from "@/lib/operacaoConfig";

export interface Operation {
  id: string;
  parent_id: string | null;
  propriedade_id: string | null;
  talhao_id: string | null;
  area_id: string | null;
  cycle_id: string | null;
  nome: string;
  tipo: string;
  categoria: string | null;
  descricao: string | null;
  status: string;
  prioridade: string | null;
  data_inicio_prevista: string | null;
  data_inicio_real: string | null;
  data_fim_prevista: string | null;
  data_fim_real: string | null;
  duracao_prevista_dias: number | null;
  depends_on_id: string | null;
  cor_responsavel: string | null;
  responsavel: string | null;
  progresso_percentual: number | null;
  custo_total: number | null;
  ordem: number;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // computed
  children?: Operation[];
  tasks?: any[];
}

export interface OperationInsert {
  parent_id?: string | null;
  propriedade_id?: string | null;
  talhao_id?: string | null;
  area_id?: string | null;
  cycle_id?: string | null;
  nome: string;
  tipo?: string;
  categoria?: string | null;
  descricao?: string | null;
  status?: string;
  prioridade?: string | null;
  data_inicio_prevista?: string | null;
  data_inicio_real?: string | null;
  data_fim_prevista?: string | null;
  data_fim_real?: string | null;
  duracao_prevista_dias?: number | null;
  depends_on_id?: string | null;
  cor_responsavel?: string | null;
  responsavel?: string | null;
  progresso_percentual?: number | null;
  ordem?: number;
  observacoes?: string | null;
}

interface OperationFilters {
  areaId?: string;
  talhaoId?: string;
  cycleId?: string;
  status?: string;
}

async function resolveOperationContext(op: OperationInsert) {
  if (!op.parent_id) return op;

  const { data: parent, error } = await supabase
    .from("operational_stages")
    .select("propriedade_id, talhao_id, area_id, cycle_id")
    .eq("id", op.parent_id)
    .maybeSingle();

  if (error) throw error;
  if (!parent) return op;

  return {
    ...op,
    propriedade_id: parent.propriedade_id,
    talhao_id: parent.talhao_id,
    area_id: parent.area_id,
    cycle_id: parent.cycle_id,
  };
}

/**
 * Calcula data_inicio_prevista e data_fim_prevista de uma etapa
 * baseando-se em depends_on_id e duracao_prevista_dias.
 */
async function applyAutoDates<T extends OperationInsert | (Partial<Operation> & { id?: string })>(
  payload: T
): Promise<T> {
  const result: any = { ...payload };

  // Se há dependência, buscar a etapa antecessora
  if (result.depends_on_id) {
    const { data: dep } = await supabase
      .from("operational_stages")
      .select("data_fim_real, data_fim_prevista")
      .eq("id", result.depends_on_id)
      .maybeSingle();
    const baseFim = dep?.data_fim_real || dep?.data_fim_prevista;
    if (baseFim && !result.data_inicio_real) {
      result.data_inicio_prevista = addDaysISO(baseFim, 1);
    }
  }

  // Se temos início + duração, calcular fim previsto
  if (result.data_inicio_prevista && result.duracao_prevista_dias) {
    result.data_fim_prevista = addDaysISO(result.data_inicio_prevista, Math.max(0, Number(result.duracao_prevista_dias) - 1));
  }

  return result as T;
}

/**
 * Recalcula em cascata datas das etapas dependentes desta etapa.
 */
async function cascadeUpdateDependents(stageId: string) {
  const { data: dependents } = await supabase
    .from("operational_stages")
    .select("id, data_inicio_real, duracao_prevista_dias")
    .eq("depends_on_id", stageId);
  if (!dependents || dependents.length === 0) return;

  const { data: parent } = await supabase
    .from("operational_stages")
    .select("data_fim_real, data_fim_prevista")
    .eq("id", stageId)
    .maybeSingle();
  const baseFim = parent?.data_fim_real || parent?.data_fim_prevista;
  if (!baseFim) return;

  for (const dep of dependents) {
    if (dep.data_inicio_real) continue; // já iniciada, não recalcular
    const newStart = addDaysISO(baseFim, 1);
    const newEnd = dep.duracao_prevista_dias
      ? addDaysISO(newStart, Math.max(0, dep.duracao_prevista_dias - 1))
      : null;
    const updates: any = { data_inicio_prevista: newStart };
    if (newEnd) updates.data_fim_prevista = newEnd;
    await supabase.from("operational_stages").update(updates).eq("id", dep.id);
    // recursão: propagar para netos
    await cascadeUpdateDependents(dep.id);
  }
}

export function useOperations(filters?: OperationFilters) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: allStages = [], isLoading } = useQuery({
    queryKey: ["operations", filters],
    queryFn: async () => {
      let query = supabase
        .from("operational_stages")
        .select("*")
        .order("ordem", { ascending: true });

      if (filters?.cycleId) query = query.eq("cycle_id", filters.cycleId);
      if (filters?.areaId) query = query.eq("area_id", filters.areaId);
      if (filters?.talhaoId) query = query.eq("talhao_id", filters.talhaoId);
      if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status as any);

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as Operation[];
    },
  });

  // Separate into main operations (parent_id = null) and sub-operations
  const mainOperations = allStages.filter(s => !s.parent_id);
  const subOperations = allStages.filter(s => !!s.parent_id);

  // Build hierarchy
  const operationsWithChildren: Operation[] = mainOperations.map(op => ({
    ...op,
    children: subOperations.filter(s => s.parent_id === op.id).sort((a, b) => a.ordem - b.ordem),
  }));

  const createOperation = useMutation({
    mutationFn: async (op: OperationInsert) => {
      const payload = await resolveOperationContext(op);
      const { data, error } = await supabase
        .from("operational_stages")
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["operational_stages"] });
      queryClient.invalidateQueries({ queryKey: ["operational_tasks"] });
      toast({ title: "Operação criada com sucesso" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar operação", description: error.message, variant: "destructive" });
    },
  });

  const updateOperation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Operation> & { id: string }) => {
      const clean = { ...updates };
      delete (clean as any).children;
      delete (clean as any).tasks;
      const payload = clean.parent_id ? await resolveOperationContext(clean as OperationInsert) : clean;
      const { data, error } = await supabase
        .from("operational_stages")
        .update(payload as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["operational_stages"] });
      queryClient.invalidateQueries({ queryKey: ["operational_tasks"] });
      toast({ title: "Operação atualizada" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteOperation = useMutation({
    mutationFn: async (id: string) => {
      const childIds = subOperations.filter(s => s.parent_id === id).map(s => s.id);
      const stageIds = [id, ...childIds];

      const { error: taskError } = await supabase
        .from("operational_tasks")
        .delete()
        .in("stage_id", stageIds);
      if (taskError) throw taskError;

      if (childIds.length > 0) {
        const { error: childError } = await supabase
          .from("operational_stages")
          .delete()
          .in("id", childIds);
        if (childError) throw childError;
      }

      const { error } = await supabase.from("operational_stages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["operational_stages"] });
      queryClient.invalidateQueries({ queryKey: ["operational_tasks"] });
      toast({ title: "Operação excluída" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    },
  });

  const duplicateOperation = useMutation({
    mutationFn: async (operationId: string) => {
      const op = allStages.find(s => s.id === operationId);
      if (!op) throw new Error("Operação não encontrada");

      // Clone main operation
      const { id, created_at, updated_at, children, tasks, ...opData } = op as any;
      const { data: newOp, error: err1 } = await supabase
        .from("operational_stages")
        .insert({ ...opData, nome: `${op.nome} (cópia)`, status: "nao_iniciada", data_inicio_real: null, data_fim_real: null } as any)
        .select()
        .single();
      if (err1) throw err1;

      // Clone sub-operations
      const subs = subOperations.filter(s => s.parent_id === operationId);
      const stageMap = new Map<string, string>([[operationId, newOp.id]]);
      for (const sub of subs) {
        const { id: subId, created_at: sc, updated_at: su, ...subData } = sub as any;
        const { data: newSub, error: subError } = await supabase.from("operational_stages").insert({
          ...subData, parent_id: newOp.id, status: "nao_iniciada",
          data_inicio_real: null, data_fim_real: null,
        } as any).select("id").single();
        if (subError) throw subError;
        if (newSub) stageMap.set(subId, newSub.id);
      }

      const { data: sourceTasks, error: tasksError } = await supabase
        .from("operational_tasks")
        .select("*")
        .in("stage_id", [operationId, ...subs.map(sub => sub.id)]);

      if (tasksError) throw tasksError;

      if (sourceTasks && sourceTasks.length > 0) {
        const clonedTasks = sourceTasks.map(({ id: taskId, created_at, updated_at, parent_task_id, ...task }: any) => ({
          ...task,
          stage_id: task.stage_id ? stageMap.get(task.stage_id) ?? newOp.id : null,
          parent_task_id: null,
          status: "pendente",
          data_inicio_real: null,
          data_conclusao: null,
          cash_transaction_id: null,
          custo_real: null,
        }));

        const { error: cloneTaskError } = await supabase.from("operational_tasks").insert(clonedTasks);
        if (cloneTaskError) throw cloneTaskError;
      }

      return newOp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["operational_stages"] });
      queryClient.invalidateQueries({ queryKey: ["operational_tasks"] });
      toast({ title: "Operação duplicada" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao duplicar", description: error.message, variant: "destructive" });
    },
  });

  return {
    operations: operationsWithChildren,
    allStages,
    subOperations,
    isLoading,
    createOperation,
    updateOperation,
    deleteOperation,
    duplicateOperation,
  };
}

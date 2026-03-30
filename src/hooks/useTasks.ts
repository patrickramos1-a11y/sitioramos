import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Task {
  id: string;
  propriedade_id: string | null;
  talhao_id: string | null;
  area_id: string | null;
  cycle_id: string | null;
  stage_id: string | null;
  titulo: string;
  descricao: string | null;
  tipo: string;
  status: string;
  prioridade: string | null;
  data_inicio_prevista: string | null;
  data_inicio_real: string | null;
  data_prazo: string | null;
  data_conclusao: string | null;
  responsavel: string | null;
  custo_estimado: number | null;
  custo_real: number | null;
  cash_transaction_id: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  // joined
  operational_stages?: { nome: string } | null;
}

export interface TaskInsert {
  propriedade_id?: string | null;
  talhao_id?: string | null;
  area_id?: string | null;
  cycle_id?: string | null;
  stage_id?: string | null;
  titulo: string;
  descricao?: string | null;
  tipo?: string;
  status?: string;
  prioridade?: string | null;
  data_inicio_prevista?: string | null;
  data_inicio_real?: string | null;
  data_prazo?: string | null;
  data_conclusao?: string | null;
  responsavel?: string | null;
  custo_estimado?: number | null;
  custo_real?: number | null;
  cash_transaction_id?: string | null;
  observacoes?: string | null;
}

export function useTasks(filters?: { cycleId?: string; areaId?: string; stageId?: string; talhaoId?: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["operational_tasks", filters],
    queryFn: async () => {
      let query = supabase
        .from("operational_tasks")
        .select("*, operational_stages(nome)")
        .order("created_at", { ascending: false });

      if (filters?.cycleId) query = query.eq("cycle_id", filters.cycleId);
      if (filters?.areaId) query = query.eq("area_id", filters.areaId);
      if (filters?.stageId) query = query.eq("stage_id", filters.stageId);
      if (filters?.talhaoId) query = query.eq("talhao_id", filters.talhaoId);

      const { data, error } = await query;
      if (error) throw error;
      return data as Task[];
    },
  });

  const createTask = useMutation({
    mutationFn: async (task: TaskInsert) => {
      const { data, error } = await supabase
        .from("operational_tasks")
        .insert(task as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational_tasks"] });
      toast({ title: "Tarefa criada", description: "A tarefa foi cadastrada com sucesso." });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao criar tarefa", description: error.message, variant: "destructive" });
    },
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const cleanUpdates = { ...updates };
      delete (cleanUpdates as any).operational_stages;
      const { data, error } = await supabase
        .from("operational_tasks")
        .update(cleanUpdates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational_tasks"] });
      toast({ title: "Tarefa atualizada" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar tarefa", description: error.message, variant: "destructive" });
    },
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("operational_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operational_tasks"] });
      toast({ title: "Tarefa excluída" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao excluir tarefa", description: error.message, variant: "destructive" });
    },
  });

  return { tasks, isLoading, createTask, updateTask, deleteTask };
}

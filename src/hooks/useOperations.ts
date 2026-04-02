import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Operation {
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
  // computed
  children?: Operation[];
  tasks?: any[];
}

export interface OperationInsert {
  parent_id?: string | null;
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

interface OperationFilters {
  areaId?: string;
  talhaoId?: string;
  cycleId?: string;
  status?: string;
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
      if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);

      const { data, error } = await query;
      if (error) throw error;
      return data as Operation[];
    },
  });

  // Separate into main operations (parent_id = null) and sub-operations
  const mainOperations = allStages.filter(s => !s.parent_id);
  const subOperations = allStages.filter(s => !!s.parent_id);

  // Build hierarchy
  const operationsWithChildren: Operation[] = mainOperations.map(op => ({
    ...op,
    children: subOperations.filter(s => s.parent_id === op.id),
  }));

  const createOperation = useMutation({
    mutationFn: async (op: OperationInsert) => {
      const { data, error } = await supabase
        .from("operational_stages")
        .insert(op as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["operational_stages"] });
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
      const { data, error } = await supabase
        .from("operational_stages")
        .update(clean as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["operational_stages"] });
      toast({ title: "Operação atualizada" });
    },
    onError: (error: any) => {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    },
  });

  const deleteOperation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("operational_stages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["operational_stages"] });
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
      for (const sub of subs) {
        const { id: subId, created_at: sc, updated_at: su, ...subData } = sub as any;
        await supabase.from("operational_stages").insert({
          ...subData, parent_id: newOp.id, status: "nao_iniciada",
          data_inicio_real: null, data_fim_real: null,
        } as any);
      }

      return newOp;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["operations"] });
      queryClient.invalidateQueries({ queryKey: ["operational_stages"] });
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

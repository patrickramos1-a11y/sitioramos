import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ChecklistItem {
  id: string;
  task_id: string;
  texto: string;
  concluido: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export function useTaskChecklist(taskId: string | null | undefined) {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["task_checklist_items", taskId],
    enabled: !!taskId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_checklist_items" as any)
        .select("*")
        .eq("task_id", taskId!)
        .order("ordem", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as unknown as ChecklistItem[];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["task_checklist_items", taskId] });

  const addItem = useMutation({
    mutationFn: async (texto: string) => {
      if (!taskId) throw new Error("Tarefa sem id");
      const { error } = await supabase.from("task_checklist_items" as any).insert({
        task_id: taskId, texto, ordem: items.length,
      } as any);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (e: any) => toast({ title: "Erro ao adicionar item", description: e.message, variant: "destructive" }),
  });

  const toggleItem = useMutation({
    mutationFn: async ({ id, concluido }: { id: string; concluido: boolean }) => {
      const { error } = await supabase.from("task_checklist_items" as any).update({ concluido } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const updateText = useMutation({
    mutationFn: async ({ id, texto }: { id: string; texto: string }) => {
      const { error } = await supabase.from("task_checklist_items" as any).update({ texto } as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const removeItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("task_checklist_items" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const total = items.length;
  const done = items.filter(i => i.concluido).length;
  const percent = total ? Math.round((done / total) * 100) : 0;

  return { items, isLoading, addItem, toggleItem, updateText, removeItem, total, done, percent };
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface HistoryEvent {
  id: string;
  kind: "stage_change" | "task_log" | "stage_created" | "task_created" | "transaction" | "journal";
  at: string; // ISO
  title: string;
  detail?: string;
  refId?: string;
  refLabel?: string;
}

interface Args {
  stageIds: string[];
  taskIds: string[];
  transactionIds?: string[];
  journalIds?: string[];
  enabled?: boolean;
}

/**
 * Agrega histórico de mudanças relevantes para um projeto:
 * - Alterações de etapas (operation_change_logs)
 * - Logs de tarefas (task_logs)
 * - Criação dos próprios stages e tarefas (created_at)
 */
export function useProjectHistory({ stageIds, taskIds, enabled = true }: Args) {
  return useQuery({
    queryKey: ["project-history", stageIds.sort().join(","), taskIds.sort().join(",")],
    enabled: enabled && (stageIds.length > 0 || taskIds.length > 0),
    queryFn: async () => {
      const events: HistoryEvent[] = [];

      // 1) Mudanças em etapas
      if (stageIds.length > 0) {
        const { data: changes } = await supabase
          .from("operation_change_logs" as any)
          .select("id, stage_id, campo, valor_antigo, valor_novo, alterado_em")
          .in("stage_id", stageIds)
          .order("alterado_em", { ascending: false })
          .limit(100);

        const { data: stages } = await supabase
          .from("operational_stages" as any)
          .select("id, nome, created_at, nivel_tipo")
          .in("id", stageIds);

        const stageMap = new Map<string, any>((stages || []).map((s: any) => [s.id, s]));

        (changes || []).forEach((c: any) => {
          const s = stageMap.get(c.stage_id);
          const fieldLabel: Record<string, string> = {
            data_fim_prevista: "Prazo final",
            status: "Status",
            responsavel: "Responsável",
          };
          events.push({
            id: `c-${c.id}`,
            kind: "stage_change",
            at: c.alterado_em,
            title: `${fieldLabel[c.campo] || c.campo} alterado`,
            detail: `${c.valor_antigo || "—"} → ${c.valor_novo || "—"}`,
            refId: c.stage_id,
            refLabel: s?.nome,
          });
        });

        // Eventos de criação dos stages
        (stages || []).forEach((s: any) => {
          events.push({
            id: `s-${s.id}`,
            kind: "stage_created",
            at: s.created_at,
            title: `${s.nivel_tipo === "projeto" ? "Projeto" : "Subprojeto"} criado`,
            refId: s.id,
            refLabel: s.nome,
          });
        });
      }

      // 2) Logs de tarefas
      if (taskIds.length > 0) {
        const { data: tlogs } = await supabase
          .from("task_logs" as any)
          .select("id, task_id, acao, valor_anterior, valor_novo, registrado_em")
          .in("task_id", taskIds)
          .order("registrado_em", { ascending: false })
          .limit(100);

        const { data: tarefas } = await supabase
          .from("operational_tasks" as any)
          .select("id, titulo, created_at, status, data_conclusao")
          .in("id", taskIds);

        const tmap = new Map<string, any>((tarefas || []).map((t: any) => [t.id, t]));

        (tlogs || []).forEach((l: any) => {
          const t = tmap.get(l.task_id);
          events.push({
            id: `tl-${l.id}`,
            kind: "task_log",
            at: l.registrado_em,
            title: `Tarefa: ${l.acao}`,
            detail: t?.titulo,
            refId: l.task_id,
            refLabel: t?.titulo,
          });
        });

        (tarefas || []).forEach((t: any) => {
          events.push({
            id: `t-${t.id}`,
            kind: "task_created",
            at: t.created_at,
            title: "Tarefa criada",
            refId: t.id,
            refLabel: t.titulo,
          });
          if (t.data_conclusao && t.status === "concluida") {
            events.push({
              id: `td-${t.id}`,
              kind: "task_log",
              at: t.data_conclusao,
              title: "Tarefa concluída",
              refId: t.id,
              refLabel: t.titulo,
            });
          }
        });
      }

      events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
      return events.slice(0, 150);
    },
  });
}

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Responsavel, useResponsaveis } from "@/hooks/useResponsaveis";
import { ResponsavelForm } from "@/components/responsaveis/ResponsavelForm";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Indicators {
  projetos: number;
  tarefasAndamento: number;
  tarefasAtrasadas: number;
  tarefasConcluidas: number;
  custos: number;
  receitas: number;
  transacoes: number;
  areas: number;
  ciclos: number;
}

function useIndicators() {
  return useQuery({
    queryKey: ["responsaveis-indicators"],
    queryFn: async () => {
      const [stages, tasks, txs, areas, cycles] = await Promise.all([
        supabase.from("operational_stages").select("responsavel_id, nivel_tipo"),
        supabase.from("operational_tasks").select("responsavel_id, status, data_prazo"),
        supabase.from("cash_transactions").select("responsavel_id, tipo, valor"),
        supabase.from("areas").select("responsavel_id"),
        supabase.from("cycles").select("responsavel_id"),
      ]);

      const map: Record<string, Indicators> = {};
      const get = (id: string | null | undefined): Indicators => {
        const k = id || "__none__";
        if (!map[k]) map[k] = { projetos: 0, tarefasAndamento: 0, tarefasAtrasadas: 0, tarefasConcluidas: 0, custos: 0, receitas: 0, transacoes: 0, areas: 0, ciclos: 0 };
        return map[k];
      };

      (stages.data || []).forEach((s: any) => {
        if (s.nivel_tipo === "projeto") get(s.responsavel_id).projetos++;
      });

      const today = new Date().toISOString().split("T")[0];
      (tasks.data || []).forEach((t: any) => {
        const i = get(t.responsavel_id);
        if (t.status === "concluida") i.tarefasConcluidas++;
        else if (t.status === "em_andamento") i.tarefasAndamento++;
        if (t.status !== "concluida" && t.data_prazo && t.data_prazo < today) i.tarefasAtrasadas++;
      });

      (txs.data || []).forEach((t: any) => {
        const i = get(t.responsavel_id);
        i.transacoes++;
        const v = Number(t.valor) || 0;
        if (t.tipo === "entrada") i.receitas += v;
        else i.custos += v;
      });
      (areas.data || []).forEach((a: any) => get(a.responsavel_id).areas++);
      (cycles.data || []).forEach((c: any) => get(c.responsavel_id).ciclos++);

      return map;
    },
  });
}

const fmtMoney = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export default function Responsaveis() {
  const { data: responsaveis, isLoading, remove } = useResponsaveis(true);
  const { data: indicators } = useIndicators();
  const [editing, setEditing] = useState<Responsavel | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Responsavel | null>(null);

  const openNew = () => { setEditing(null); setFormOpen(true); };
  const openEdit = (r: Responsavel) => { setEditing(r); setFormOpen(true); };

  return (
    <AppLayout>
      <div className="space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h1 className="font-display text-2xl font-semibold flex items-center gap-2">
              <Users className="h-6 w-6 text-brand-leaf" /> Responsáveis
            </h1>
            <p className="text-sm text-muted-foreground">Pessoas vinculadas aos registros (não é login)</p>
          </div>
          <Button onClick={openNew}>
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
        </div>

        {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}

        <div className="grid gap-3 md:grid-cols-2">
          {(responsaveis || []).map((r) => {
            const ind = indicators?.[r.id];
            return (
              <Card key={r.id} className="p-4 space-y-3 border-l-4" style={{ borderLeftColor: r.cor }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold text-lg shrink-0"
                      style={{ backgroundColor: r.cor }}
                    >
                      {(r.apelido || r.nome).charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-semibold truncate">{r.nome}</h3>
                      {r.apelido && r.apelido !== r.nome && (
                        <p className="text-xs text-muted-foreground truncate">{r.apelido}</p>
                      )}
                      <Badge variant={r.status === "ativo" ? "default" : "secondary"} className="mt-1 text-[10px]">
                        {r.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setToDelete(r)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <Stat label="Projetos" value={ind?.projetos ?? 0} />
                  <Stat label="Em Andam." value={ind?.tarefasAndamento ?? 0} />
                  <Stat label="Atrasadas" value={ind?.tarefasAtrasadas ?? 0} highlight={ind?.tarefasAtrasadas ? "destructive" : undefined} />
                  <Stat label="Concluídas" value={ind?.tarefasConcluidas ?? 0} />
                  <Stat label="Áreas" value={ind?.areas ?? 0} />
                  <Stat label="Ciclos" value={ind?.ciclos ?? 0} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t">
                  <Stat label="Custos" value={fmtMoney(ind?.custos ?? 0)} small />
                  <Stat label="Receitas" value={fmtMoney(ind?.receitas ?? 0)} small />
                  <Stat label="Transações" value={ind?.transacoes ?? 0} small />
                </div>

                {r.observacoes && (
                  <p className="text-xs text-muted-foreground border-t pt-2">{r.observacoes}</p>
                )}
              </Card>
            );
          })}
        </div>

        <ResponsavelForm open={formOpen} onOpenChange={setFormOpen} responsavel={editing} />

        <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover {toDelete?.nome}?</AlertDialogTitle>
              <AlertDialogDescription>
                Os registros vinculados ficarão sem responsável.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={async () => {
                  if (toDelete) await remove.mutateAsync(toDelete.id);
                  setToDelete(null);
                }}
              >
                Remover
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppLayout>
  );
}

function Stat({ label, value, small, highlight }: { label: string; value: number | string; small?: boolean; highlight?: "destructive" }) {
  return (
    <div>
      <p className={`font-semibold ${small ? "text-xs" : "text-base"} ${highlight === "destructive" ? "text-destructive" : ""}`}>
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

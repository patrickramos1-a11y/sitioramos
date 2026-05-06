import { useMemo } from "react";
import { useCashTransactions } from "@/hooks/useCashTransactions";
import { Task } from "@/hooks/useTasks";
import { DollarSign, Plus, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

interface Props {
  operationId: string;
  subOperationIds?: string[];
  relatedTasks: Task[];
}

export function OperationCostBlock({ operationId, subOperationIds = [], relatedTasks }: Props) {
  const allOpIds = useMemo(() => [operationId, ...subOperationIds], [operationId, subOperationIds]);
  const { transactions } = useCashTransactions();

  const linkedTransactions = useMemo(
    () => transactions.filter(t => t.operation_id && allOpIds.includes(t.operation_id) && t.tipo === "saida"),
    [transactions, allOpIds]
  );

  const totalLancamentos = linkedTransactions.reduce((s, t) => s + Number(t.valor), 0);
  const totalTarefas = relatedTasks.reduce((s, t) => s + (Number(t.custo_real) || 0), 0);
  const totalGeral = totalLancamentos + totalTarefas;

  if (totalGeral === 0 && linkedTransactions.length === 0 && relatedTasks.every(t => !t.custo_real)) {
    return (
      <div className="border rounded-lg p-3 bg-muted/20 text-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-semibold flex items-center gap-1">
            <DollarSign className="h-3 w-3" />Custos vinculados
          </span>
          <Button asChild variant="outline" size="sm" className="h-7 text-xs">
            <Link to={`/lancamentos?operation=${operationId}`}>
              <Plus className="h-3 w-3 mr-1" />Novo
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">Nenhum custo registrado para esta operação.</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-3 bg-muted/20 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold flex items-center gap-1">
          <DollarSign className="h-3 w-3" />Custos vinculados
        </span>
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
          <Link to={`/lancamentos?operation=${operationId}`}>
            <ExternalLink className="h-3 w-3 mr-1" />Ver todos
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="Lançamentos" value={totalLancamentos} sub={`${linkedTransactions.length}`} />
        <Stat label="Tarefas" value={totalTarefas} sub={`${relatedTasks.length}`} />
        <Stat label="Total" value={totalGeral} highlight />
      </div>

      {linkedTransactions.length > 0 && (
        <div className="space-y-1 pt-1 border-t">
          {linkedTransactions.slice(0, 4).map(t => (
            <div key={t.id} className="flex items-center justify-between gap-2">
              <span className="truncate flex-1 text-muted-foreground">{t.descricao || "Sem descrição"}</span>
              <Badge variant="outline" className="text-[10px]">{fmt(Number(t.valor))}</Badge>
            </div>
          ))}
          {linkedTransactions.length > 4 && (
            <p className="text-[10px] text-muted-foreground italic">+ {linkedTransactions.length - 4} mais...</p>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, sub, highlight }: { label: string; value: number; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded p-2 ${highlight ? "bg-primary/10 border border-primary/30" : "bg-background"}`}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className={`font-bold tabular-nums ${highlight ? "text-primary" : ""}`}>{fmt(value)}</div>
      {sub && <div className="text-[9px] text-muted-foreground">{sub} item(s)</div>}
    </div>
  );
}

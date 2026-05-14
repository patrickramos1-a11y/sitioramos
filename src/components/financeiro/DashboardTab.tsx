import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFinClassificacoes } from "@/hooks/financeiro/useFinClassificacoes";
import { useFinNaturezas } from "@/hooks/financeiro/useFinNaturezas";
import { useCashTransactions } from "@/hooks/useCashTransactions";
import { CheckCircle2, AlertCircle, Wallet } from "lucide-react";

export function DashboardTab() {
  const { data: txs = [] } = useCashTransactions();
  const { data: classifs = [] } = useFinClassificacoes();
  const { data: naturezas = [] } = useFinNaturezas();

  const classifiedIds = new Set(classifs.map((c) => c.cash_transaction_id));
  const totalTx = txs.length;
  const totalClass = txs.filter((t) => classifiedIds.has(t.id)).length;
  const totalNaoClass = totalTx - totalClass;

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const totalEntradas = txs
    .filter((t) => t.tipo === "entrada")
    .reduce((s, t) => s + Number(t.valor), 0);
  const totalSaidas = txs
    .filter((t) => t.tipo === "saida")
    .reduce((s, t) => s + Number(t.valor), 0);

  // Por natureza (apenas dos classificados)
  const porNatureza = naturezas.map((n) => {
    const total = classifs
      .filter((c) => c.natureza_id === n.id)
      .reduce((s, c) => {
        const tx = txs.find((t) => t.id === c.cash_transaction_id);
        return s + (tx ? Number(tx.valor) : 0);
      }, 0);
    return { ...n, total };
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" /> Lançamentos totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalTx}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Classificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalClass}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" /> Não classificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{totalNaoClass}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Saldo bruto</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{fmt(totalEntradas - totalSaidas)}</p>
            <p className="text-[10px] text-muted-foreground">
              {fmt(totalEntradas)} − {fmt(totalSaidas)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Totais por natureza (classificados)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {porNatureza.map((n) => (
            <div key={n.id} className="flex items-center justify-between text-sm">
              <span>{n.nome}</span>
              <span className="font-medium">{fmt(n.total)}</span>
            </div>
          ))}
          {totalClass === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhum lançamento classificado ainda. Use a aba <strong>Reclassificação</strong>{" "}
              quando estiver disponível.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

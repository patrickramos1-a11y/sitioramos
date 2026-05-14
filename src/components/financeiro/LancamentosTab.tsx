import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { useCashTransactions } from "@/hooks/useCashTransactions";
import { useFinClassificacoes } from "@/hooks/financeiro/useFinClassificacoes";

export function LancamentosTab() {
  const { data: txs = [], isLoading } = useCashTransactions();
  const { data: classifs = [] } = useFinClassificacoes();
  const classifiedIds = new Set(classifs.map((c) => c.cash_transaction_id));

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (isLoading) return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <Card className="divide-y">
      <div className="p-3 text-xs text-muted-foreground">
        {txs.length} lançamentos — visualização somente leitura nesta etapa. A
        reclassificação será habilitada na próxima entrega.
      </div>
      {txs.slice(0, 200).map((t) => {
        const classified = classifiedIds.has(t.id);
        return (
          <div key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
            <span className="text-xs text-muted-foreground w-20 shrink-0">
              {new Date(t.data).toLocaleDateString("pt-BR")}
            </span>
            <span className="flex-1 truncate">{t.descricao || "(sem descrição)"}</span>
            <Badge variant={classified ? "default" : "outline"} className="text-[10px]">
              {classified ? "Classificado" : "Não classificado"}
            </Badge>
            <span
              className={`w-24 text-right font-medium ${
                t.tipo === "entrada" ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {fmt(Number(t.valor))}
            </span>
          </div>
        );
      })}
      {txs.length > 200 && (
        <div className="p-3 text-xs text-muted-foreground">
          Exibindo os primeiros 200. Filtros e paginação chegam na próxima etapa.
        </div>
      )}
    </Card>
  );
}

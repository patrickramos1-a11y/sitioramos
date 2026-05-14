import { useMemo } from "react";
import { useCashTransactions } from "@/hooks/useCashTransactions";
import { useFinClassificacoes } from "@/hooks/financeiro/useFinClassificacoes";
import { useFinCategorias } from "@/hooks/financeiro/useFinCategorias";
import { useFinNaturezas } from "@/hooks/financeiro/useFinNaturezas";
import { useFinCentrosCusto } from "@/hooks/financeiro/useFinCentrosCusto";
import { useFinProjetos } from "@/hooks/financeiro/useFinProjetos";
import { useLoans } from "@/hooks/useLoans";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { resolveAll, type ResolvedTx, type GrupoGerencial } from "@/lib/financeiro/managementGroup";

export type FinFilters = {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  tipo?: "entrada" | "saida";
  naturezaId?: string;
  categoriaId?: string;
  centroCustoId?: string;
  areaId?: string;
  cycleId?: string;
  projetoId?: string;
  loanId?: string;
  classificacao?: "todos" | "classificados" | "nao_classificados";
  revisao?: "todos" | "revisados" | "nao_revisados";
  incluirNaoRevisados?: boolean; // default true
};

export const defaultFilters: FinFilters = {
  classificacao: "todos",
  revisao: "todos",
  incluirNaoRevisados: true,
};

function applyFilters(resolved: ResolvedTx[], f: FinFilters): ResolvedTx[] {
  return resolved.filter(({ tx, classif }) => {
    if (f.startDate && tx.data < f.startDate) return false;
    if (f.endDate && tx.data > f.endDate) return false;
    if (f.tipo && tx.tipo !== f.tipo) return false;
    if (f.areaId && tx.area_id !== f.areaId && classif?.area_id !== f.areaId) return false;
    if (f.cycleId && tx.cycle_id !== f.cycleId && classif?.cycle_id !== f.cycleId) return false;
    if (f.loanId && tx.loan_id !== f.loanId && classif?.loan_id !== f.loanId) return false;
    if (f.naturezaId && classif?.natureza_id !== f.naturezaId) return false;
    if (f.categoriaId && classif?.categoria_id !== f.categoriaId) return false;
    if (f.centroCustoId && classif?.centro_custo_id !== f.centroCustoId) return false;
    if (f.projetoId && classif?.projeto_investimento_id !== f.projetoId) return false;
    if (f.classificacao === "classificados" && !classif) return false;
    if (f.classificacao === "nao_classificados" && classif) return false;
    if (f.revisao === "revisados" && !classif?.revisado) return false;
    if (f.revisao === "nao_revisados" && classif?.revisado) return false;
    if (f.incluirNaoRevisados === false && classif && !classif.revisado) return false;
    return true;
  });
}

export function useFinanceiroAnalytics(filters: FinFilters = defaultFilters) {
  const { transactions = [] } = useCashTransactions();
  const { data: classifs = [] } = useFinClassificacoes();
  const { data: cats = [] } = useFinCategorias();
  const { data: naturezas = [] } = useFinNaturezas();
  const { data: centros = [] } = useFinCentrosCusto();
  const { data: projetos = [] } = useFinProjetos();
  const { loans = [] } = useLoans();
  const { areas = [] } = useAreas();
  const { cycles = [] } = useCycles();

  const resolved = useMemo(
    () => resolveAll(transactions, classifs, cats, naturezas),
    [transactions, classifs, cats, naturezas]
  );
  const filtered = useMemo(() => applyFilters(resolved, filters), [resolved, filters]);

  // Loan metrics from loans module (read-only)
  const loanMetrics = useMemo(() => {
    return loans.map((l: any) => {
      const installments = (l.installments || []) as Array<{ valor: number; status: string; data_vencimento: string }>;
      const pagas = installments.filter((i) => i.status === "paga");
      const pendentes = installments.filter((i) => i.status !== "paga");
      const totalPago = pagas.reduce((s, i) => s + Number(i.valor || 0), 0);
      const saldoDevedor = pendentes.reduce((s, i) => s + Number(i.valor || 0), 0);
      // Juros e tarifas vinculados via loan_id em fin_classificacoes/cash_transactions
      const txsLoan = resolved.filter((r) => r.tx.loan_id === l.id);
      const juros = txsLoan.filter((r) => r.grupo === "juros_tarifas" && (r.classif?.tipo_evento_emprestimo === "juros")).reduce((s, r) => s + Number(r.tx.valor), 0);
      const tarifas = txsLoan.filter((r) => r.classif?.tipo_evento_emprestimo === "tarifa").reduce((s, r) => s + Number(r.tx.valor), 0);
      return {
        loan: l,
        totalPago,
        saldoDevedor,
        parcelasPagas: pagas.length,
        parcelasFuturas: pendentes,
        juros,
        tarifas,
        txsLoan,
        unlinkedTxs: txsLoan.filter((r) => !r.classif),
      };
    });
  }, [loans, resolved]);

  return {
    resolved,
    filtered,
    transactions,
    classifs,
    cats,
    naturezas,
    centros,
    projetos,
    loans,
    areas,
    cycles,
    loanMetrics,
  };
}

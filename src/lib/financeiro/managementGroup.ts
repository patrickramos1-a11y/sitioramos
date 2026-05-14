// Derivador de "grupo gerencial" — fonte única de verdade para Dashboard/Relatórios.
// Não altera o banco. Calcula a partir de fin_classificacoes + cash_transactions.

import type { FinClassificacao, LoanEvent } from "@/hooks/financeiro/useFinClassificacoes";
import type { FinCategoria } from "@/hooks/financeiro/useFinCategorias";
import type { FinNatureza } from "@/hooks/financeiro/useFinNaturezas";
import type { CashTransaction } from "@/hooks/useCashTransactions";

export type GrupoGerencial =
  | "receita_operacional"
  | "aporte_socios"
  | "entrada_emprestimo"
  | "outras_entradas"
  | "custo_plantacao"
  | "investimento"
  | "pagamento_emprestimo"
  | "juros_tarifas"
  | "despesa_geral"
  | "ajuste"
  | "nao_classificado";

export const grupoLabels: Record<GrupoGerencial, string> = {
  receita_operacional: "Receita Operacional",
  aporte_socios: "Aporte dos Sócios",
  entrada_emprestimo: "Empréstimo Recebido",
  outras_entradas: "Outras Entradas",
  custo_plantacao: "Custo de Plantação",
  investimento: "Investimento / Benfeitoria",
  pagamento_emprestimo: "Pagamento de Empréstimo",
  juros_tarifas: "Juros e Tarifas",
  despesa_geral: "Despesa Geral",
  ajuste: "Ajuste",
  nao_classificado: "Não Classificado",
};

export const grupoColors: Record<GrupoGerencial, string> = {
  receita_operacional: "hsl(142 65% 45%)",
  aporte_socios: "hsl(200 75% 50%)",
  entrada_emprestimo: "hsl(265 60% 55%)",
  outras_entradas: "hsl(180 50% 45%)",
  custo_plantacao: "hsl(28 75% 50%)",
  investimento: "hsl(45 85% 50%)",
  pagamento_emprestimo: "hsl(355 65% 55%)",
  juros_tarifas: "hsl(15 75% 50%)",
  despesa_geral: "hsl(0 0% 45%)",
  ajuste: "hsl(220 15% 60%)",
  nao_classificado: "hsl(48 95% 55%)",
};

const ENTRADA_GRUPOS: GrupoGerencial[] = [
  "receita_operacional",
  "aporte_socios",
  "entrada_emprestimo",
  "outras_entradas",
];
const SAIDA_GRUPOS: GrupoGerencial[] = [
  "custo_plantacao",
  "investimento",
  "pagamento_emprestimo",
  "juros_tarifas",
  "despesa_geral",
];
export const isEntradaGrupo = (g: GrupoGerencial) => ENTRADA_GRUPOS.includes(g);
export const isSaidaGrupo = (g: GrupoGerencial) => SAIDA_GRUPOS.includes(g);

export type ResolvedTx = {
  tx: CashTransaction;
  classif: FinClassificacao | null;
  grupo: GrupoGerencial;
};

export function resolveGrupo(
  tx: CashTransaction,
  classif: FinClassificacao | null,
  cats: FinCategoria[],
  natureza: FinNatureza[]
): GrupoGerencial {
  if (!classif) return "nao_classificado";

  const cat = classif.categoria_id ? cats.find((c) => c.id === classif.categoria_id) : null;
  const nat = classif.natureza_id ? natureza.find((n) => n.id === classif.natureza_id) : null;
  const ev: LoanEvent | null = classif.tipo_evento_emprestimo as LoanEvent | null;

  // Eventos de empréstimo têm prioridade
  if (ev === "juros" || ev === "tarifa") return "juros_tarifas";
  if (ev === "pagamento_parcela" || ev === "amortizacao") return "pagamento_emprestimo";
  if (ev === "recebimento") return "entrada_emprestimo";

  // Por código de categoria
  switch (cat?.codigo) {
    case "rc_aporte_socios":
      return "aporte_socios";
    case "rc_emprestimo":
      return "entrada_emprestimo";
    case "rc_venda_produto":
    case "rc_aluguel_equip":
      return "receita_operacional";
    case "rc_reembolso":
    case "rc_venda_ativo":
    case "rc_outras":
      return "outras_entradas";
    case "de_pagamento_emprestimo":
      return "pagamento_emprestimo";
    case "de_amortizacao_emprestimo":
      return "pagamento_emprestimo";
    case "adm_juros":
    case "adm_tarifas":
      return "juros_tarifas";
  }

  // Por natureza
  switch (nat?.codigo) {
    case "custo_plantacao":
      return "custo_plantacao";
    case "investimento":
      return "investimento";
    case "despesa_geral":
      return "despesa_geral";
    case "receita":
      return tx.loan_id ? "entrada_emprestimo" : "outras_entradas";
    case "ajuste":
      return "ajuste";
  }

  return tx.tipo === "entrada" ? "outras_entradas" : "despesa_geral";
}

export function resolveAll(
  txs: CashTransaction[],
  classifs: FinClassificacao[],
  cats: FinCategoria[],
  natureza: FinNatureza[]
): ResolvedTx[] {
  const byTx = new Map(classifs.map((c) => [c.cash_transaction_id, c]));
  return txs.map((tx) => {
    const classif = byTx.get(tx.id) ?? null;
    return { tx, classif, grupo: resolveGrupo(tx, classif, cats, natureza) };
  });
}

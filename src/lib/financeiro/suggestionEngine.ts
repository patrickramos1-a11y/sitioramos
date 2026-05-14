import type { LoanEvent } from "@/hooks/financeiro/useFinClassificacoes";

export type Suggestion = {
  categoriaCodigo?: string;
  centroCustoCodigo?: string;
  naturezaCodigo?: string;
  loanEvent?: LoanEvent;
  loanRelated?: boolean;
  confianca: "alta" | "media" | "baixa";
  motivo: string;
};

type Rule = {
  keywords: string[];
  match: (tipo: "entrada" | "saida") => boolean;
  result: Omit<Suggestion, "motivo">;
  motivo: string;
};

const ANY = (_: "entrada" | "saida") => true;
const SAIDA = (t: "entrada" | "saida") => t === "saida";
const ENTRADA = (t: "entrada" | "saida") => t === "entrada";

// Order matters — first match wins
const RULES: Rule[] = [
  // Loan events (highest priority — specific keywords)
  {
    keywords: ["juros emprestimo", "juros empréstimo", "encargos"],
    match: ANY,
    result: {
      categoriaCodigo: "adm_juros",
      centroCustoCodigo: "administracao",
      naturezaCodigo: "despesa_geral",
      loanEvent: "juros",
      loanRelated: true,
      confianca: "alta",
    },
    motivo: "Descrição contém 'juros' relacionado a empréstimo",
  },
  {
    keywords: ["tarifa emprestimo", "tarifa empréstimo", "tarifa contrato"],
    match: ANY,
    result: {
      categoriaCodigo: "adm_tarifas",
      centroCustoCodigo: "administracao",
      naturezaCodigo: "despesa_geral",
      loanEvent: "tarifa",
      loanRelated: true,
      confianca: "alta",
    },
    motivo: "Descrição contém 'tarifa' relacionada a empréstimo",
  },
  {
    keywords: ["amortizacao", "amortização"],
    match: SAIDA,
    result: {
      categoriaCodigo: "de_amortizacao_emprestimo",
      centroCustoCodigo: "administracao",
      naturezaCodigo: "despesa_geral",
      loanEvent: "amortizacao",
      loanRelated: true,
      confianca: "alta",
    },
    motivo: "Descrição indica amortização de empréstimo",
  },
  {
    keywords: [
      "parcela emprestimo",
      "parcela empréstimo",
      "pagamento emprestimo",
      "pagamento empréstimo",
      "prestacao",
      "prestação",
    ],
    match: SAIDA,
    result: {
      categoriaCodigo: "de_pagamento_emprestimo",
      centroCustoCodigo: "administracao",
      naturezaCodigo: "despesa_geral",
      loanEvent: "pagamento_parcela",
      loanRelated: true,
      confianca: "alta",
    },
    motivo: "Descrição indica pagamento de parcela",
  },
  {
    keywords: ["emprestimo", "empréstimo", "credito", "crédito", "financiamento", "capital de giro"],
    match: ENTRADA,
    result: {
      categoriaCodigo: "rc_emprestimo",
      centroCustoCodigo: "administracao",
      naturezaCodigo: "receita",
      loanEvent: "recebimento",
      loanRelated: true,
      confianca: "alta",
    },
    motivo: "Entrada com descrição de empréstimo recebido",
  },

  // Banking
  { keywords: ["tarifa"], match: SAIDA, result: { categoriaCodigo: "adm_tarifas", centroCustoCodigo: "administracao", naturezaCodigo: "despesa_geral", confianca: "media" }, motivo: "Tarifa bancária" },
  { keywords: ["juros"], match: SAIDA, result: { categoriaCodigo: "adm_juros", centroCustoCodigo: "administracao", naturezaCodigo: "despesa_geral", confianca: "media" }, motivo: "Juros bancários" },

  // Revenue — aporte (alta prioridade, antes de "venda")
  { keywords: ["aporte", "aporte socio", "aporte sócio", "aporte de socio", "aporte de sócio", "patrick", "william", "reforco de caixa", "reforço de caixa"], match: ENTRADA, result: { categoriaCodigo: "rc_aporte_socios", centroCustoCodigo: "propriedade_geral", naturezaCodigo: "receita", confianca: "alta" }, motivo: "Aporte dos sócios" },
  { keywords: ["venda"], match: ENTRADA, result: { categoriaCodigo: "rc_venda_produto", centroCustoCodigo: "comercializacao", naturezaCodigo: "receita", confianca: "media" }, motivo: "Venda de produto" },

  // Plantation costs
  { keywords: ["trator"], match: SAIDA, result: { categoriaCodigo: "cp_trator", centroCustoCodigo: "producao_agricola", naturezaCodigo: "custo_plantacao", confianca: "alta" }, motivo: "Operação com trator" },
  { keywords: ["diesel", "gasolina", "combustivel", "combustível"], match: SAIDA, result: { categoriaCodigo: "cp_combustivel", centroCustoCodigo: "producao_agricola", naturezaCodigo: "custo_plantacao", confianca: "alta" }, motivo: "Combustível" },
  { keywords: ["diaria", "diária", "mao de obra", "mão de obra", "ajudante", "serviço", "servico"], match: SAIDA, result: { categoriaCodigo: "cp_mao_obra", centroCustoCodigo: "producao_agricola", naturezaCodigo: "custo_plantacao", confianca: "alta" }, motivo: "Mão de obra" },
  { keywords: ["maniva", "muda", "mudas", "semente", "sementes"], match: SAIDA, result: { categoriaCodigo: "cp_mudas_sementes", centroCustoCodigo: "producao_agricola", naturezaCodigo: "custo_plantacao", confianca: "alta" }, motivo: "Mudas/sementes" },
  { keywords: ["adubo", "calcario", "calcário", "fertilizante"], match: SAIDA, result: { categoriaCodigo: "cp_adubacao", centroCustoCodigo: "producao_agricola", naturezaCodigo: "custo_plantacao", confianca: "alta" }, motivo: "Adubação" },
  { keywords: ["herbicida"], match: SAIDA, result: { categoriaCodigo: "cp_herbicida", centroCustoCodigo: "producao_agricola", naturezaCodigo: "custo_plantacao", confianca: "alta" }, motivo: "Herbicida" },
  { keywords: ["frete", "transporte", "logistica", "logística"], match: SAIDA, result: { categoriaCodigo: "cp_frete", centroCustoCodigo: "producao_agricola", naturezaCodigo: "custo_plantacao", confianca: "media" }, motivo: "Frete/logística" },

  // Regularization
  { keywords: ["lar ", "asv", "car ", "licença", "licenca", "outorga", "riaa", "publicação", "publicacao", "semas"], match: SAIDA, result: { categoriaCodigo: "inv_regularizacao", centroCustoCodigo: "regularizacao_ambiental", naturezaCodigo: "investimento", confianca: "alta" }, motivo: "Regularização ambiental" },

  // Investments
  { keywords: ["galpao", "galpão"], match: SAIDA, result: { categoriaCodigo: "inv_galpao", centroCustoCodigo: "infraestrutura", naturezaCodigo: "investimento", confianca: "alta" }, motivo: "Galpão" },
  { keywords: ["carretinha"], match: SAIDA, result: { categoriaCodigo: "inv_equipamentos", centroCustoCodigo: "equipamentos", naturezaCodigo: "investimento", confianca: "alta" }, motivo: "Carretinha" },
  { keywords: ["caixa d'agua", "caixa d'água", "caixa dagua", "bomba", "poço", "poco"], match: SAIDA, result: { categoriaCodigo: "inv_caixa_agua", centroCustoCodigo: "infraestrutura", naturezaCodigo: "investimento", confianca: "alta" }, motivo: "Água/irrigação" },
  { keywords: ["energia", "poste", "padrao", "padrão", "fio"], match: SAIDA, result: { categoriaCodigo: "inv_energia", centroCustoCodigo: "infraestrutura", naturezaCodigo: "investimento", confianca: "media" }, motivo: "Energia" },
];

function normalize(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function suggestClassification(
  descricao: string | null | undefined,
  tipo: "entrada" | "saida"
): Suggestion | null {
  const desc = normalize(descricao);
  if (!desc) return null;

  for (const rule of RULES) {
    if (!rule.match(tipo)) continue;
    if (rule.keywords.some((kw) => desc.includes(normalize(kw)))) {
      return { ...rule.result, motivo: rule.motivo };
    }
  }
  return null;
}

export function loanEventLabel(ev: LoanEvent | null | undefined): string {
  switch (ev) {
    case "recebimento": return "Empréstimo recebido";
    case "pagamento_parcela": return "Parcela de empréstimo";
    case "juros": return "Juros de empréstimo";
    case "tarifa": return "Tarifa de empréstimo";
    case "amortizacao": return "Amortização";
    case "ajuste": return "Ajuste de empréstimo";
    default: return "Empréstimo";
  }
}

// Detect loan event purely from existing cash_transaction subcategoria/loan_id
export function detectLoanEventFromTx(tx: {
  loan_id: string | null;
  installment_id: string | null;
  subcategoria: string | null;
  tipo: "entrada" | "saida";
}): LoanEvent | null {
  if (!tx.loan_id && !tx.installment_id) return null;
  const sub = (tx.subcategoria ?? "").toLowerCase();
  if (sub.includes("recebimento")) return "recebimento";
  if (sub.includes("quitacao") || sub.includes("amortiz")) return "amortizacao";
  if (sub.includes("parcela")) return "pagamento_parcela";
  if (sub.includes("juros")) return "juros";
  if (sub.includes("tarifa")) return "tarifa";
  if (sub.includes("despesa_financeira")) return "tarifa";
  if (tx.installment_id) return "pagamento_parcela";
  return tx.tipo === "entrada" ? "recebimento" : "pagamento_parcela";
}

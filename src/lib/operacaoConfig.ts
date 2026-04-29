// Categorias de operação (projeto)
export const OPERATION_CATEGORIES = [
  { value: "producao_agricola", label: "Produção agrícola", emoji: "🌱" },
  { value: "manejo_limpeza", label: "Manejo e limpeza", emoji: "🌿" },
  { value: "infraestrutura", label: "Infraestrutura", emoji: "🏗️" },
  { value: "casa_farinha", label: "Casa de farinha", emoji: "🏠" },
  { value: "financeiro", label: "Financeiro", emoji: "💰" },
  { value: "documentacao", label: "Documentação", emoji: "📄" },
  { value: "licenciamento", label: "Licenciamento", emoji: "🪪" },
  { value: "comercial", label: "Comercial", emoji: "🛒" },
  { value: "logistica", label: "Logística", emoji: "🚚" },
] as const;

export type OperationCategory = typeof OPERATION_CATEGORIES[number]["value"];

export function getCategoryLabel(value?: string | null) {
  if (!value) return null;
  return OPERATION_CATEGORIES.find(c => c.value === value)?.label || value;
}

export function getCategoryEmoji(value?: string | null) {
  if (!value) return "📋";
  return OPERATION_CATEGORIES.find(c => c.value === value)?.emoji || "📋";
}

// Status (UI labels), incluindo derivados/expandidos
export const STAGE_STATUS = [
  { value: "planejada", label: "Planejada" },
  { value: "nao_iniciada", label: "Planejada" }, // legado: tratado igual a planejada
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "atrasada", label: "Atrasada" },
  { value: "travada", label: "Travada" },
  { value: "pausada", label: "Pausada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "reprogramada", label: "Reprogramada" },
] as const;

export const STAGE_STATUS_OPTIONS_FORM = [
  { value: "planejada", label: "Planejada" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "pausada", label: "Pausada" },
  { value: "cancelada", label: "Cancelada" },
  { value: "reprogramada", label: "Reprogramada" },
];

// Cores HSL determinísticas para cada responsável (paleta agro)
const RESPONSAVEL_PALETTE = [
  { hue: 142, sat: 60, light: 38 }, // verde
  { hue: 25, sat: 70, light: 45 },  // laranja-terra
  { hue: 200, sat: 65, light: 42 }, // azul céu
  { hue: 280, sat: 50, light: 48 }, // roxo
  { hue: 350, sat: 60, light: 50 }, // rosa-vermelho
  { hue: 45, sat: 75, light: 45 },  // amarelo-mostarda
  { hue: 170, sat: 55, light: 38 }, // teal
  { hue: 15, sat: 60, light: 40 },  // marrom-laranja
];

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

export function getResponsavelColor(responsavel?: string | null): string {
  if (!responsavel || !responsavel.trim()) return "hsl(var(--muted-foreground))";
  const idx = hashString(responsavel.toLowerCase().trim()) % RESPONSAVEL_PALETTE.length;
  const { hue, sat, light } = RESPONSAVEL_PALETTE[idx];
  return `hsl(${hue} ${sat}% ${light}%)`;
}

export function getResponsavelTextColor(): string {
  return "white";
}

// Status derivado (computed) com base em datas e dependência
export interface DerivedStatusInput {
  status: string;
  data_inicio_real?: string | null;
  data_fim_real?: string | null;
  data_fim_prevista?: string | null;
  depends_on_id?: string | null;
  dependencyConcluded?: boolean;
}

export function deriveStageStatus(input: DerivedStatusInput): string {
  if (input.status === "cancelada" || input.status === "reprogramada") return input.status;
  if (input.data_fim_real || input.status === "concluida") return "concluida";
  if (input.depends_on_id && input.dependencyConcluded === false) return "travada";
  if (input.data_fim_prevista) {
    const fim = new Date(input.data_fim_prevista);
    if (fim < new Date()) return "atrasada";
  }
  if (input.data_inicio_real || input.status === "em_andamento") return "em_andamento";
  if (input.status === "pausada") return "pausada";
  return "planejada";
}

export function computeStageMetrics(stage: {
  data_inicio_prevista?: string | null;
  data_inicio_real?: string | null;
  data_fim_prevista?: string | null;
  data_fim_real?: string | null;
  duracao_prevista_dias?: number | null;
}) {
  const today = new Date();
  const startPrev = stage.data_inicio_prevista ? new Date(stage.data_inicio_prevista) : null;
  const startReal = stage.data_inicio_real ? new Date(stage.data_inicio_real) : null;
  const fimPrev = stage.data_fim_prevista ? new Date(stage.data_fim_prevista) : null;
  const fimReal = stage.data_fim_real ? new Date(stage.data_fim_real) : null;
  const start = startReal || startPrev;

  const duracaoPrevista = stage.duracao_prevista_dias ||
    (startPrev && fimPrev ? Math.max(1, Math.round((fimPrev.getTime() - startPrev.getTime()) / 86400000)) : null);

  let percentConsumido = 0;
  if (start && duracaoPrevista) {
    const diasDecorridos = Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000));
    percentConsumido = Math.min(100, Math.round((diasDecorridos / duracaoPrevista) * 100));
  }

  const diasRestantes = fimPrev ? Math.round((fimPrev.getTime() - today.getTime()) / 86400000) : null;
  const diasAtraso = fimPrev && !fimReal ? Math.max(0, Math.round((today.getTime() - fimPrev.getTime()) / 86400000)) : 0;
  const duracaoReal = startReal && fimReal ? Math.round((fimReal.getTime() - startReal.getTime()) / 86400000) : null;
  const diferencaPlanExec = duracaoReal !== null && duracaoPrevista !== null ? duracaoReal - duracaoPrevista : null;

  return { percentConsumido, diasRestantes, diasAtraso, duracaoReal, duracaoPrevista, diferencaPlanExec };
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// Categorias de operação (projeto) — com identidade visual (cor + ícone)
export const OPERATION_CATEGORIES = [
  { value: "producao_agricola", label: "Produção agrícola", emoji: "🌱", hue: 142 },
  { value: "manejo_limpeza",    label: "Manejo e limpeza",  emoji: "🌿", hue: 95 },
  { value: "infraestrutura",    label: "Infraestrutura",    emoji: "🏗️", hue: 25 },
  { value: "casa_farinha",      label: "Casa de farinha",   emoji: "🏠", hue: 20 },
  { value: "financeiro",        label: "Financeiro",        emoji: "💰", hue: 43 },
  { value: "documentacao",      label: "Documentação",      emoji: "📄", hue: 210 },
  { value: "licenciamento",     label: "Licenciamento",     emoji: "🪪", hue: 200 },
  { value: "comercial",         label: "Comercial",         emoji: "🛒", hue: 280 },
  { value: "logistica",         label: "Logística",         emoji: "🚚", hue: 260 },
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

/** Cor HSL da categoria (paleta de identidade do projeto). Fallback verde-folha. */
export function getCategoryColor(value?: string | null, opts?: { light?: number; sat?: number; alpha?: number }) {
  const cat = OPERATION_CATEGORIES.find(c => c.value === value);
  const hue = cat?.hue ?? 142;
  const sat = opts?.sat ?? 60;
  const light = opts?.light ?? 42;
  const a = opts?.alpha;
  return a !== undefined ? `hsl(${hue} ${sat}% ${light}% / ${a})` : `hsl(${hue} ${sat}% ${light}%)`;
}


// Status (UI labels), incluindo derivados/expandidos
export const STAGE_STATUS = [
  { value: "planejada", label: "Planejada" },
  { value: "nao_iniciada", label: "Planejada" }, // legado: tratado igual a planejada
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "concluida_com_atraso", label: "Concluída com atraso" },
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

// Paleta de cores por projeto (Sítio Ramos — paleta ampliada com mais matizes)
// Hues bem distribuídas (~30° de separação) com saturação alta para diferenciação clara.
const PROJECT_PALETTE: Array<{ h: number; s: number; l: number }> = [
  { h: 145, s: 65, l: 32 }, // verde floresta
  { h: 200, s: 70, l: 42 }, // azul céu
  { h: 43,  s: 85, l: 45 }, // amarelo/dourado sol
  { h: 25,  s: 75, l: 48 }, // laranja
  { h: 15,  s: 50, l: 35 }, // marrom/terra
  { h: 168, s: 60, l: 35 }, // verde-azulado (teal)
  { h: 90,  s: 55, l: 38 }, // oliva
  { h: 8,   s: 70, l: 45 }, // terracota/tijolo
  { h: 285, s: 45, l: 45 }, // ameixa/violeta
  { h: 35,  s: 70, l: 40 }, // ocre
  { h: 220, s: 35, l: 40 }, // cinza-azulado
  { h: 125, s: 50, l: 38 }, // verde grama
];
export function getProjectHsl(projectId: string) {
  let h = 0;
  for (let i = 0; i < projectId.length; i++) h = (h * 31 + projectId.charCodeAt(i)) >>> 0;
  return PROJECT_PALETTE[h % PROJECT_PALETTE.length];
}
/** Texto legível ("light" ou "dark") sobre fundo HSL pela luminosidade L. */
export function getReadableTextOn(l: number): "light" | "dark" {
  return l < 55 ? "light" : "dark";
}
/** Retorna a cor hex/hsl ideal de texto para um fundo HSL. */
export function getContrastTextHsl(l: number): string {
  return l < 55 ? "hsl(0 0% 100%)" : "hsl(220 25% 18%)";
}

export function getProjectColor(projectId: string, opts?: { l?: number; s?: number; a?: number }) {
  const c = getProjectHsl(projectId);
  const s = opts?.s ?? c.s;
  const l = opts?.l ?? c.l;
  return opts?.a !== undefined
    ? `hsl(${c.h} ${s}% ${l}% / ${opts.a})`
    : `hsl(${c.h} ${s}% ${l}%)`;
}

/** Cor do projeto preferindo a hue da categoria quando disponível.
 *  Mantém saturação/lightness da paleta de projeto para consistência. */
export function getProjectVisualHsl(projectId: string, categoria?: string | null) {
  const cat = OPERATION_CATEGORIES.find(c => c.value === categoria);
  if (cat) {
    return { h: cat.hue, s: 65, l: 40 };
  }
  return getProjectHsl(projectId);
}
export function getProjectVisualColor(
  projectId: string,
  categoria: string | null | undefined,
  opts?: { l?: number; s?: number; a?: number },
) {
  const c = getProjectVisualHsl(projectId, categoria);
  const s = opts?.s ?? c.s;
  const l = opts?.l ?? c.l;
  return opts?.a !== undefined
    ? `hsl(${c.h} ${s}% ${l}% / ${opts.a})`
    : `hsl(${c.h} ${s}% ${l}%)`;
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
  // Concluída: distinguir no prazo vs com atraso
  if (input.data_fim_real || input.status === "concluida") {
    if (input.data_fim_real && input.data_fim_prevista) {
      const fimReal = new Date(input.data_fim_real);
      const fimPrev = new Date(input.data_fim_prevista);
      // Compara apenas a data (zera horas)
      const fr = new Date(fimReal.getFullYear(), fimReal.getMonth(), fimReal.getDate());
      const fp = new Date(fimPrev.getFullYear(), fimPrev.getMonth(), fimPrev.getDate());
      if (fr.getTime() > fp.getTime()) return "concluida_com_atraso";
    }
    return "concluida";
  }
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

  // Dias decorridos desde o início (sem cap)
  const diasDecorridos = start
    ? Math.max(0, Math.round(((fimReal ?? today).getTime() - start.getTime()) / 86400000))
    : null;

  let percentConsumido = 0;
  if (start && duracaoPrevista) {
    const decor = Math.max(0, Math.round((today.getTime() - start.getTime()) / 86400000));
    percentConsumido = Math.min(100, Math.round((decor / duracaoPrevista) * 100));
  }

  const diasRestantes = fimPrev ? Math.round((fimPrev.getTime() - today.getTime()) / 86400000) : null;
  const diasAtraso = fimPrev && !fimReal ? Math.max(0, Math.round((today.getTime() - fimPrev.getTime()) / 86400000)) : 0;
  const duracaoReal = startReal && fimReal ? Math.round((fimReal.getTime() - startReal.getTime()) / 86400000) : null;
  const diferencaPlanExec = duracaoReal !== null && duracaoPrevista !== null ? duracaoReal - duracaoPrevista : null;

  // Dias excedidos: quanto a demanda ultrapassou o prazo planejado (até hoje, ou até fim real)
  let diasExcedidos = 0;
  if (fimPrev) {
    const refEnd = fimReal ?? today;
    const diff = Math.round((refEnd.getTime() - fimPrev.getTime()) / 86400000);
    diasExcedidos = Math.max(0, diff);
  }

  // Dias totais de existência da demanda (do início até hoje, ou até conclusão)
  const diasTotais = start
    ? Math.max(0, Math.round(((fimReal ?? today).getTime() - start.getTime()) / 86400000))
    : null;

  // Recalcula excedidos a partir de diasTotais para consistência
  if (duracaoPrevista !== null && diasTotais !== null) {
    diasExcedidos = Math.max(0, diasTotais - duracaoPrevista);
  }

  const concluidaComAtraso = !!(fimReal && fimPrev && fimReal.getTime() > fimPrev.getTime());

  // Percentuais semânticos
  const percentualPlanejadoDecorrido = duracaoPrevista && diasDecorridos !== null
    ? Math.min(1, Math.max(0, diasDecorridos / duracaoPrevista))
    : 0;
  const percentualTotal = duracaoPrevista && diasTotais !== null
    ? diasTotais / duracaoPrevista
    : 0;

  return {
    percentConsumido,
    diasRestantes,
    diasAtraso,
    duracaoReal,
    duracaoPrevista,
    diasPlanejados: duracaoPrevista,
    diferencaPlanExec,
    diasDecorridos,
    diasExcedidos,
    diasTotais,
    concluidaComAtraso,
    percentualPlanejadoDecorrido,
    percentualTotal,
  };
}

export function addDaysISO(dateISO: string, days: number): string {
  const d = new Date(dateISO);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

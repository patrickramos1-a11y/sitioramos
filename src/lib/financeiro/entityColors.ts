// Cores estáveis por entidade (ciclo, área, talhão, projeto, centro de custo).
// Hash determinístico do ID -> índice na paleta correspondente.

export type EntityKind = "cycle" | "area" | "talhao" | "project" | "centro" | "loan" | "categoria";

// Paletas em HSL — cada entidade tem família visual distinta para evitar colisão.
const PALETTES: Record<EntityKind, string[]> = {
  cycle: [
    "hsl(190 80% 45%)", // ciano
    "hsl(265 65% 58%)", // violeta
    "hsl(35 90% 52%)",  // âmbar
    "hsl(335 75% 55%)", // rosa
    "hsl(85 60% 45%)",  // lima
    "hsl(12 80% 55%)",  // coral
    "hsl(225 65% 55%)", // índigo
    "hsl(165 65% 40%)", // teal
    "hsl(50 85% 50%)",  // mostarda
    "hsl(295 55% 55%)", // magenta
    "hsl(210 75% 50%)", // azul
    "hsl(140 55% 42%)", // verde
  ],
  area: [
    "hsl(18 60% 45%)",  // terracota
    "hsl(75 35% 40%)",  // oliva
    "hsl(38 65% 48%)",  // ocre
    "hsl(45 70% 50%)",  // mostarda
    "hsl(25 45% 35%)",  // sépia
    "hsl(95 30% 38%)",  // verde musgo
    "hsl(15 50% 50%)",  // tijolo
    "hsl(55 45% 45%)",  // areia escura
    "hsl(8 55% 42%)",   // ferrugem
    "hsl(85 25% 35%)",  // verde oliva escuro
  ],
  talhao: [
    "hsl(28 70% 55%)",
    "hsl(48 70% 55%)",
    "hsl(68 50% 48%)",
    "hsl(88 45% 45%)",
    "hsl(108 40% 45%)",
    "hsl(20 65% 50%)",
    "hsl(40 60% 50%)",
    "hsl(60 55% 48%)",
  ],
  project: [
    "hsl(25 85% 55%)",  // laranja
    "hsl(310 70% 55%)", // magenta
    "hsl(45 90% 55%)",  // dourado
    "hsl(355 70% 55%)", // vermelho
    "hsl(15 80% 50%)",  // laranja queimado
    "hsl(285 65% 58%)", // púrpura
    "hsl(35 85% 60%)",  // âmbar claro
    "hsl(0 75% 60%)",   // coral
  ],
  centro: [
    "hsl(210 70% 50%)", // azul
    "hsl(255 60% 55%)", // roxo
    "hsl(180 55% 42%)", // turquesa
    "hsl(220 25% 50%)", // slate
    "hsl(195 65% 45%)", // ciano-azul
    "hsl(240 55% 58%)", // azul-violeta
    "hsl(170 50% 40%)", // teal escuro
    "hsl(230 45% 55%)", // azul acinzentado
  ],
  loan: [
    "hsl(355 65% 55%)",
    "hsl(15 70% 50%)",
    "hsl(330 60% 55%)",
    "hsl(280 55% 55%)",
    "hsl(0 70% 60%)",
    "hsl(20 75% 55%)",
  ],
  categoria: [
    "hsl(142 55% 42%)",
    "hsl(28 75% 50%)",
    "hsl(200 65% 50%)",
    "hsl(265 55% 55%)",
    "hsl(45 80% 50%)",
    "hsl(355 60% 55%)",
    "hsl(165 55% 42%)",
    "hsl(295 50% 55%)",
    "hsl(85 50% 45%)",
    "hsl(15 70% 50%)",
    "hsl(225 55% 55%)",
    "hsl(335 60% 55%)",
  ],
};

// Hash simples (djb2) — determinístico e estável.
function hashId(id: string): number {
  let h = 5381;
  for (let i = 0; i < id.length; i++) {
    h = ((h << 5) + h) ^ id.charCodeAt(i);
  }
  return Math.abs(h);
}

export function colorForEntity(kind: EntityKind, id: string | null | undefined): string {
  const palette = PALETTES[kind];
  if (!id) return "hsl(var(--muted-foreground))";
  return palette[hashId(id) % palette.length];
}

export function paletteFor(kind: EntityKind): string[] {
  return PALETTES[kind];
}

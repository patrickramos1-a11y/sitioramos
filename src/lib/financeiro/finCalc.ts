import type { ResolvedTx, GrupoGerencial } from "./managementGroup";

export const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const fmtPct = (n: number, digits = 1) =>
  `${(n * 100).toFixed(digits)}%`;

export function sumValor(list: ResolvedTx[]): number {
  return list.reduce((s, r) => s + Number(r.tx.valor || 0), 0);
}

export function sumByGrupo(list: ResolvedTx[]): Record<GrupoGerencial, number> {
  const out = {} as Record<GrupoGerencial, number>;
  for (const r of list) {
    out[r.grupo] = (out[r.grupo] || 0) + Number(r.tx.valor || 0);
  }
  return out;
}

export function inMonth(dataIso: string, year: number, month0: number): boolean {
  // dataIso: 'YYYY-MM-DD'
  const [y, m] = dataIso.split("-").map(Number);
  return y === year && m - 1 === month0;
}

export function monthKey(dataIso: string): string {
  return dataIso.slice(0, 7); // YYYY-MM
}

export function groupByMonth(list: ResolvedTx[]): Record<string, ResolvedTx[]> {
  const out: Record<string, ResolvedTx[]> = {};
  for (const r of list) {
    const k = monthKey(r.tx.data);
    (out[k] ||= []).push(r);
  }
  return out;
}

export function groupBy<T, K extends string | number>(
  list: T[],
  keyFn: (item: T) => K | null | undefined
): Map<K, T[]> {
  const m = new Map<K, T[]>();
  for (const it of list) {
    const k = keyFn(it);
    if (k == null) continue;
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(it);
  }
  return m;
}

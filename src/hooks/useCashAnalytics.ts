import { useMemo } from "react";
import { format, parseISO, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { CashTransaction } from "./useCashTransactions";
import { cashCategoryConfig, getSubcategoriaInfo, type CashCategory } from "@/lib/categoryConfig";

export interface CashAnalyticsFilters {
  startDate?: string;
  endDate?: string;
  areaId?: string;
  cycleId?: string;
  categoria?: CashCategory;
  subcategoria?: string;
  tipo?: "entrada" | "saida";
  withoutCycle?: boolean;
  withoutArea?: boolean;
}

export interface SubcategoriaBreakdown {
  key: string;
  categoria: CashCategory;
  subcategoria: string | null;
  label: string;
  total: number;
  count: number;
  color: string;
  bgColor: string;
}

export interface MonthlyPoint {
  month: string; // YYYY-MM
  label: string; // "jan/26"
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface AreaBreakdown {
  areaId: string | null;
  areaNome: string;
  entradas: number;
  saidas: number;
  saldo: number;
  count: number;
}

export interface CycleBreakdown {
  cycleId: string | null;
  cultura: string;
  areaNome: string | null;
  entradas: number;
  saidas: number;
  saldo: number;
  count: number;
}

function passes(t: CashTransaction, f: CashAnalyticsFilters): boolean {
  if (f.startDate && t.data < f.startDate) return false;
  if (f.endDate && t.data > f.endDate) return false;
  if (f.areaId && t.area_id !== f.areaId) return false;
  if (f.cycleId && t.cycle_id !== f.cycleId) return false;
  if (f.categoria && t.categoria !== f.categoria) return false;
  if (f.subcategoria && t.subcategoria !== f.subcategoria) return false;
  if (f.tipo && t.tipo !== f.tipo) return false;
  if (f.withoutCycle && t.cycle_id) return false;
  if (f.withoutArea && t.area_id) return false;
  return true;
}

export function useCashAnalytics(transactions: CashTransaction[], filters: CashAnalyticsFilters = {}) {
  return useMemo(() => {
    const filtered = transactions.filter((t) => passes(t, filters));

    const totalEntradas = filtered.filter((t) => t.tipo === "entrada").reduce((s, t) => s + Number(t.valor), 0);
    const totalSaidas = filtered.filter((t) => t.tipo === "saida").reduce((s, t) => s + Number(t.valor), 0);
    const saldo = totalEntradas - totalSaidas;

    // Composition by subcategoria (only saídas to identify cost composition)
    const compositionMap = new Map<string, SubcategoriaBreakdown>();
    filtered
      .filter((t) => t.tipo === "saida")
      .forEach((t) => {
        const key = `${t.categoria}::${t.subcategoria || "_sem_"}`;
        const info = getSubcategoriaInfo(t.categoria, t.subcategoria);
        const label = info?.label || cashCategoryConfig[t.categoria]?.label || "Sem subcategoria";
        const cur = compositionMap.get(key) || {
          key,
          categoria: t.categoria,
          subcategoria: t.subcategoria,
          label,
          total: 0,
          count: 0,
          color: info?.color || "text-muted-foreground",
          bgColor: info?.bgColor || "bg-muted",
        };
        cur.total += Number(t.valor);
        cur.count += 1;
        compositionMap.set(key, cur);
      });
    const compositionSaidas = Array.from(compositionMap.values()).sort((a, b) => b.total - a.total);

    // Composition entradas (subcategoria)
    const entradasMap = new Map<string, SubcategoriaBreakdown>();
    filtered
      .filter((t) => t.tipo === "entrada")
      .forEach((t) => {
        const key = `${t.categoria}::${t.subcategoria || "_sem_"}`;
        const info = getSubcategoriaInfo(t.categoria, t.subcategoria);
        const label = info?.label || cashCategoryConfig[t.categoria]?.label || "Sem subcategoria";
        const cur = entradasMap.get(key) || {
          key,
          categoria: t.categoria,
          subcategoria: t.subcategoria,
          label,
          total: 0,
          count: 0,
          color: info?.color || "text-success",
          bgColor: info?.bgColor || "bg-success/10",
        };
        cur.total += Number(t.valor);
        cur.count += 1;
        entradasMap.set(key, cur);
      });
    const compositionEntradas = Array.from(entradasMap.values()).sort((a, b) => b.total - a.total);

    // Monthly evolution
    const monthlyMap = new Map<string, MonthlyPoint>();
    filtered.forEach((t) => {
      const d = parseISO(t.data);
      const monthKey = format(startOfMonth(d), "yyyy-MM");
      const label = format(d, "MMM/yy", { locale: ptBR });
      const cur = monthlyMap.get(monthKey) || { month: monthKey, label, entradas: 0, saidas: 0, saldo: 0 };
      if (t.tipo === "entrada") cur.entradas += Number(t.valor);
      else cur.saidas += Number(t.valor);
      cur.saldo = cur.entradas - cur.saidas;
      monthlyMap.set(monthKey, cur);
    });
    const monthly = Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    // By Area
    const areaMap = new Map<string, AreaBreakdown>();
    filtered.forEach((t) => {
      const key = t.area_id || "_orfa_";
      const cur = areaMap.get(key) || {
        areaId: t.area_id,
        areaNome: t.areas?.nome || "Sem área",
        entradas: 0,
        saidas: 0,
        saldo: 0,
        count: 0,
      };
      if (t.tipo === "entrada") cur.entradas += Number(t.valor);
      else cur.saidas += Number(t.valor);
      cur.saldo = cur.entradas - cur.saidas;
      cur.count += 1;
      areaMap.set(key, cur);
    });
    const byArea = Array.from(areaMap.values()).sort((a, b) => b.saidas - a.saidas);

    // By Cycle
    const cycleMap = new Map<string, CycleBreakdown>();
    filtered.forEach((t) => {
      const key = t.cycle_id || "_orfo_";
      const cur = cycleMap.get(key) || {
        cycleId: t.cycle_id,
        cultura: t.cycles?.cultura || "Sem ciclo",
        areaNome: t.areas?.nome || null,
        entradas: 0,
        saidas: 0,
        saldo: 0,
        count: 0,
      };
      if (t.tipo === "entrada") cur.entradas += Number(t.valor);
      else cur.saidas += Number(t.valor);
      cur.saldo = cur.entradas - cur.saidas;
      cur.count += 1;
      cycleMap.set(key, cur);
    });
    const byCycle = Array.from(cycleMap.values()).sort((a, b) => b.saidas - a.saidas);

    // Orphan counts
    const semCiclo = filtered.filter((t) => !t.cycle_id).length;
    const semArea = filtered.filter((t) => !t.area_id).length;
    const semSubcategoria = filtered.filter((t) => !t.subcategoria).length;
    const orphanPct = filtered.length > 0 ? (semCiclo / filtered.length) * 100 : 0;

    return {
      filtered,
      totals: { entradas: totalEntradas, saidas: totalSaidas, saldo, count: filtered.length },
      compositionSaidas,
      compositionEntradas,
      monthly,
      byArea,
      byCycle,
      orphans: { semCiclo, semArea, semSubcategoria, orphanPct },
    };
  }, [transactions, filters]);
}

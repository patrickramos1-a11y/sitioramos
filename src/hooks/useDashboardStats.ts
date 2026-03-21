import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { calculateAppFromRiver } from "@/lib/categoryConfig";

interface TerritorialStats {
  areaTotal: number;
  areaProdutiva: number;
  areaApp: number;
  metrosRio: number;
  talhoesAtivos: number;
  totalAreas: number;
  totalTalhoes: number;
}

interface FinancialStats {
  saldoCaixa: number;
  totalEntradas: number;
  totalSaidas: number;
  totalCustos: number;
  custosImplantacao: number;
  totalReceitas: number;
  dividaPendente: number;
  resultadoLiquido: number;
  jurosETarifas: number;
}

interface ProductiveStats {
  areasProducao: number;
  areasPreparo: number;
  ciclosAtivos: number;
  ciclos: {
    id: string;
    cultura: string;
    areaName: string;
    status: string;
    dataInicio: string;
    diasDecorridos: number;
    totalCustos: number;
    totalReceitas: number;
    resultado: number;
  }[];
}

interface AnalyticalStats {
  gastoPorArea: { areaId: string; nome: string; hectares: number; custos: number; custoPorHa: number; receitas: number; resultado: number }[];
  gastoPorTalhao: { talhaoId: string; nome: string; hectares: number; custos: number; custoPorHa: number; receitas: number; resultado: number }[];
  areasByStatus: { status: string; hectares: number }[];
  costsByType: { name: string; value: number }[];
  monthlyData: { month: string; receitas: number; custos: number; investimentos: number }[];
}

export interface DashboardStats {
  territorial: TerritorialStats;
  financial: FinancialStats;
  productive: ProductiveStats;
  analytical: AnalyticalStats;
}

const statusLabels: Record<string, string> = {
  planejamento: "Planejamento",
  preparo: "Em preparo",
  plantada: "Plantada",
  producao: "Em produção",
  colhida: "Colhida",
};

const costTypeLabels: Record<string, string> = {
  preparo_solo: "Preparo de solo",
  mudas: "Mudas/Sementes",
  adubacao: "Adubação",
  herbicida: "Herbicida",
  mao_obra: "Mão de obra",
  combustivel: "Combustível",
  trator: "Trator",
  juros_bancarios: "Juros Bancários",
  tarifas_bancarias: "Tarifas Bancárias",
  consultoria: "Consultoria",
  frete_logistica: "Frete / Logística",
  manutencao_infraestrutura: "Manutenção / Infraestrutura",
  insumos_compras: "Insumos / Compras",
  outros: "Outros",
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      const [areasRes, costsRes, revenuesRes, investmentsRes, loansRes, installmentsRes, cashBalanceRes, propriedadeRes, talhoesRes, cyclesRes] = await Promise.all([
        supabase.from("areas").select("*"),
        supabase.from("costs").select("*"),
        supabase.from("revenues").select("*"),
        supabase.from("investments").select("*"),
        supabase.from("loans").select("*"),
        supabase.from("installments").select("*"),
        supabase.from("cash_balance").select("*").maybeSingle(),
        supabase.from("propriedade").select("*").order("created_at", { ascending: true }).limit(1).maybeSingle(),
        supabase.from("talhoes").select("*"),
        supabase.from("cycles").select("*, areas(nome)"),
      ]);

      const areas = areasRes.data || [];
      const costs = costsRes.data || [];
      const revenues = revenuesRes.data || [];
      const investments = investmentsRes.data || [];
      const loans = loansRes.data || [];
      const installments = installmentsRes.data || [];
      const cashBalance = cashBalanceRes.data;
      const propriedade = propriedadeRes.data;
      const talhoes = talhoesRes.data || [];
      const cycles = cyclesRes.data || [];

      // === TERRITORIAL ===
      const areaTotal = Number(propriedade?.area_total_hectares || 0);
      const metrosRio = Number(propriedade?.metros_rio_total || 0);
      const areaApp = calculateAppFromRiver(metrosRio);
      const areaProdutiva = areas.reduce((sum, a) => sum + Number(a.tamanho_hectares), 0);
      const talhoesAtivos = talhoes.filter((t: any) => t.status === "ativo").length;

      const territorial: TerritorialStats = {
        areaTotal,
        areaProdutiva,
        areaApp,
        metrosRio,
        talhoesAtivos,
        totalAreas: areas.length,
        totalTalhoes: talhoes.length,
      };

      // === FINANCIAL ===
      const saldoCaixa = Number(cashBalance?.saldo_atual || 0);
      const totalEntradas = Number(cashBalance?.total_entradas || 0);
      const totalSaidas = Number(cashBalance?.total_saidas || 0);
      const totalCustos = costs.reduce((sum, c) => sum + Number(c.valor), 0);
      const custosImplantacao = investments.reduce((sum, i) => sum + Number(i.valor), 0);
      const totalReceitas = revenues.reduce((sum, r) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);

      const paidInstallments = installments.filter((i: any) => i.status === "paga");
      const paidAmount = paidInstallments.reduce((sum, i) => sum + Number(i.valor), 0);
      const totalLoansValue = loans.reduce((sum, l) => sum + Number(l.valor_total), 0);
      const dividaPendente = totalLoansValue - paidAmount;

      // Juros + Tarifas = paid installment interest + bank fees from costs
      const jurosFromInstallments = paidInstallments.reduce((sum, i) => sum + Number(i.valor_juros || 0), 0);
      const jurosFromCosts = costs.filter(c => c.tipo === "juros_bancarios" || c.tipo === "tarifas_bancarias").reduce((sum, c) => sum + Number(c.valor), 0);
      const jurosETarifas = jurosFromInstallments + jurosFromCosts;
      
      // Resultado Líquido = Receitas - Custos Operacionais - Juros/Tarifas
      const resultadoLiquido = totalReceitas - totalCustos - jurosETarifas;

      const financial: FinancialStats = {
        saldoCaixa,
        totalEntradas,
        totalSaidas,
        totalCustos,
        custosImplantacao,
        totalReceitas,
        dividaPendente,
        resultadoLiquido,
        jurosETarifas,
      };

      // === PRODUCTIVE ===
      const now = new Date();
      const areasProducao = areas.filter(a => a.status === "producao").length;
      const areasPreparo = areas.filter(a => a.status === "preparo").length;
      const ciclosAtivos = cycles.filter((c: any) => c.status === "ativo").length;

      const ciclosData = cycles.map((cycle: any) => {
        const cycleCosts = costs.filter(c => c.cycle_id === cycle.id);
        const cycleRevenues = revenues.filter(r => r.cycle_id === cycle.id);
        const totalCost = cycleCosts.reduce((sum, c) => sum + Number(c.valor), 0);
        const totalRevenue = cycleRevenues.reduce((sum, r) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
        
        const dataInicio = new Date(cycle.data_inicio_plantio);
        const diasDecorridos = Math.floor((now.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: cycle.id,
          cultura: cycle.cultura,
          areaName: cycle.areas?.nome || "N/A",
          status: cycle.status,
          dataInicio: cycle.data_inicio_plantio,
          diasDecorridos: Math.max(0, diasDecorridos),
          totalCustos: totalCost,
          totalReceitas: totalRevenue,
          resultado: totalRevenue - totalCost,
        };
      });

      const productive: ProductiveStats = {
        areasProducao,
        areasPreparo,
        ciclosAtivos,
        ciclos: ciclosData,
      };

      // === ANALYTICAL ===
      const gastoPorArea = areas.map(area => {
        const areaCosts = costs.filter(c => c.area_id === area.id);
        const areaRevenues = revenues.filter(r => r.area_id === area.id);
        const custos = areaCosts.reduce((sum, c) => sum + Number(c.valor), 0);
        const receitas = areaRevenues.reduce((sum, r) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
        const hectares = Number(area.tamanho_hectares);
        return {
          areaId: area.id,
          nome: area.nome,
          hectares,
          custos,
          custoPorHa: hectares > 0 ? custos / hectares : 0,
          receitas,
          resultado: receitas - custos,
        };
      });

      const gastoPorTalhao = talhoes.map((talhao: any) => {
        const talhaoAreaIds = areas.filter(a => a.talhao_id === talhao.id).map(a => a.id);
        const talhaoCosts = costs.filter(c => talhaoAreaIds.includes(c.area_id) || c.talhao_id === talhao.id);
        const talhaoRevenues = revenues.filter(r => talhaoAreaIds.includes(r.area_id) || r.talhao_id === talhao.id);
        const custos = talhaoCosts.reduce((sum, c) => sum + Number(c.valor), 0);
        const receitas = talhaoRevenues.reduce((sum, r) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
        const hectares = Number(talhao.area_total_hectares);
        return {
          talhaoId: talhao.id,
          nome: talhao.nome,
          hectares,
          custos,
          custoPorHa: hectares > 0 ? custos / hectares : 0,
          receitas,
          resultado: receitas - custos,
        };
      });

      const areasByStatus = Object.entries(
        areas.reduce((acc, area) => {
          acc[area.status] = (acc[area.status] || 0) + Number(area.tamanho_hectares);
          return acc;
        }, {} as Record<string, number>)
      ).map(([status, hectares]) => ({
        status: statusLabels[status] || status,
        hectares,
      }));

      const costsByType = Object.entries(
        costs.reduce((acc, cost) => {
          acc[cost.tipo] = (acc[cost.tipo] || 0) + Number(cost.valor);
          return acc;
        }, {} as Record<string, number>)
      ).map(([tipo, value]) => ({
        name: costTypeLabels[tipo] || tipo,
        value,
      }));

      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toISOString().slice(0, 7);
        const monthLabel = date.toLocaleDateString("pt-BR", { month: "short" });
        
        monthlyData.push({
          month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1).replace(".", ""),
          receitas: revenues.filter(r => r.data.startsWith(monthStr)).reduce((sum, r) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0),
          custos: costs.filter(c => c.data.startsWith(monthStr)).reduce((sum, c) => sum + Number(c.valor), 0),
          investimentos: investments.filter(inv => inv.data.startsWith(monthStr)).reduce((sum, inv) => sum + Number(inv.valor), 0),
        });
      }

      const analytical: AnalyticalStats = {
        gastoPorArea,
        gastoPorTalhao,
        areasByStatus,
        costsByType,
        monthlyData,
      };

      return { territorial, financial, productive, analytical };
    },
    refetchInterval: 30000,
  });
}

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  areasAtivas: number;
  totalHectares: number;
  capitalInvestido: number;
  totalCustos: number;
  totalReceitas: number;
  dividaTotal: number;
  resultadoLiquido: number;
  jurosEmprestimos: number;
  saldoCaixa: number;
  areasByStatus: { status: string; hectares: number }[];
  costsByType: { name: string; value: number }[];
  monthlyData: { month: string; receitas: number; custos: number; investimentos: number }[];
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
  outros: "Outros",
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async (): Promise<DashboardStats> => {
      // Fetch all data in parallel
      const [areasRes, costsRes, revenuesRes, investmentsRes, loansRes, installmentsRes, cashBalanceRes] = await Promise.all([
        supabase.from("areas").select("*"),
        supabase.from("costs").select("*"),
        supabase.from("revenues").select("*"),
        supabase.from("investments").select("*"),
        supabase.from("loans").select("*"),
        supabase.from("installments").select("*"),
        supabase.from("cash_balance").select("*").maybeSingle(),
      ]);

      const areas = areasRes.data || [];
      const costs = costsRes.data || [];
      const revenues = revenuesRes.data || [];
      const investments = investmentsRes.data || [];
      const loans = loansRes.data || [];
      const installments = installmentsRes.data || [];
      const cashBalance = cashBalanceRes.data;

      // Calculate totals
      const totalHectares = areas.reduce((sum, a) => sum + Number(a.tamanho_hectares), 0);
      const areasAtivas = areas.filter(a => a.status !== "planejamento").length;
      
      const totalCustos = costs.reduce((sum, c) => sum + Number(c.valor), 0);
      const totalReceitas = revenues.reduce((sum, r) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
      const capitalInvestido = investments.reduce((sum, i) => sum + Number(i.valor), 0);
      
      // Calculate pending debt
      const paidInstallments = installments.filter(i => i.status === "paga");
      const paidAmount = paidInstallments.reduce((sum, i) => sum + Number(i.valor), 0);
      const totalLoans = loans.reduce((sum, l) => sum + Number(l.valor_total), 0);
      const dividaTotal = totalLoans - paidAmount;
      
      // Calculate loan interest paid (for resultado líquido)
      const jurosEmprestimos = paidInstallments.reduce((sum, i) => sum + Number(i.valor_juros || 0), 0);
      
      // Resultado Líquido = Receitas - Custos - Juros pagos
      const resultadoLiquido = totalReceitas - totalCustos - jurosEmprestimos;
      const saldoCaixa = cashBalance?.saldo_atual || 0;

      // Group areas by status
      const areasByStatus = Object.entries(
        areas.reduce((acc, area) => {
          acc[area.status] = (acc[area.status] || 0) + Number(area.tamanho_hectares);
          return acc;
        }, {} as Record<string, number>)
      ).map(([status, hectares]) => ({
        status: statusLabels[status] || status,
        hectares,
      }));

      // Group costs by type
      const costsByType = Object.entries(
        costs.reduce((acc, cost) => {
          acc[cost.tipo] = (acc[cost.tipo] || 0) + Number(cost.valor);
          return acc;
        }, {} as Record<string, number>)
      ).map(([tipo, value]) => ({
        name: costTypeLabels[tipo] || tipo,
        value,
      }));

      // Monthly data for chart (last 6 months)
      const now = new Date();
      const monthlyData = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthStr = date.toISOString().slice(0, 7); // YYYY-MM format
        const monthLabel = date.toLocaleDateString("pt-BR", { month: "short" });
        
        const monthCosts = costs
          .filter(c => c.data.startsWith(monthStr))
          .reduce((sum, c) => sum + Number(c.valor), 0);
          
        const monthRevenues = revenues
          .filter(r => r.data.startsWith(monthStr))
          .reduce((sum, r) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
          
        const monthInvestments = investments
          .filter(inv => inv.data.startsWith(monthStr))
          .reduce((sum, inv) => sum + Number(inv.valor), 0);

        monthlyData.push({
          month: monthLabel.charAt(0).toUpperCase() + monthLabel.slice(1).replace(".", ""),
          receitas: monthRevenues,
          custos: monthCosts,
          investimentos: monthInvestments,
        });
      }

      return {
        areasAtivas,
        totalHectares,
        capitalInvestido,
        totalCustos,
        totalReceitas,
        dividaTotal,
        resultadoLiquido,
        jurosEmprestimos,
        saldoCaixa,
        areasByStatus,
        costsByType,
        monthlyData,
      };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

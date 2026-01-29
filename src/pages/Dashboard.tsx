import { MapPin, DollarSign, Landmark, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { AreaStatusChart } from "@/components/dashboard/AreaStatusChart";
import { CostDistributionChart } from "@/components/dashboard/CostDistributionChart";
import { FinancialEvolutionChart } from "@/components/dashboard/FinancialEvolutionChart";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function Dashboard() {
  // Mock data - será substituído por dados reais do banco
  const stats = {
    areasAtivas: 14.0,
    capitalInvestido: 45000,
    dividaTotal: 15000,
    balancoGeral: 8500,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Visão Geral
        </h1>
        <p className="text-muted-foreground">
          Resumo da gestão do Sítio Ramos
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Áreas Ativas"
          value={`${stats.areasAtivas} ha`}
          description="Total em produção"
          icon={MapPin}
          variant="success"
        />
        <StatCard
          title="Capital Investido"
          value={formatCurrency(stats.capitalInvestido)}
          description="Soma de todos os investimentos"
          icon={DollarSign}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Dívida Total"
          value={formatCurrency(stats.dividaTotal)}
          description="Empréstimos pendentes"
          icon={Landmark}
          variant="warning"
        />
        <StatCard
          title="Balanço Geral"
          value={formatCurrency(stats.balancoGeral)}
          description="Receitas - Custos"
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
          variant="success"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <AreaStatusChart />
        <CostDistributionChart />
      </div>

      {/* Full width chart */}
      <FinancialEvolutionChart />
    </div>
  );
}

import { MapPin, DollarSign, Landmark, TrendingUp, Wallet } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { AreaStatusChart } from "@/components/dashboard/AreaStatusChart";
import { CostDistributionChart } from "@/components/dashboard/CostDistributionChart";
import { FinancialEvolutionChart } from "@/components/dashboard/FinancialEvolutionChart";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Visão Geral</h1>
          <p className="text-muted-foreground">Resumo da gestão do Sítio Ramos</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[350px] rounded-xl" />
          <Skeleton className="h-[350px] rounded-xl" />
        </div>
        <Skeleton className="h-[350px] rounded-xl" />
      </div>
    );
  }

  const saldoCaixa = stats?.saldoCaixa || 0;

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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          title="Saldo em Caixa"
          value={formatCurrency(saldoCaixa)}
          description="Disponível em conta"
          icon={Wallet}
          variant={saldoCaixa >= 0 ? "success" : "destructive"}
          href="/caixa"
        />
        <StatCard
          title="Áreas Ativas"
          value={`${stats?.totalHectares.toFixed(1) || 0} ha`}
          description={`${stats?.areasAtivas || 0} área${(stats?.areasAtivas || 0) !== 1 ? "s" : ""} em operação`}
          icon={MapPin}
          variant="success"
          href="/areas"
        />
        <StatCard
          title="Capital Investido"
          value={formatCurrency(stats?.capitalInvestido || 0)}
          description="Soma de todos os investimentos"
          icon={DollarSign}
          href="/investimentos"
        />
        <StatCard
          title="Dívida Pendente"
          value={formatCurrency(stats?.dividaTotal || 0)}
          description="Parcelas não pagas"
          icon={Landmark}
          variant={stats?.dividaTotal && stats.dividaTotal > 0 ? "warning" : "default"}
          href="/emprestimos"
        />
        <StatCard
          title="Balanço Geral"
          value={formatCurrency(stats?.balancoGeral || 0)}
          description="Receitas - Custos"
          icon={TrendingUp}
          variant={stats?.balancoGeral && stats.balancoGeral >= 0 ? "success" : "destructive"}
          href="/receitas"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <AreaStatusChart data={stats?.areasByStatus || []} />
        <CostDistributionChart data={stats?.costsByType || []} />
      </div>

      {/* Full width chart */}
      <FinancialEvolutionChart data={stats?.monthlyData || []} />
    </div>
  );
}

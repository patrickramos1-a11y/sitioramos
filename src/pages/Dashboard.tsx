import { MapPin, DollarSign, Landmark, TrendingUp, Wallet, Leaf, ArrowDownCircle, ArrowUpCircle, Info, Home, TreePine, Droplets, Grid3X3 } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { AreaStatusChart } from "@/components/dashboard/AreaStatusChart";
import { CostDistributionChart } from "@/components/dashboard/CostDistributionChart";
import { FinancialEvolutionChart } from "@/components/dashboard/FinancialEvolutionChart";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAreas } from "@/hooks/useAreas";
import { useCosts } from "@/hooks/useCosts";
import { useRevenues } from "@/hooks/useRevenues";
import { useLoans } from "@/hooks/useLoans";
import { useCycles } from "@/hooks/useCycles";
import { usePropriedade } from "@/hooks/usePropriedade";
import { useTalhoes } from "@/hooks/useTalhoes";
import { costTypeConfig } from "@/lib/categoryConfig";
import { calculateAppFromRiver } from "@/lib/categoryConfig";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { areas } = useAreas();
  const { costs } = useCosts();
  const { revenues } = useRevenues();
  const { loans } = useLoans();
  const { cycles } = useCycles();
  const { propriedade } = usePropriedade();
  const { talhoes } = useTalhoes();

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
  const resultadoLiquido = stats?.resultadoLiquido || 0;

  // Calculate costs per area
  const custosPorArea = areas.map((area) => {
    const areaCosts = costs.filter((c: any) => c.area_id === area.id);
    const totalCost = areaCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
    const costPerHectare = area.tamanho_hectares > 0 ? totalCost / Number(area.tamanho_hectares) : 0;
    
    const byType = areaCosts.reduce((acc: Record<string, number>, c: any) => {
      acc[c.tipo] = (acc[c.tipo] || 0) + Number(c.valor);
      return acc;
    }, {});

    return { area, totalCost, costPerHectare, byType };
  });

  // Calculate results per cycle
  const resultadosPorCiclo = cycles.map((cycle: any) => {
    const cycleCosts = costs.filter((c: any) => c.cycle_id === cycle.id);
    const cycleRevenues = revenues.filter((r: any) => r.cycle_id === cycle.id);
    
    const totalCost = cycleCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
    const totalRevenue = cycleRevenues.reduce((sum: number, r: any) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
    const result = totalRevenue - totalCost;

    return { cycle, totalCost, totalRevenue, result, areaName: cycle.areas?.nome || "N/A" };
  });

  // Loan status
  const emprestimosStatus = loans.map((loan: any) => {
    const valorContratado = Number(loan.valor_total);
    const valorRecebidoNoCaixa = Number(loan.valor_recebido) || valorContratado;
    const descontosIniciais = Number(loan.descontos_iniciais) || 0;
    
    const parcelasPagas = loan.installments?.filter((i: any) => i.status === "paga") || [];
    const valorPago = parcelasPagas.reduce((sum: number, i: any) => sum + Number(i.valor), 0);
    
    const pendingAmount = valorContratado - valorPago;
    const paidCount = parcelasPagas.length;
    const totalCount = loan.installments?.length || 0;
    const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
    
    const custoFinanceiro = valorRecebidoNoCaixa > 0 
      ? (valorPago + descontosIniciais) - valorRecebidoNoCaixa 
      : 0;

    return { loan, valorContratado, valorRecebidoNoCaixa, descontosIniciais, valorPago, pendingAmount, progress, paidCount, totalCount, custoFinanceiro };
  });

  // Territorial data
  const areaTotal = Number(propriedade?.area_total_hectares || 0);
  const rioTotal = Number(propriedade?.metros_rio_total || 0);
  const appTotal = calculateAppFromRiver(rioTotal);
  const areaProdutiva = areas.reduce((sum, a) => sum + Number(a.tamanho_hectares), 0);
  const talhoesAtivos = talhoes.filter(t => t.status === "ativo").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Visão Geral</h1>
        <p className="text-muted-foreground">Resumo da gestão do Sítio Ramos</p>
      </div>

      {/* Territorial Summary */}
      {propriedade && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Home className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">{propriedade.nome}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Área Total</p>
                <p className="text-lg font-bold">{areaTotal.toFixed(1)} ha</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Talhões</p>
                <p className="text-lg font-bold">{talhoes.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Áreas</p>
                <p className="text-lg font-bold">{areas.length}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">APP</p>
                <p className="text-lg font-bold">{appTotal.toFixed(1)} ha</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Metros de Rio</p>
                <p className="text-lg font-bold">{rioTotal.toLocaleString("pt-BR")} m</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Talhões Ativos</p>
                <p className="text-lg font-bold">{talhoesAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Saldo em Caixa" value={formatCurrency(saldoCaixa)} description="Disponível em conta" icon={Wallet} variant={saldoCaixa >= 0 ? "success" : "destructive"} href="/caixa" />
        <StatCard title="Áreas Ativas" value={`${stats?.totalHectares.toFixed(1) || 0} ha`} description={`${stats?.areasAtivas || 0} área(s) em operação`} icon={MapPin} variant="success" href="/areas" />
        <StatCard title="Capital Investido" value={formatCurrency(stats?.capitalInvestido || 0)} description="Soma de todos os investimentos" icon={DollarSign} href="/caixa?tab=investimentos" />
        <StatCard title="Dívida Pendente" value={formatCurrency(stats?.dividaTotal || 0)} description="Parcelas não pagas" icon={Landmark} variant={stats?.dividaTotal && stats.dividaTotal > 0 ? "warning" : "default"} href="/emprestimos" />
        <StatCard title="Resultado Líquido" value={formatCurrency(resultadoLiquido)} description="Receitas - Custos - Juros" icon={TrendingUp} variant={resultadoLiquido >= 0 ? "success" : "destructive"} href="/caixa?tab=receitas" />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <AreaStatusChart data={stats?.areasByStatus || []} />
        <CostDistributionChart data={stats?.costsByType || []} />
      </div>

      <FinancialEvolutionChart data={stats?.monthlyData || []} />

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="areas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="areas" className="gap-2">
            <MapPin className="h-4 w-4" />
            Por Área
          </TabsTrigger>
          <TabsTrigger value="ciclos" className="gap-2">
            <Leaf className="h-4 w-4" />
            Por Ciclo
          </TabsTrigger>
          <TabsTrigger value="emprestimos" className="gap-2">
            <Landmark className="h-4 w-4" />
            Empréstimos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="areas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Custo por Área e por Hectare
              </CardTitle>
              <CardDescription>Detalhamento de custos por área com ícones de categoria</CardDescription>
            </CardHeader>
            <CardContent>
              {custosPorArea.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma área cadastrada</p>
              ) : (
                <div className="space-y-6">
                  {custosPorArea.map(({ area, totalCost, costPerHectare, byType }) => (
                    <div key={area.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{area.nome}</h3>
                          <p className="text-sm text-muted-foreground">{Number(area.tamanho_hectares).toFixed(2)} ha</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-destructive">{formatCurrency(totalCost)}</p>
                          <p className="text-sm text-muted-foreground">{formatCurrency(costPerHectare)}/ha</p>
                        </div>
                      </div>
                      
                      {Object.keys(byType).length > 0 && (
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          {Object.entries(byType).map(([tipo, valor]) => {
                            const config = costTypeConfig[tipo];
                            const Icon = config?.icon || DollarSign;
                            return (
                              <div key={tipo} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-lg">
                                <div className="flex items-center gap-2">
                                  <div className={`rounded p-1 ${config?.bgColor || 'bg-muted'}`}>
                                    <Icon className={`h-3.5 w-3.5 ${config?.color || 'text-muted-foreground'}`} />
                                  </div>
                                  <span>{config?.label || tipo}</span>
                                </div>
                                <span className="font-medium">{formatCurrency(valor)}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ciclos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Resultado por Ciclo Produtivo
              </CardTitle>
              <CardDescription>Comparação entre custos e receitas de cada ciclo</CardDescription>
            </CardHeader>
            <CardContent>
              {resultadosPorCiclo.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum ciclo cadastrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ciclo</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Custos</TableHead>
                      <TableHead className="text-right">Receitas</TableHead>
                      <TableHead className="text-right">Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resultadosPorCiclo.map(({ cycle, totalCost, totalRevenue, result, areaName }) => (
                      <TableRow key={cycle.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🌱</span>
                            {cycle.cultura}
                          </div>
                        </TableCell>
                        <TableCell>{areaName}</TableCell>
                        <TableCell>
                          <Badge variant={cycle.status === "finalizado" ? "default" : cycle.status === "ativo" ? "secondary" : "outline"}>
                            {cycle.status === "planejamento" ? "📋 Planejamento" : cycle.status === "ativo" ? "🚜 Ativo" : "✅ Finalizado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right text-destructive font-medium">-{formatCurrency(totalCost)}</TableCell>
                        <TableCell className="text-right text-success font-medium">+{formatCurrency(totalRevenue)}</TableCell>
                        <TableCell className={`text-right font-bold ${result >= 0 ? "text-success" : "text-destructive"}`}>
                          {result >= 0 ? "📈" : "📉"} {formatCurrency(result)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emprestimos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Análise Detalhada de Empréstimos
              </CardTitle>
              <CardDescription>Valor contratado vs. recebido vs. pago e custo financeiro real</CardDescription>
            </CardHeader>
            <CardContent>
              {emprestimosStatus.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum empréstimo cadastrado</p>
              ) : (
                <div className="space-y-6">
                  {emprestimosStatus.map(({ loan, valorContratado, valorRecebidoNoCaixa, descontosIniciais, valorPago, pendingAmount, progress, paidCount, totalCount, custoFinanceiro }) => (
                    <div key={loan.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">🏦 {loan.origem_credor}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {loan.juros_percentual > 0 && (
                              <Badge variant="outline" className="text-xs">{loan.juros_percentual}% juros</Badge>
                            )}
                            <Badge variant={loan.status === "quitado" ? "default" : "secondary"}>
                              {loan.status === "quitado" ? "✅ Quitado" : "🔄 Ativo"}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg">{formatCurrency(valorContratado)}</p>
                          <p className="text-xs text-muted-foreground">Valor contratado</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <div className="p-2 rounded-lg bg-success/10">
                          <p className="text-xs text-muted-foreground">Recebido</p>
                          <p className="font-semibold text-success">{formatCurrency(valorRecebidoNoCaixa)}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-destructive/10">
                          <p className="text-xs text-muted-foreground">Descontos</p>
                          <p className="font-semibold text-destructive">{formatCurrency(descontosIniciais)}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-muted">
                          <p className="text-xs text-muted-foreground">Já Pago</p>
                          <p className="font-semibold">{formatCurrency(valorPago)}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-warning/10">
                          <p className="text-xs text-muted-foreground">Custo Financeiro</p>
                          <p className="font-semibold text-warning">{formatCurrency(custoFinanceiro)}</p>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Progresso</span>
                          <span className="font-medium">{paidCount}/{totalCount} parcelas ({progress.toFixed(0)}%)</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

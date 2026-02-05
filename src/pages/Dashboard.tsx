import { MapPin, DollarSign, Landmark, TrendingUp, Wallet, Leaf, ArrowDownCircle, ArrowUpCircle, Info } from "lucide-react";
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
import { costTypeConfig } from "@/lib/categoryConfig";

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

    return {
      area,
      totalCost,
      costPerHectare,
      byType,
    };
  });

  // Calculate results per cycle
  const resultadosPorCiclo = cycles.map((cycle: any) => {
    const cycleCosts = costs.filter((c: any) => c.cycle_id === cycle.id);
    const cycleRevenues = revenues.filter((r: any) => r.cycle_id === cycle.id);
    
    const totalCost = cycleCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
    const totalRevenue = cycleRevenues.reduce((sum: number, r: any) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
    const result = totalRevenue - totalCost;

    return {
      cycle,
      totalCost,
      totalRevenue,
      result,
      areaName: cycle.areas?.nome || "N/A",
    };
  });

  // Calculate loan status with detailed breakdown
  const emprestimosStatus = loans.map((loan: any) => {
    const valorContratado = Number(loan.valor_total);
    const valorRecebidoNoCaixa = loan.creditado_caixa 
      ? (Number(loan.valor_recebido) || valorContratado)
      : 0;
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

    return {
      loan,
      valorContratado,
      valorRecebidoNoCaixa,
      descontosIniciais,
      valorPago,
      pendingAmount,
      progress,
      paidCount,
      totalCount,
      custoFinanceiro,
    };
  });

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
          href="/caixa?tab=investimentos"
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
          title="Resultado Líquido"
          value={formatCurrency(resultadoLiquido)}
          description="Receitas - Custos - Juros"
          icon={TrendingUp}
          variant={resultadoLiquido >= 0 ? "success" : "destructive"}
          href="/caixa?tab=receitas"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <AreaStatusChart data={stats?.areasByStatus || []} />
        <CostDistributionChart data={stats?.costsByType || []} />
      </div>

      {/* Full width chart */}
      <FinancialEvolutionChart data={stats?.monthlyData || []} />

      {/* Detailed Analysis Tabs (migrated from Relatorios) */}
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

        {/* Costs by Area */}
        <TabsContent value="areas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Custo por Área e por Hectare
              </CardTitle>
              <CardDescription>
                Detalhamento de custos por área com ícones de categoria
              </CardDescription>
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
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(costPerHectare)}/ha
                          </p>
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

        {/* Results by Cycle */}
        <TabsContent value="ciclos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Resultado por Ciclo Produtivo
              </CardTitle>
              <CardDescription>
                Comparação entre custos e receitas de cada ciclo
              </CardDescription>
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
                        <TableCell className="text-right text-destructive font-medium">
                          -{formatCurrency(totalCost)}
                        </TableCell>
                        <TableCell className="text-right text-success font-medium">
                          +{formatCurrency(totalRevenue)}
                        </TableCell>
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

        {/* Loans Status */}
        <TabsContent value="emprestimos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Análise Detalhada de Empréstimos
              </CardTitle>
              <CardDescription>
                Valor contratado vs. recebido vs. pago e custo financeiro real
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emprestimosStatus.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum empréstimo cadastrado</p>
              ) : (
                <div className="space-y-6">
                  {emprestimosStatus.map(({ 
                    loan, 
                    valorContratado, 
                    valorRecebidoNoCaixa, 
                    descontosIniciais,
                    valorPago, 
                    pendingAmount, 
                    progress, 
                    paidCount, 
                    totalCount,
                    custoFinanceiro 
                  }) => (
                    <div key={loan.id} className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                            🏦 {loan.origem_credor}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            {loan.juros_percentual > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {loan.juros_percentual}% juros
                              </Badge>
                            )}
                            {loan.creditado_caixa && (
                              <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
                                💰 Creditado no caixa
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Badge variant={pendingAmount === 0 ? "default" : "secondary"} className="text-sm">
                          {pendingAmount === 0 ? "✅ Quitado" : "📊 Ativo"}
                        </Badge>
                      </div>

                      {/* Financial breakdown */}
                      <div className="grid gap-4 md:grid-cols-4 bg-muted/30 rounded-lg p-4">
                        <TooltipProvider>
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="text-sm text-muted-foreground">Valor Contratado</p>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Valor total do contrato do empréstimo</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <p className="font-bold text-lg">{formatCurrency(valorContratado)}</p>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="text-sm text-muted-foreground">Recebido no Caixa</p>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Valor líquido que entrou na conta</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <p className="font-bold text-lg text-success">
                              {valorRecebidoNoCaixa > 0 ? formatCurrency(valorRecebidoNoCaixa) : "—"}
                            </p>
                          </div>

                          {descontosIniciais > 0 && (
                            <div>
                              <div className="flex items-center gap-1">
                                <p className="text-sm text-muted-foreground">Descontos Iniciais</p>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Info className="h-3 w-3 text-muted-foreground" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Juros/tarifas cobrados na origem</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                              <p className="font-bold text-lg text-orange-600">{formatCurrency(descontosIniciais)}</p>
                            </div>
                          )}
                          
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="text-sm text-muted-foreground">Total Pago</p>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Soma de todas as parcelas pagas</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <p className="font-bold text-lg text-destructive">{formatCurrency(valorPago)}</p>
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="text-sm text-muted-foreground">Pendente</p>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Valor restante a pagar</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                            <p className="font-bold text-lg text-warning">{formatCurrency(pendingAmount)}</p>
                          </div>
                        </TooltipProvider>
                      </div>

                      {/* Cost analysis */}
                      {valorRecebidoNoCaixa > 0 && valorPago > 0 && (
                        <div className={`rounded-lg p-3 ${custoFinanceiro > 0 ? 'bg-destructive/10 border border-destructive/30' : 'bg-success/10 border border-success/30'}`}>
                          <p className="text-sm font-medium">
                            {custoFinanceiro > 0 ? '💸 Custo Financeiro do Empréstimo' : '💰 Economia até agora'}
                          </p>
                          <p className={`text-lg font-bold ${custoFinanceiro > 0 ? 'text-destructive' : 'text-success'}`}>
                            {custoFinanceiro > 0 ? '-' : '+'}{formatCurrency(Math.abs(custoFinanceiro))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Diferença entre o que foi pago ({formatCurrency(valorPago)}) e o que foi recebido ({formatCurrency(valorRecebidoNoCaixa)})
                          </p>
                        </div>
                      )}

                      {/* Progress */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Parcelas: {paidCount} de {totalCount}</span>
                          <span className="font-medium">{progress.toFixed(0)}%</span>
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

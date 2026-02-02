import { AppLayout } from "@/components/layout/AppLayout";
import { BarChart3, MapPin, Leaf, TrendingUp, Landmark, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAreas } from "@/hooks/useAreas";
import { useCosts } from "@/hooks/useCosts";
import { useRevenues } from "@/hooks/useRevenues";
import { useInvestments } from "@/hooks/useInvestments";
import { useLoans } from "@/hooks/useLoans";
import { useCycles } from "@/hooks/useCycles";
import { useCashTransactions } from "@/hooks/useCashTransactions";
import { Skeleton } from "@/components/ui/skeleton";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
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

export default function Relatorios() {
  const { areas, isLoading: areasLoading } = useAreas();
  const { costs, isLoading: costsLoading } = useCosts();
  const { revenues, isLoading: revenuesLoading } = useRevenues();
  const { investments, isLoading: investmentsLoading } = useInvestments();
  const { loans, isLoading: loansLoading } = useLoans();
  const { cycles, isLoading: cyclesLoading } = useCycles();
  const { transactions, balance } = useCashTransactions();

  const isLoading = areasLoading || costsLoading || revenuesLoading || investmentsLoading || loansLoading || cyclesLoading;

  // Calculate costs per area
  const custosPorArea = areas.map((area) => {
    const areaCosts = costs.filter((c: any) => c.area_id === area.id);
    const totalCost = areaCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
    const costPerHectare = area.tamanho_hectares > 0 ? totalCost / Number(area.tamanho_hectares) : 0;
    
    // Group by type
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

  // Calculate loan status
  const emprestimosStatus = loans.map((loan: any) => {
    const paidAmount = loan.installments
      ?.filter((i: any) => i.status === "paga")
      .reduce((sum: number, i: any) => sum + Number(i.valor), 0) || 0;
    const pendingAmount = Number(loan.valor_total) - paidAmount;
    const paidCount = loan.installments?.filter((i: any) => i.status === "paga").length || 0;
    const totalCount = loan.installments?.length || 0;
    const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;

    return {
      loan,
      paidAmount,
      pendingAmount,
      progress,
      paidCount,
      totalCount,
    };
  });

  // Summary totals
  const totalInvestido = investments.reduce((sum: number, i: any) => sum + Number(i.valor), 0);
  const totalCustos = costs.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
  const totalReceitas = revenues.reduce((sum: number, r: any) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
  const dividaTotal = emprestimosStatus.reduce((sum, l) => sum + l.pendingAmount, 0);
  const saldoCaixa = balance?.saldo_atual || 0;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">
            Análise consolidada do Sítio Ramos
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Investido</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatCurrency(totalInvestido)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Custos</CardTitle>
              <TrendingUp className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-destructive">{formatCurrency(totalCustos)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-success">{formatCurrency(totalReceitas)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Dívida Pendente</CardTitle>
              <Landmark className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-warning">{formatCurrency(dividaTotal)}</div>
            </CardContent>
          </Card>

          <Card className={saldoCaixa >= 0 ? "border-success/50" : "border-destructive/50"}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saldo em Caixa</CardTitle>
              <BarChart3 className={`h-4 w-4 ${saldoCaixa >= 0 ? "text-success" : "text-destructive"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${saldoCaixa >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(saldoCaixa)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for detailed reports */}
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
                            <p className="font-bold text-lg">{formatCurrency(totalCost)}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(costPerHectare)}/ha
                            </p>
                          </div>
                        </div>
                        
                        {Object.keys(byType).length > 0 && (
                          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                            {Object.entries(byType).map(([tipo, valor]) => (
                              <div key={tipo} className="flex justify-between text-sm p-2 bg-muted/50 rounded">
                                <span>{costTypeLabels[tipo] || tipo}</span>
                                <span className="font-medium">{formatCurrency(valor)}</span>
                              </div>
                            ))}
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
                          <TableCell className="font-medium">{cycle.cultura}</TableCell>
                          <TableCell>{areaName}</TableCell>
                          <TableCell>
                            <Badge variant={cycle.status === "finalizado" ? "default" : "secondary"}>
                              {cycle.status === "planejamento" ? "Planejamento" : cycle.status === "ativo" ? "Ativo" : "Finalizado"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right text-destructive">
                            {formatCurrency(totalCost)}
                          </TableCell>
                          <TableCell className="text-right text-success">
                            {formatCurrency(totalRevenue)}
                          </TableCell>
                          <TableCell className={`text-right font-bold ${result >= 0 ? "text-success" : "text-destructive"}`}>
                            {formatCurrency(result)}
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
                  Saldo Devedor por Empréstimo
                </CardTitle>
              </CardHeader>
              <CardContent>
                {emprestimosStatus.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum empréstimo cadastrado</p>
                ) : (
                  <div className="space-y-4">
                    {emprestimosStatus.map(({ loan, paidAmount, pendingAmount, progress, paidCount, totalCount }) => (
                      <div key={loan.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">{loan.origem_credor}</h3>
                            <p className="text-sm text-muted-foreground">
                              Valor total: {formatCurrency(Number(loan.valor_total))}
                            </p>
                          </div>
                          <Badge variant={pendingAmount === 0 ? "default" : "secondary"}>
                            {pendingAmount === 0 ? "Quitado" : "Ativo"}
                          </Badge>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <div>
                            <p className="text-sm text-muted-foreground">Pago</p>
                            <p className="font-semibold text-success">{formatCurrency(paidAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Pendente</p>
                            <p className="font-semibold text-warning">{formatCurrency(pendingAmount)}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Parcelas</p>
                            <p className="font-semibold">{paidCount} de {totalCount}</p>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Progresso</span>
                            <span>{progress.toFixed(0)}%</span>
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
    </AppLayout>
  );
}

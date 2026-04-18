import { 
  MapPin, DollarSign, Landmark, TrendingUp, Wallet, Leaf, 
  ArrowDownCircle, ArrowUpCircle, Home, TreePine, Droplets, 
  Grid3X3, Clock, Sprout, Activity, BarChart3, PieChart,
  ArrowUpDown, CreditCard, Receipt, Building2
} from "lucide-react";
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
import { usePropriedade } from "@/hooks/usePropriedade";
import { costTypeConfig } from "@/lib/categoryConfig";
import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();
  const { propriedade } = usePropriedade();

  if (isLoading || !stats) {
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
        <Skeleton className="h-[350px] rounded-xl" />
      </div>
    );
  }

  const { territorial, financial, productive, analytical } = stats;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="hidden md:block">
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Visão Geral</h1>
        <p className="text-muted-foreground">Resumo da gestão do Sítio Ramos</p>
      </div>

      {/* ====== TERRITORIAL SUMMARY ====== */}
      {propriedade && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-3">
              <Home className="h-5 w-5 text-primary" />
              <span className="font-semibold text-lg">{propriedade.nome}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Área Total</p>
                <p className="text-lg font-bold">{territorial.areaTotal.toFixed(1)} ha</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Área Produtiva</p>
                <p className="text-lg font-bold">{territorial.areaProdutiva.toFixed(1)} ha</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">APP</p>
                <p className="text-lg font-bold">{territorial.areaApp.toFixed(1)} ha</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Metros de Rio</p>
                <p className="text-lg font-bold">{territorial.metrosRio.toLocaleString("pt-BR")} m</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Talhões</p>
                <p className="text-lg font-bold">{territorial.totalTalhoes}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Áreas</p>
                <p className="text-lg font-bold">{territorial.totalAreas}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Talhões Ativos</p>
                <p className="text-lg font-bold">{territorial.talhoesAtivos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ====== FINANCIAL KPIs ====== */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-5">
        <StatCard 
          title="Saldo em Caixa" 
          value={formatCurrency(financial.saldoCaixa)} 
          description="Entradas - Saídas" 
          icon={Wallet} 
          variant={financial.saldoCaixa >= 0 ? "success" : "destructive"} 
          href="/caixa" 
        />
        <StatCard 
          title="Total de Custos" 
          value={formatCurrency(financial.totalCustos)} 
          description="Custos operacionais" 
          icon={DollarSign} 
          variant="destructive"
          href="/caixa?tab=custos" 
        />
        <StatCard 
          title="Custos de Implantação" 
          value={formatCurrency(financial.custosImplantacao)} 
          description="Escritura, legalização, infraestrutura" 
          icon={Building2} 
          href="/caixa?tab=investimentos" 
        />
        <StatCard 
          title="Dívida Pendente" 
          value={formatCurrency(financial.dividaPendente)} 
          description="Parcelas não pagas" 
          icon={Landmark} 
          variant={financial.dividaPendente > 0 ? "warning" : "default"} 
          href="/emprestimos" 
        />
        <StatCard 
          title="Resultado Líquido" 
          value={formatCurrency(financial.resultadoLiquido)} 
          description="Receitas - Custos - Juros" 
          icon={TrendingUp} 
          variant={financial.resultadoLiquido >= 0 ? "success" : "destructive"} 
          href="/caixa?tab=receitas" 
        />
      </div>

      {/* ====== FINANCIAL BREAKDOWN ====== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Composição Financeira
          </CardTitle>
          <CardDescription>
            Resultado = Receitas ({formatCurrency(financial.totalReceitas)}) − Custos ({formatCurrency(financial.totalCustos)}) − Juros/Tarifas ({formatCurrency(financial.jurosETarifas)})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <div className="flex items-center gap-2 mb-1">
                <ArrowUpCircle className="h-4 w-4 text-success" />
                <p className="text-xs text-muted-foreground">Total Entradas</p>
              </div>
              <p className="text-lg font-bold text-success">{formatCurrency(financial.totalEntradas)}</p>
            </div>
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-center gap-2 mb-1">
                <ArrowDownCircle className="h-4 w-4 text-destructive" />
                <p className="text-xs text-muted-foreground">Total Saídas</p>
              </div>
              <p className="text-lg font-bold text-destructive">{formatCurrency(financial.totalSaidas)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted border">
              <div className="flex items-center gap-2 mb-1">
                <Receipt className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Receitas</p>
              </div>
              <p className="text-lg font-bold text-success">{formatCurrency(financial.totalReceitas)}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted border">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">Juros + Tarifas</p>
              </div>
              <p className="text-lg font-bold text-destructive">{formatCurrency(financial.jurosETarifas)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ====== PRODUCTIVE STATUS ====== */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Áreas em Produção</CardTitle>
            <Sprout className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{productive.areasProducao}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Áreas em Preparo</CardTitle>
            <Activity className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{productive.areasPreparo}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ciclos Ativos</CardTitle>
            <Leaf className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{productive.ciclosAtivos}</div>
          </CardContent>
        </Card>
      </div>

      {/* ====== ACTIVE CYCLES WITH TIME ====== */}
      {productive.ciclos.filter(c => c.status === "ativo").length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Ciclos Ativos — Tempo de Cultivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {productive.ciclos.filter(c => c.status === "ativo").map(cycle => (
                <div key={cycle.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sprout className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{cycle.cultura}</span>
                    </div>
                    <Badge variant="default">Ativo</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{cycle.areaName}</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    <span>Início: {format(new Date(cycle.dataInicio), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="text-primary">
                      ⏱ {cycle.diasDecorridos} dias ({Math.floor(cycle.diasDecorridos / 30)} meses)
                    </span>
                  </div>
                  <div className="flex justify-between text-xs border-t pt-2">
                    <span className="text-destructive">Custos: {formatCurrency(cycle.totalCustos)}</span>
                    <span className="text-success">Receitas: {formatCurrency(cycle.totalReceitas)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <AreaStatusChart data={analytical.areasByStatus} />
        <CostDistributionChart data={analytical.costsByType} />
      </div>

      <FinancialEvolutionChart data={analytical.monthlyData} />

      {/* ====== DETAILED ANALYSIS ====== */}
      <Tabs defaultValue="areas" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="areas" className="gap-2">
            <MapPin className="h-4 w-4" />
            Por Área
          </TabsTrigger>
          <TabsTrigger value="talhoes" className="gap-2">
            <Grid3X3 className="h-4 w-4" />
            Por Talhão
          </TabsTrigger>
          <TabsTrigger value="ciclos" className="gap-2">
            <Leaf className="h-4 w-4" />
            Por Ciclo
          </TabsTrigger>
          <TabsTrigger value="emprestimos" className="gap-2">
            <Landmark className="h-4 w-4" />
            Dívidas
          </TabsTrigger>
        </TabsList>

        {/* Per Area */}
        <TabsContent value="areas">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Gasto e Receita por Área
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytical.gastoPorArea.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma área cadastrada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Área</TableHead>
                      <TableHead>Hectares</TableHead>
                      <TableHead className="text-right">Custos</TableHead>
                      <TableHead className="text-right">R$/ha</TableHead>
                      <TableHead className="text-right">Receitas</TableHead>
                      <TableHead className="text-right">Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytical.gastoPorArea.map(item => (
                      <TableRow key={item.areaId}>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell>{item.hectares.toFixed(2)} ha</TableCell>
                        <TableCell className="text-right text-destructive">{formatCurrency(item.custos)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(item.custoPorHa)}</TableCell>
                        <TableCell className="text-right text-success">{formatCurrency(item.receitas)}</TableCell>
                        <TableCell className={`text-right font-bold ${item.resultado >= 0 ? "text-success" : "text-destructive"}`}>
                          {formatCurrency(item.resultado)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Per Talhão */}
        <TabsContent value="talhoes">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 className="h-5 w-5" />
                Gasto e Receita por Talhão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analytical.gastoPorTalhao.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum talhão cadastrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Talhão</TableHead>
                      <TableHead>Hectares</TableHead>
                      <TableHead className="text-right">Custos</TableHead>
                      <TableHead className="text-right">R$/ha</TableHead>
                      <TableHead className="text-right">Receitas</TableHead>
                      <TableHead className="text-right">Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analytical.gastoPorTalhao.map(item => (
                      <TableRow key={item.talhaoId}>
                        <TableCell className="font-medium">{item.nome}</TableCell>
                        <TableCell>{item.hectares.toFixed(2)} ha</TableCell>
                        <TableCell className="text-right text-destructive">{formatCurrency(item.custos)}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{formatCurrency(item.custoPorHa)}</TableCell>
                        <TableCell className="text-right text-success">{formatCurrency(item.receitas)}</TableCell>
                        <TableCell className={`text-right font-bold ${item.resultado >= 0 ? "text-success" : "text-destructive"}`}>
                          {formatCurrency(item.resultado)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Per Cycle */}
        <TabsContent value="ciclos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5" />
                Resultado por Ciclo Produtivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              {productive.ciclos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum ciclo cadastrado</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ciclo</TableHead>
                      <TableHead>Área</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tempo</TableHead>
                      <TableHead className="text-right">Custos</TableHead>
                      <TableHead className="text-right">Receitas</TableHead>
                      <TableHead className="text-right">Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productive.ciclos.map(cycle => (
                      <TableRow key={cycle.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Sprout className="h-4 w-4 text-primary" />
                            {cycle.cultura}
                          </div>
                        </TableCell>
                        <TableCell>{cycle.areaName}</TableCell>
                        <TableCell>
                          <Badge variant={cycle.status === "finalizado" ? "default" : cycle.status === "ativo" ? "secondary" : "outline"}>
                            {cycle.status === "ativo" ? "🚜 Ativo" : cycle.status === "finalizado" ? "✅ Finalizado" : "📋 Planejamento"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{cycle.diasDecorridos}d ({Math.floor(cycle.diasDecorridos / 30)}m)</span>
                        </TableCell>
                        <TableCell className="text-right text-destructive">{formatCurrency(cycle.totalCustos)}</TableCell>
                        <TableCell className="text-right text-success">{formatCurrency(cycle.totalReceitas)}</TableCell>
                        <TableCell className={`text-right font-bold ${cycle.resultado >= 0 ? "text-success" : "text-destructive"}`}>
                          {formatCurrency(cycle.resultado)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Loans summary - reuse from existing data */}
        <TabsContent value="emprestimos">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Landmark className="h-5 w-5" />
                Resumo de Dívidas
              </CardTitle>
              <CardDescription>
                Dívida pendente total: {formatCurrency(financial.dividaPendente)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Dívida Total</p>
                  <p className="text-lg font-bold text-warning">{formatCurrency(financial.dividaPendente)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Juros + Tarifas Pagos</p>
                  <p className="text-lg font-bold text-destructive">{formatCurrency(financial.jurosETarifas)}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-xs text-muted-foreground">Custos de Implantação</p>
                  <p className="text-lg font-bold">{formatCurrency(financial.custosImplantacao)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

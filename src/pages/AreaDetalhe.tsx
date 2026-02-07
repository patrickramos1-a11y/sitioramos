import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  MapPin, Plus, Calendar, Sprout, Wallet, ArrowLeft,
  RefreshCw, DollarSign, TrendingUp, FileText, MoreVertical,
  Pencil, Trash2, TreePine, Droplets, Grid3X3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAreas } from "@/hooks/useAreas";
import { useCycles, Cycle, CycleInsert } from "@/hooks/useCycles";
import { useCosts } from "@/hooks/useCosts";
import { useRevenues } from "@/hooks/useRevenues";
import { useInvestments } from "@/hooks/useInvestments";
import { useTalhoes, Talhao, TalhaoInsert } from "@/hooks/useTalhoes";
import { CycleForm } from "@/components/cycles/CycleForm";
import { TalhaoForm } from "@/components/talhoes/TalhaoForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  planejamento: { label: "Planejamento", variant: "secondary" },
  preparo: { label: "Em preparo", variant: "outline" },
  plantada: { label: "Plantada", variant: "default" },
  producao: { label: "Em produção", variant: "default" },
  colhida: { label: "Colhida", variant: "secondary" },
};

const cycleStatusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  planejamento: { label: "📋 Planejamento", variant: "secondary" },
  ativo: { label: "🚜 Ativo", variant: "default" },
  finalizado: { label: "✅ Finalizado", variant: "outline" },
};

const talhaoStatusConfig: Record<string, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "text-success" },
  expansao: { label: "Expansão", color: "text-warning" },
  futuro: { label: "Futuro", color: "text-muted-foreground" },
  app: { label: "APP", color: "text-primary" },
  inativo: { label: "Inativo", color: "text-destructive" },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export default function AreaDetalhe() {
  const { id } = useParams();
  const { areas, isLoading: areasLoading } = useAreas();
  const { cycles, isLoading: cyclesLoading, createCycle, updateCycle, deleteCycle } = useCycles();
  const { costs } = useCosts();
  const { revenues } = useRevenues();
  const { investments } = useInvestments();
  const { talhoes, isLoading: talhoesLoading, createTalhao, updateTalhao, deleteTalhao } = useTalhoes(id);

  const [cycleFormOpen, setCycleFormOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [talhaoFormOpen, setTalhaoFormOpen] = useState(false);
  const [editingTalhao, setEditingTalhao] = useState<Talhao | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "cycle" | "talhao"; item: any } | null>(null);

  const area = areas.find(a => a.id === id);
  const areaCycles = cycles.filter((c: any) => c.area_id === id);
  
  const areaCosts = costs.filter((c: any) => c.area_id === id);
  const areaRevenues = revenues.filter((r: any) => r.area_id === id);
  const areaInvestments = investments.filter((i: any) => i.area_id === id);

  const totalCustos = areaCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
  const totalReceitas = areaRevenues.reduce((sum: number, r: any) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
  const totalInvestimentos = areaInvestments.reduce((sum: number, i: any) => sum + Number(i.valor), 0);
  const resultado = totalReceitas - totalCustos;

  // Talhão aggregates
  const totalAreaTalhoes = talhoes.reduce((sum, t) => sum + Number(t.area_total_hectares), 0);
  const totalProdutiva = talhoes.reduce((sum, t) => sum + Number(t.area_produtiva_hectares), 0);
  const totalAppTalhoes = talhoes.reduce((sum, t) => sum + Number(t.area_app_hectares), 0);
  const totalRioTalhoes = talhoes.reduce((sum, t) => sum + Number(t.metros_rio), 0);

  const areaHectares = Number(area?.tamanho_hectares || 0);
  const areaApp = Number((area as any)?.area_app_hectares || 0);
  const areaRio = Number((area as any)?.metros_rio || 0);

  const handleDeleteConfirm = () => {
    if (deleteTarget?.type === "cycle") {
      deleteCycle.mutate(deleteTarget.item.id);
    } else if (deleteTarget?.type === "talhao") {
      deleteTalhao.mutate(deleteTarget.item.id);
    }
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleCycleSubmit = (data: CycleInsert) => {
    if (editingCycle) {
      updateCycle.mutate({ ...data, id: editingCycle.id });
    } else {
      createCycle.mutate({ ...data, area_id: id! });
    }
    setCycleFormOpen(false);
    setEditingCycle(null);
  };

  const handleTalhaoSubmit = (data: TalhaoInsert) => {
    if (editingTalhao) {
      updateTalhao.mutate({ ...data, id: editingTalhao.id });
    } else {
      createTalhao.mutate({ ...data, area_id: id! });
    }
    setTalhaoFormOpen(false);
    setEditingTalhao(null);
  };

  const isLoading = areasLoading || cyclesLoading || talhoesLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-64" />
        </div>
      </AppLayout>
    );
  }

  if (!area) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Área não encontrada</h2>
          <p className="text-muted-foreground mb-4">A área que você está procurando não existe.</p>
          <Button asChild>
            <Link to="/areas">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Áreas
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const status = statusConfig[area.status] || statusConfig.planejamento;
  const tipoLabel = (area as any).tipo === "ambiental" ? "Ambiental" : (area as any).tipo === "administrativa" ? "Administrativa" : "Produtiva";

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/areas">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{area.nome}</h1>
                <p className="text-muted-foreground">
                  {Number(area.tamanho_hectares).toFixed(2)} ha • 
                  <Badge variant={status.variant} className="ml-1">{status.label}</Badge>
                  <Badge variant="outline" className="ml-1">{tipoLabel}</Badge>
                </p>
              </div>
            </div>
          </div>
          <Button asChild>
            <Link to={`/caixa?area=${area.id}`}>
              <Wallet className="h-4 w-4 mr-2" />
              Ver Fluxo de Caixa
            </Link>
          </Button>
        </div>

        {/* Area Info */}
        {(area.cultura_principal || area.data_inicio || area.observacoes || areaApp > 0 || areaRio > 0) && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-6">
                {area.cultura_principal && (
                  <div className="flex items-center gap-2 text-sm">
                    <Sprout className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Cultura:</span>
                    <span className="font-medium">{area.cultura_principal}</span>
                  </div>
                )}
                {area.data_inicio && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">Início:</span>
                    <span className="font-medium">{format(new Date(area.data_inicio), "dd/MM/yyyy", { locale: ptBR })}</span>
                  </div>
                )}
                {areaApp > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TreePine className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">APP:</span>
                    <span className="font-medium">{areaApp.toFixed(2)} ha</span>
                  </div>
                )}
                {areaRio > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Rio:</span>
                    <span className="font-medium">{areaRio.toLocaleString("pt-BR")} m</span>
                  </div>
                )}
              </div>
              {area.observacoes && (
                <p className="text-sm text-muted-foreground mt-3">{area.observacoes}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Custos</CardTitle>
              <DollarSign className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-destructive">{formatCurrency(totalCustos)}</div>
              <p className="text-xs text-muted-foreground">{areaCosts.length} lançamento(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Investimentos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{formatCurrency(totalInvestimentos)}</div>
              <p className="text-xs text-muted-foreground">{areaInvestments.length} lançamento(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-success">{formatCurrency(totalReceitas)}</div>
              <p className="text-xs text-muted-foreground">{areaRevenues.length} venda(s)</p>
            </CardContent>
          </Card>
          <Card className={resultado >= 0 ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resultado</CardTitle>
              {resultado >= 0 ? <TrendingUp className="h-4 w-4 text-success" /> : <DollarSign className="h-4 w-4 text-destructive" />}
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${resultado >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(resultado)}
              </div>
              <p className="text-xs text-muted-foreground">Receitas - Custos</p>
            </CardContent>
          </Card>
        </div>

        {/* Talhões Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Grid3X3 className="h-5 w-5" />
                  Talhões
                </CardTitle>
                <CardDescription>
                  {talhoes.length} talhão(ões) • {totalProdutiva.toFixed(2)} ha produtivo
                </CardDescription>
              </div>
              <Button onClick={() => { setEditingTalhao(null); setTalhaoFormOpen(true); }} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Novo Talhão
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Talhão balance bar */}
            {talhoes.length > 0 && areaHectares > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Área ocupada por talhões</span>
                  <span className="text-muted-foreground">
                    {totalAreaTalhoes.toFixed(2)} ha de {areaHectares.toFixed(2)} ha ({((totalAreaTalhoes / areaHectares) * 100).toFixed(1)}%)
                  </span>
                </div>
                <Progress value={Math.min((totalAreaTalhoes / areaHectares) * 100, 100)} className="h-2" />
              </div>
            )}

            {talhoes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <Grid3X3 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Nenhum talhão cadastrado</h3>
                <p className="text-muted-foreground mb-4">
                  Divida esta área em talhões para controle operacional.
                </p>
                <Button onClick={() => { setEditingTalhao(null); setTalhaoFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Talhão
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {talhoes.map((talhao) => {
                  const ts = talhaoStatusConfig[talhao.status] || talhaoStatusConfig.ativo;
                  return (
                    <Card key={talhao.id} className="transition-all hover:shadow-md">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{talhao.nome}</CardTitle>
                            <Badge variant="outline" className={`mt-1 ${ts.color}`}>{ts.label}</Badge>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingTalhao(talhao); setTalhaoFormOpen(true); }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => { setDeleteTarget({ type: "talhao", item: talhao }); setDeleteDialogOpen(true); }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-muted-foreground">Total:</span>
                            <span className="ml-1 font-medium">{Number(talhao.area_total_hectares).toFixed(2)} ha</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Produtiva:</span>
                            <span className="ml-1 font-medium text-success">{Number(talhao.area_produtiva_hectares).toFixed(2)} ha</span>
                          </div>
                        </div>
                        {(Number(talhao.area_app_hectares) > 0 || Number(talhao.metros_rio) > 0) && (
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                            {Number(talhao.area_app_hectares) > 0 && (
                              <div className="flex items-center gap-1">
                                <TreePine className="h-3 w-3 text-primary" />
                                <span className="text-muted-foreground">{Number(talhao.area_app_hectares).toFixed(2)} ha APP</span>
                              </div>
                            )}
                            {Number(talhao.metros_rio) > 0 && (
                              <div className="flex items-center gap-1">
                                <Droplets className="h-3 w-3 text-blue-500" />
                                <span className="text-muted-foreground">{Number(talhao.metros_rio).toLocaleString("pt-BR")} m rio</span>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cycles Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Ciclos Produtivos
                </CardTitle>
                <CardDescription>{areaCycles.length} ciclo(s) nesta área</CardDescription>
              </div>
              <Button onClick={() => { setEditingCycle(null); setCycleFormOpen(true); }} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Novo Ciclo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {areaCycles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <RefreshCw className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Nenhum ciclo cadastrado</h3>
                <p className="text-muted-foreground mb-4">Crie o primeiro ciclo produtivo.</p>
                <Button onClick={() => { setEditingCycle(null); setCycleFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Ciclo
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {areaCycles.map((cycle: any) => {
                  const cs = cycleStatusConfig[cycle.status] || cycleStatusConfig.planejamento;
                  const cycleCosts = costs.filter((c: any) => c.cycle_id === cycle.id);
                  const cycleRevenues = revenues.filter((r: any) => r.cycle_id === cycle.id);
                  const cycleTotalCosts = cycleCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
                  const cycleTotalRevenues = cycleRevenues.reduce((sum: number, r: any) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
                  const cycleResult = cycleTotalRevenues - cycleTotalCosts;

                  return (
                    <Card key={cycle.id} className="transition-all hover:shadow-md">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="rounded-lg bg-primary/10 p-2">
                              <Sprout className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-base">{cycle.cultura}</CardTitle>
                              <Badge variant={cs.variant} className="mt-1">{cs.label}</Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => { setEditingCycle(cycle); setCycleFormOpen(true); }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => { setDeleteTarget({ type: "cycle", item: cycle }); setDeleteDialogOpen(true); }}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          Plantio: {format(new Date(cycle.data_inicio_plantio), "dd/MM/yyyy", { locale: ptBR })}
                        </div>
                        {cycle.data_prevista_colheita && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            Previsão: {format(new Date(cycle.data_prevista_colheita), "dd/MM/yyyy", { locale: ptBR })}
                          </div>
                        )}
                        <div className="pt-2 border-t">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-muted-foreground">Custos:</span>
                              <span className="ml-1 font-medium text-destructive">{formatCurrency(cycleTotalCosts)}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Receitas:</span>
                              <span className="ml-1 font-medium text-success">{formatCurrency(cycleTotalRevenues)}</span>
                            </div>
                          </div>
                          <div className="mt-1">
                            <span className="text-muted-foreground text-sm">Resultado:</span>
                            <span className={`ml-1 font-bold ${cycleResult >= 0 ? "text-success" : "text-destructive"}`}>
                              {formatCurrency(cycleResult)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cycle Form */}
      <CycleForm
        open={cycleFormOpen}
        onOpenChange={setCycleFormOpen}
        cycle={editingCycle}
        areas={areas.filter(a => a.id === id)}
        onSubmit={handleCycleSubmit}
        isSubmitting={createCycle.isPending || updateCycle.isPending}
      />

      {/* Talhão Form */}
      <TalhaoForm
        open={talhaoFormOpen}
        onOpenChange={setTalhaoFormOpen}
        talhao={editingTalhao}
        areaId={id!}
        onSubmit={handleTalhaoSubmit}
        isSubmitting={createTalhao.isPending || updateTalhao.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {deleteTarget?.type === "cycle" ? "ciclo" : "talhão"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O {deleteTarget?.type === "cycle" ? "ciclo" : "talhão"} 
              "{deleteTarget?.item?.cultura || deleteTarget?.item?.nome}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

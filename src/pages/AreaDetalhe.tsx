import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  MapPin, 
  Plus, 
  Calendar, 
  Sprout, 
  Wallet, 
  ArrowLeft,
  RefreshCw,
  DollarSign,
  TrendingUp,
  FileText,
  MoreVertical,
  Pencil,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAreas } from "@/hooks/useAreas";
import { useCycles, Cycle, CycleInsert } from "@/hooks/useCycles";
import { useCosts } from "@/hooks/useCosts";
import { useRevenues } from "@/hooks/useRevenues";
import { useInvestments } from "@/hooks/useInvestments";
import { CycleForm } from "@/components/cycles/CycleForm";
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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function AreaDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { areas, isLoading: areasLoading } = useAreas();
  const { cycles, isLoading: cyclesLoading, createCycle, updateCycle, deleteCycle } = useCycles();
  const { costs } = useCosts();
  const { revenues } = useRevenues();
  const { investments } = useInvestments();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cycleToDelete, setCycleToDelete] = useState<Cycle | null>(null);

  const area = areas.find(a => a.id === id);
  const areaCycles = cycles.filter((c: any) => c.area_id === id);
  
  // Financial data for this area
  const areaCosts = costs.filter((c: any) => c.area_id === id);
  const areaRevenues = revenues.filter((r: any) => r.area_id === id);
  const areaInvestments = investments.filter((i: any) => i.area_id === id);

  const totalCustos = areaCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
  const totalReceitas = areaRevenues.reduce((sum: number, r: any) => 
    sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0
  );
  const totalInvestimentos = areaInvestments.reduce((sum: number, i: any) => sum + Number(i.valor), 0);
  const resultado = totalReceitas - totalCustos;

  const handleCreate = () => {
    setEditingCycle(null);
    setFormOpen(true);
  };

  const handleEdit = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setFormOpen(true);
  };

  const handleDeleteClick = (cycle: Cycle) => {
    setCycleToDelete(cycle);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (cycleToDelete) {
      deleteCycle.mutate(cycleToDelete.id);
    }
    setDeleteDialogOpen(false);
    setCycleToDelete(null);
  };

  const handleSubmit = (data: CycleInsert) => {
    if (editingCycle) {
      updateCycle.mutate({ ...data, id: editingCycle.id });
    } else {
      createCycle.mutate({ ...data, area_id: id! });
    }
    setFormOpen(false);
    setEditingCycle(null);
  };

  const isLoading = areasLoading || cyclesLoading;

  if (isLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
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
                  {Number(area.tamanho_hectares).toFixed(2)} ha • <Badge variant={status.variant}>{status.label}</Badge>
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
        {(area.cultura_principal || area.data_inicio || area.observacoes) && (
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
              {resultado >= 0 ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : (
                <DollarSign className="h-4 w-4 text-destructive" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-xl font-bold ${resultado >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(resultado)}
              </div>
              <p className="text-xs text-muted-foreground">Receitas - Custos</p>
            </CardContent>
          </Card>
        </div>

        {/* Cycles Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Ciclos Produtivos
                </CardTitle>
                <CardDescription>
                  {areaCycles.length} ciclo(s) nesta área
                </CardDescription>
              </div>
              <Button onClick={handleCreate} size="sm">
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
                <p className="text-muted-foreground mb-4">
                  Crie o primeiro ciclo produtivo para esta área.
                </p>
                <Button onClick={handleCreate}>
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Ciclo
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {areaCycles.map((cycle: any) => {
                  const cycleStatus = cycleStatusConfig[cycle.status] || cycleStatusConfig.planejamento;
                  
                  // Calculate cycle financials
                  const cycleCosts = costs.filter((c: any) => c.cycle_id === cycle.id);
                  const cycleRevenues = revenues.filter((r: any) => r.cycle_id === cycle.id);
                  const cycleTotalCosts = cycleCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
                  const cycleTotalRevenues = cycleRevenues.reduce((sum: number, r: any) => 
                    sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0
                  );
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
                              <Badge variant={cycleStatus.variant} className="mt-1">{cycleStatus.label}</Badge>
                            </div>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(cycle)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(cycle)}
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
                          <span>
                            Plantio: {format(new Date(cycle.data_inicio_plantio), "dd/MM/yyyy", { locale: ptBR })}
                          </span>
                        </div>

                        {cycle.data_prevista_colheita && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                              Previsão: {format(new Date(cycle.data_prevista_colheita), "dd/MM/yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        )}

                        {/* Cycle financials */}
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

      {/* Form Dialog */}
      <CycleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        cycle={editingCycle}
        areas={areas.filter(a => a.id === id)}
        onSubmit={handleSubmit}
        isSubmitting={createCycle.isPending || updateCycle.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ciclo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O ciclo "{cycleToDelete?.cultura}" será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

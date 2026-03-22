import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { 
  Grid3X3, Plus, ArrowLeft, MapPin, TreePine, Droplets,
  MoreVertical, Pencil, Trash2, DollarSign, TrendingUp, Eye,
  RefreshCw, Sprout, Calendar, Wallet, LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useTalhoes, Talhao } from "@/hooks/useTalhoes";
import { useAreas, Area, AreaInsert } from "@/hooks/useAreas";
import { useCosts } from "@/hooks/useCosts";
import { useRevenues } from "@/hooks/useRevenues";
import { useCycles } from "@/hooks/useCycles";
import { AreaForm } from "@/components/areas/AreaForm";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  planejamento: { label: "Planejamento", variant: "secondary" },
  preparo: { label: "Em preparo", variant: "outline" },
  plantada: { label: "Plantada", variant: "default" },
  producao: { label: "Em produção", variant: "default" },
  colhida: { label: "Colhida", variant: "secondary" },
};

const tipoConfig: Record<string, string> = {
  produtiva: "Produtiva",
  ambiental: "Ambiental",
  administrativa: "Administrativa",
};

const talhaoStatusConfig: Record<string, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "text-success" },
  expansao: { label: "Expansão", color: "text-warning" },
  futuro: { label: "Futuro", color: "text-muted-foreground" },
  inativo: { label: "Inativo", color: "text-destructive" },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export default function TalhaoDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { talhoes, isLoading: talhoesLoading } = useTalhoes();
  const { areas, isLoading: areasLoading, createArea, updateArea, deleteArea } = useAreas(id);
  const { areas: allAreas } = useAreas(); // All areas for linking
  const { costs } = useCosts();
  const { revenues } = useRevenues();
  const { cycles } = useCycles();

  const [areaFormOpen, setAreaFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedAreasToLink, setSelectedAreasToLink] = useState<string[]>([]);
  const [isLinking, setIsLinking] = useState(false);

  // Unassigned areas (no talhao_id or assigned to a different talhão)
  const unassignedAreas = allAreas.filter(a => !a.talhao_id && a.id);

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

  if (!talhao) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <Grid3X3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Talhão não encontrado</h2>
          <p className="text-muted-foreground mb-4">O talhão que você está procurando não existe.</p>
          <Button asChild>
            <Link to="/propriedade">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Propriedade
            </Link>
          </Button>
        </div>
      </AppLayout>
    );
  }

  const ts = talhaoStatusConfig[talhao.status] || talhaoStatusConfig.ativo;
  const talhaoHectares = Number(talhao.area_total_hectares);
  const totalAreaAreas = areas.reduce((sum, a) => sum + Number(a.tamanho_hectares), 0);
  const areaPercentual = talhaoHectares > 0 ? (totalAreaAreas / talhaoHectares) * 100 : 0;

  // Financial aggregates across all areas in this talhão
  const areaIds = areas.map(a => a.id);
  const talhaoCosts = costs.filter((c: any) => areaIds.includes(c.area_id) || c.talhao_id === id);
  const talhaoRevenues = revenues.filter((r: any) => areaIds.includes(r.area_id) || r.talhao_id === id);
  const totalCustos = talhaoCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
  const totalReceitas = talhaoRevenues.reduce((sum: number, r: any) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
  const resultado = totalReceitas - totalCustos;

  const handleAreaSubmit = (data: AreaInsert) => {
    if (editingArea) {
      updateArea.mutate({ ...data, id: editingArea.id });
    } else {
      createArea.mutate(data);
    }
    setAreaFormOpen(false);
    setEditingArea(null);
  };

  const handleDeleteConfirm = () => {
    if (areaToDelete) {
      deleteArea.mutate(areaToDelete.id);
    }
    setDeleteDialogOpen(false);
    setAreaToDelete(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Button variant="ghost" size="sm" asChild>
                <Link to="/propriedade">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Grid3X3 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{talhao.nome}</h1>
                <p className="text-muted-foreground">
                  {talhaoHectares.toFixed(2)} ha • 
                  <Badge variant="outline" className={`ml-1 ${ts.color}`}>{ts.label}</Badge>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Talhão Info */}
        {(Number(talhao.area_app_hectares) > 0 || Number(talhao.metros_rio) > 0 || talhao.observacoes) && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-6">
                {Number(talhao.area_app_hectares) > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <TreePine className="h-4 w-4 text-primary" />
                    <span className="text-muted-foreground">APP:</span>
                    <span className="font-medium">{Number(talhao.area_app_hectares).toFixed(2)} ha</span>
                  </div>
                )}
                {Number(talhao.metros_rio) > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Droplets className="h-4 w-4 text-blue-500" />
                    <span className="text-muted-foreground">Rio:</span>
                    <span className="font-medium">{Number(talhao.metros_rio).toLocaleString("pt-BR")} m</span>
                  </div>
                )}
              </div>
              {talhao.observacoes && (
                <p className="text-sm text-muted-foreground mt-3">{talhao.observacoes}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Financial Summary */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Custos</CardTitle>
              <DollarSign className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-destructive">{formatCurrency(totalCustos)}</div>
              <p className="text-xs text-muted-foreground">{talhaoCosts.length} lançamento(s)</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receitas</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-success">{formatCurrency(totalReceitas)}</div>
              <p className="text-xs text-muted-foreground">{talhaoRevenues.length} venda(s)</p>
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

        {/* Áreas Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Áreas
                </CardTitle>
                <CardDescription>
                  {areas.length} área(s) • {totalAreaAreas.toFixed(2)} ha alocados de {talhaoHectares.toFixed(2)} ha
                </CardDescription>
              </div>
              <Button onClick={() => { setEditingArea(null); setAreaFormOpen(true); }} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Nova Área
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Balance bar */}
            {areas.length > 0 && talhaoHectares > 0 && (
              <div className="mb-4 p-3 rounded-lg bg-muted/50 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Área ocupada</span>
                  <span className="text-muted-foreground">
                    {totalAreaAreas.toFixed(2)} ha de {talhaoHectares.toFixed(2)} ha ({areaPercentual.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={Math.min(areaPercentual, 100)} className="h-2" />
              </div>
            )}

            {areas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-4 mb-4">
                  <MapPin className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium">Nenhuma área cadastrada</h3>
                <p className="text-muted-foreground mb-4">
                  Adicione áreas dentro deste talhão para controle operacional.
                </p>
                <Button onClick={() => { setEditingArea(null); setAreaFormOpen(true); }}>
                  <Plus className="h-4 w-4 mr-1" />
                  Nova Área
                </Button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {areas.map((area) => {
                  const areaStatus = statusConfig[area.status] || statusConfig.planejamento;
                  const tipo = tipoConfig[(area as any).tipo] || "Produtiva";
                  const areaApp = Number((area as any).area_app_hectares || 0);
                  const areaRio = Number((area as any).metros_rio || 0);
                  
                  const areaCosts = costs.filter((c: any) => c.area_id === area.id);
                  const areaRevenues = revenues.filter((r: any) => r.area_id === area.id);
                  const areaCycles = cycles.filter((c: any) => c.area_id === area.id);
                  const totalCost = areaCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
                  const totalRev = areaRevenues.reduce((sum: number, r: any) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
                  const activeCyclesCount = areaCycles.filter((c: any) => c.status === "ativo").length;

                  return (
                    <Card key={area.id} className="transition-all hover:shadow-md cursor-pointer" onClick={() => navigate(`/areas/${area.id}`)}>
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{area.nome}</CardTitle>
                            <p className="text-xs text-muted-foreground">{Number(area.tamanho_hectares).toFixed(2)} ha • {tipo}</p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/areas/${area.id}`); }}>
                                <Eye className="mr-2 h-4 w-4" />
                                Ver Detalhes
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingArea(area); setAreaFormOpen(true); }}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => { e.stopPropagation(); setAreaToDelete(area); setDeleteDialogOpen(true); }}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={areaStatus.variant}>{areaStatus.label}</Badge>
                          {activeCyclesCount > 0 && (
                            <Badge variant="outline" className="gap-1">
                              <RefreshCw className="h-3 w-3" />
                              {activeCyclesCount} ciclo(s)
                            </Badge>
                          )}
                        </div>
                        {area.cultura_principal && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Sprout className="h-3 w-3" />
                            {area.cultura_principal}
                          </div>
                        )}
                        {(areaApp > 0 || areaRio > 0) && (
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            {areaApp > 0 && (
                              <span className="flex items-center gap-1">
                                <TreePine className="h-3 w-3 text-primary" />
                                {areaApp.toFixed(2)} ha APP
                              </span>
                            )}
                            {areaRio > 0 && (
                              <span className="flex items-center gap-1">
                                <Droplets className="h-3 w-3 text-blue-500" />
                                {areaRio.toLocaleString("pt-BR")} m rio
                              </span>
                            )}
                          </div>
                        )}
                        <div className="pt-2 border-t space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Custos:</span>
                            <span className="font-medium text-destructive">{formatCurrency(totalCost)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Receitas:</span>
                            <span className="font-medium text-success">{formatCurrency(totalRev)}</span>
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

      {/* Area Form */}
      <AreaForm
        open={areaFormOpen}
        onOpenChange={setAreaFormOpen}
        area={editingArea}
        talhaoId={id!}
        onSubmit={handleAreaSubmit}
        isSubmitting={createArea.isPending || updateArea.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir área?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A área "{areaToDelete?.nome}" será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
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

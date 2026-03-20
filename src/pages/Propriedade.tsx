import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Home, MapPin, TreePine, Droplets, Ruler, AlertTriangle, Plus, MoreVertical, Pencil, Trash2, Eye, Grid3X3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { usePropriedade } from "@/hooks/usePropriedade";
import { useTalhoes, Talhao, TalhaoInsert } from "@/hooks/useTalhoes";
import { useAreas } from "@/hooks/useAreas";
import { PropriedadeForm } from "@/components/propriedade/PropriedadeForm";
import { TalhaoForm } from "@/components/talhoes/TalhaoForm";
import { calculateAppFromRiver } from "@/lib/categoryConfig";

const formatHa = (value: number) => `${Number(value).toFixed(2)} ha`;
const formatMetros = (value: number) => `${Number(value).toLocaleString("pt-BR")} m`;

const talhaoStatusConfig: Record<string, { label: string; color: string }> = {
  ativo: { label: "Ativo", color: "text-success" },
  expansao: { label: "Expansão", color: "text-warning" },
  futuro: { label: "Futuro", color: "text-muted-foreground" },
  inativo: { label: "Inativo", color: "text-destructive" },
};

export default function Propriedade() {
  const navigate = useNavigate();
  const { propriedade, isLoading, savePropriedade } = usePropriedade();
  const { talhoes, isLoading: talhoesLoading, createTalhao, updateTalhao, deleteTalhao } = useTalhoes(propriedade?.id);
  const { areas } = useAreas();

  const [talhaoFormOpen, setTalhaoFormOpen] = useState(false);
  const [editingTalhao, setEditingTalhao] = useState<Talhao | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [talhaoToDelete, setTalhaoToDelete] = useState<Talhao | null>(null);

  if (isLoading || talhoesLoading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48" />
          <div className="grid gap-4 md:grid-cols-4">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28" />)}
          </div>
        </div>
      </AppLayout>
    );
  }

  const areaTotal = Number(propriedade?.area_total_hectares || 0);
  const rioTotal = Number(propriedade?.metros_rio_total || 0);
  const appTotal = calculateAppFromRiver(rioTotal);

  // Aggregate from talhões
  const totalTalhoes = talhoes.reduce((sum, t) => sum + Number(t.area_total_hectares), 0);
  const totalRioTalhoes = talhoes.reduce((sum, t) => sum + Number(t.metros_rio), 0);
  const totalAppTalhoes = talhoes.reduce((sum, t) => sum + Number(t.area_app_hectares), 0);

  // Count areas per talhão
  const areasPerTalhao = (talhaoId: string) => areas.filter((a: any) => a.talhao_id === talhaoId);

  const areaDisponivel = areaTotal - totalTalhoes;
  const rioDisponivel = rioTotal - totalRioTalhoes;
  const areaPercentual = areaTotal > 0 ? (totalTalhoes / areaTotal) * 100 : 0;
  const rioPercentual = rioTotal > 0 ? (totalRioTalhoes / rioTotal) * 100 : 0;

  const handleTalhaoSubmit = (data: TalhaoInsert) => {
    if (editingTalhao) {
      updateTalhao.mutate({ ...data, id: editingTalhao.id });
    } else {
      createTalhao.mutate({ ...data, propriedade_id: propriedade?.id });
    }
    setTalhaoFormOpen(false);
    setEditingTalhao(null);
  };

  const handleDeleteConfirm = () => {
    if (talhaoToDelete) {
      deleteTalhao.mutate(talhaoToDelete.id);
    }
    setDeleteDialogOpen(false);
    setTalhaoToDelete(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl flex items-center gap-2">
            <Home className="h-7 w-7 text-primary" />
            Propriedade
          </h1>
          <p className="text-muted-foreground">
            Cadastro e controle territorial da fazenda
          </p>
        </div>

        {/* Property Form */}
        <Card>
          <CardHeader>
            <CardTitle>{propriedade ? "Dados da Propriedade" : "Cadastrar Propriedade"}</CardTitle>
            <CardDescription>
              {propriedade 
                ? "Atualize os dados cadastrais da propriedade. A APP é calculada automaticamente pela metragem de rio."
                : "Registre a área total e metros de rio. A APP será calculada automaticamente."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PropriedadeForm
              propriedade={propriedade}
              onSubmit={(data) => savePropriedade.mutate(data)}
              isSubmitting={savePropriedade.isPending}
            />
          </CardContent>
        </Card>

        {propriedade && (
          <>
            {/* KPIs */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Área Total</CardTitle>
                  <MapPin className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatHa(areaTotal)}</div>
                  <p className="text-xs text-muted-foreground">
                    {talhoes.length} talhão(ões) cadastrado(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">APP Total</CardTitle>
                  <TreePine className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatHa(appTotal)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatHa(totalAppTalhoes)} distribuída em talhões
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Metros de Rio</CardTitle>
                  <Droplets className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatMetros(rioTotal)}</div>
                  <p className="text-xs text-muted-foreground">
                    {formatMetros(totalRioTalhoes)} distribuído em talhões
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Área Disponível</CardTitle>
                  <Ruler className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${areaDisponivel >= 0 ? "text-success" : "text-destructive"}`}>
                    {formatHa(Math.abs(areaDisponivel))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {areaDisponivel >= 0 ? "Ainda disponível" : "Excedente"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Territorial Balance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Saldo Territorial
                </CardTitle>
                <CardDescription>
                  Distribuição da área e rios entre os talhões
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Área Total</span>
                    <span className="text-muted-foreground">
                      {formatHa(totalTalhoes)} de {formatHa(areaTotal)} ({areaPercentual.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={Math.min(areaPercentual, 100)} className="h-3" />
                  {areaPercentual > 100 && (
                    <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Excede a área total
                    </Badge>
                  )}
                </div>

                {rioTotal > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Metros de Rio</span>
                      <span className="text-muted-foreground">
                        {formatMetros(totalRioTalhoes)} de {formatMetros(rioTotal)} ({rioPercentual.toFixed(1)}%)
                      </span>
                    </div>
                    <Progress value={Math.min(rioPercentual, 100)} className="h-3" />
                    {rioPercentual > 100 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Excede rio total
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Talhões List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Grid3X3 className="h-5 w-5" />
                      Talhões
                    </CardTitle>
                    <CardDescription>
                      {talhoes.length} talhão(ões) • {formatHa(totalTalhoes)} alocados
                    </CardDescription>
                  </div>
                  <Button onClick={() => { setEditingTalhao(null); setTalhaoFormOpen(true); }} size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Novo Talhão
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {talhoes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <Grid3X3 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Nenhum talhão cadastrado</h3>
                    <p className="text-muted-foreground mb-4">
                      Crie talhões para organizar sua propriedade em unidades operacionais.
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
                      const talhaoAreas = areasPerTalhao(talhao.id);
                      const totalAreaAreas = talhaoAreas.reduce((sum, a) => sum + Number(a.tamanho_hectares), 0);
                      
                      return (
                        <Card key={talhao.id} className="transition-all hover:shadow-md cursor-pointer" onClick={() => navigate(`/talhoes/${talhao.id}`)}>
                          <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <CardTitle className="text-base">{talhao.nome}</CardTitle>
                                <Badge variant="outline" className={`mt-1 ${ts.color}`}>{ts.label}</Badge>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/talhoes/${talhao.id}`); }}>
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Detalhes
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingTalhao(talhao); setTalhaoFormOpen(true); }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={(e) => { e.stopPropagation(); setTalhaoToDelete(talhao); setDeleteDialogOpen(true); }}
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
                                <span className="text-muted-foreground">Áreas:</span>
                                <span className="ml-1 font-medium">{talhaoAreas.length}</span>
                              </div>
                            </div>
                            {talhaoAreas.length > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {totalAreaAreas.toFixed(2)} ha alocados em áreas
                              </div>
                            )}
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
          </>
        )}
      </div>

      {/* Talhão Form */}
      {propriedade && (
        <TalhaoForm
          open={talhaoFormOpen}
          onOpenChange={setTalhaoFormOpen}
          talhao={editingTalhao}
          propriedadeId={propriedade.id}
          onSubmit={handleTalhaoSubmit}
          isSubmitting={createTalhao.isPending || updateTalhao.isPending}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir talhão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O talhão "{talhaoToDelete?.nome}" e todas as áreas vinculadas serão afetados.
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

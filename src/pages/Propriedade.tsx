import { AppLayout } from "@/components/layout/AppLayout";
import { Home, MapPin, TreePine, Droplets, Ruler, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { usePropriedade } from "@/hooks/usePropriedade";
import { useAreas } from "@/hooks/useAreas";
import { useTalhoes } from "@/hooks/useTalhoes";
import { PropriedadeForm } from "@/components/propriedade/PropriedadeForm";

const formatHa = (value: number) => `${Number(value).toFixed(2)} ha`;
const formatMetros = (value: number) => `${Number(value).toLocaleString("pt-BR")} m`;

export default function Propriedade() {
  const { propriedade, isLoading, savePropriedade } = usePropriedade();
  const { areas } = useAreas();
  const { talhoes } = useTalhoes();

  if (isLoading) {
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

  // Calculate territorial balances
  const areaTotal = Number(propriedade?.area_total_hectares || 0);
  const appTotal = Number(propriedade?.area_app_hectares || 0);
  const rioTotal = Number(propriedade?.metros_rio_total || 0);

  const areaAlocada = areas.reduce((sum, a) => sum + Number(a.tamanho_hectares), 0);
  const appAlocada = areas.reduce((sum, a) => sum + Number((a as any).area_app_hectares || 0), 0);
  const rioAlocado = areas.reduce((sum, a) => sum + Number((a as any).metros_rio || 0), 0);

  const areaProdutivaTalhoes = talhoes.reduce((sum, t) => sum + Number(t.area_produtiva_hectares), 0);
  const totalTalhoesAtivos = talhoes.filter(t => t.status === "ativo").length;

  const areaDisponivel = areaTotal - areaAlocada;
  const appDisponivel = appTotal - appAlocada;
  const rioDisponivel = rioTotal - rioAlocado;

  const areaPercentual = areaTotal > 0 ? (areaAlocada / areaTotal) * 100 : 0;
  const appPercentual = appTotal > 0 ? (appAlocada / appTotal) * 100 : 0;
  const rioPercentual = rioTotal > 0 ? (rioAlocado / rioTotal) * 100 : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
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
                ? "Atualize os dados cadastrais e ambientais da propriedade"
                : "Registre a área total, APP e rios da sua propriedade"
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

        {/* Territorial Balance - only show if property exists */}
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
                    {areas.length} área{areas.length !== 1 ? "s" : ""} cadastrada{areas.length !== 1 ? "s" : ""}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Área Produtiva</CardTitle>
                  <TreePine className="h-4 w-4 text-success" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">{formatHa(areaProdutivaTalhoes)}</div>
                  <p className="text-xs text-muted-foreground">
                    {totalTalhoesAtivos} talhão(ões) ativo(s)
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
                    {formatHa(appAlocada)} distribuída
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
                    {formatMetros(rioAlocado)} distribuído
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Territorial Balance Detail */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ruler className="h-5 w-5" />
                  Saldo Territorial
                </CardTitle>
                <CardDescription>
                  Distribuição da área, APP e rios entre as áreas cadastradas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Area balance */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Área Total</span>
                    <span className="text-muted-foreground">
                      {formatHa(areaAlocada)} de {formatHa(areaTotal)} ({areaPercentual.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={Math.min(areaPercentual, 100)} className="h-3" />
                  <div className="flex items-center justify-between text-xs">
                    <span className={areaDisponivel >= 0 ? "text-success" : "text-destructive"}>
                      {areaDisponivel >= 0 ? "Disponível" : "Excedente"}: {formatHa(Math.abs(areaDisponivel))}
                    </span>
                    {areaPercentual > 100 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Excede a área total
                      </Badge>
                    )}
                  </div>
                </div>

                {/* APP balance */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">APP</span>
                    <span className="text-muted-foreground">
                      {formatHa(appAlocada)} de {formatHa(appTotal)} ({appPercentual.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={Math.min(appPercentual, 100)} className="h-3" />
                  <div className="flex items-center justify-between text-xs">
                    <span className={appDisponivel >= 0 ? "text-success" : "text-destructive"}>
                      {appDisponivel >= 0 ? "Disponível" : "Excedente"}: {formatHa(Math.abs(appDisponivel))}
                    </span>
                    {appPercentual > 100 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Excede APP total
                      </Badge>
                    )}
                  </div>
                </div>

                {/* River balance */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Metros de Rio</span>
                    <span className="text-muted-foreground">
                      {formatMetros(rioAlocado)} de {formatMetros(rioTotal)} ({rioPercentual.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={Math.min(rioPercentual, 100)} className="h-3" />
                  <div className="flex items-center justify-between text-xs">
                    <span className={rioDisponivel >= 0 ? "text-success" : "text-destructive"}>
                      {rioDisponivel >= 0 ? "Disponível" : "Excedente"}: {formatMetros(Math.abs(rioDisponivel))}
                    </span>
                    {rioPercentual > 100 && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Excede rio total
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Areas Summary */}
            {areas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Distribuição por Área
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {areas.map((area) => {
                      const areaApp = Number((area as any).area_app_hectares || 0);
                      const areaRio = Number((area as any).metros_rio || 0);
                      const areaTalhoes = talhoes.filter(t => t.area_id === area.id);
                      
                      return (
                        <div key={area.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium">{area.nome}</p>
                            <p className="text-xs text-muted-foreground">
                              {Number(area.tamanho_hectares).toFixed(2)} ha • {areaTalhoes.length} talhão(ões)
                            </p>
                          </div>
                          <div className="text-right text-sm">
                            <div className="flex items-center gap-3">
                              <span className="text-muted-foreground">
                                <TreePine className="h-3 w-3 inline mr-1" />
                                {areaApp.toFixed(2)} ha APP
                              </span>
                              <span className="text-muted-foreground">
                                <Droplets className="h-3 w-3 inline mr-1" />
                                {areaRio.toLocaleString("pt-BR")} m rio
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}

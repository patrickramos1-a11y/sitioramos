import { AppLayout } from "@/components/layout/AppLayout";
import { MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAreas, Area } from "@/hooks/useAreas";
import { useCosts } from "@/hooks/useCosts";
import { useRevenues } from "@/hooks/useRevenues";
import { useCycles } from "@/hooks/useCycles";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, Sprout, TreePine, Droplets, RefreshCw } from "lucide-react";

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

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

export default function Areas() {
  const { areas, isLoading } = useAreas();
  const { costs } = useCosts();
  const { revenues } = useRevenues();
  const { cycles } = useCycles();
  const navigate = useNavigate();

  const totalHectares = areas.reduce((sum, area) => sum + Number(area.tamanho_hectares), 0);

  return (
    <AppLayout>
      <div className="space-y-4 md:space-y-6">
        <div>
          <h1 className="hidden md:block text-2xl font-bold text-foreground">Áreas</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {areas.length} área{areas.length !== 1 ? "s" : ""} cadastrada{areas.length !== 1 ? "s" : ""} • {totalHectares.toFixed(2)} ha total
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Para criar ou editar áreas, acesse a página do talhão correspondente em Propriedade.
          </p>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : areas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Nenhuma área encontrada</h3>
            <p className="text-muted-foreground">
              Crie talhões na página de Propriedade e adicione áreas dentro deles.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area) => {
              const status = statusConfig[area.status] || statusConfig.planejamento;
              const tipo = tipoConfig[(area as any).tipo] || "Produtiva";
              const areaApp = Number((area as any).area_app_hectares || 0);
              const areaRio = Number((area as any).metros_rio || 0);

              const areaCosts = costs.filter((c: any) => c.area_id === area.id);
              const areaRevenues = revenues.filter((r: any) => r.area_id === area.id);
              const areaCycles = cycles.filter((c: any) => c.area_id === area.id);
              const totalCustos = areaCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
              const totalReceitas = areaRevenues.reduce((sum: number, r: any) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);
              const activeCyclesCount = areaCycles.filter((c: any) => c.status === "ativo").length;

              return (
                <Card key={area.id} className="transition-all hover:shadow-md cursor-pointer" onClick={() => navigate(`/areas/${area.id}`)}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="rounded-lg bg-primary/10 p-2">
                        <MapPin className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{area.nome}</CardTitle>
                        <p className="text-sm text-muted-foreground">{Number(area.tamanho_hectares).toFixed(2)} ha • {tipo}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      {activeCyclesCount > 0 && (
                        <Badge variant="outline" className="gap-1"><RefreshCw className="h-3 w-3" />{activeCyclesCount} ciclo(s)</Badge>
                      )}
                    </div>
                    {area.cultura_principal && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground"><Sprout className="h-4 w-4" /><span>{area.cultura_principal}</span></div>
                    )}
                    {(areaApp > 0 || areaRio > 0) && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {areaApp > 0 && <span className="flex items-center gap-1"><TreePine className="h-3 w-3 text-primary" />{areaApp.toFixed(2)} ha APP</span>}
                        {areaRio > 0 && <span className="flex items-center gap-1"><Droplets className="h-3 w-3 text-blue-500" />{areaRio.toLocaleString("pt-BR")} m rio</span>}
                      </div>
                    )}
                    <div className="pt-2 border-t space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground"><DollarSign className="h-3 w-3" /> Custos:</span>
                        <span className="font-medium text-destructive">{formatCurrency(totalCustos)}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground"><TrendingUp className="h-3 w-3" /> Receitas:</span>
                        <span className="font-medium text-success">{formatCurrency(totalReceitas)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

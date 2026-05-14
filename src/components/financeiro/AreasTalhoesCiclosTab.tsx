import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAreas } from "@/hooks/useAreas";
import { useTalhoes } from "@/hooks/useTalhoes";
import { useCycles } from "@/hooks/useCycles";
import { usePropriedade } from "@/hooks/usePropriedade";
import { Sprout, MapPin, Layers } from "lucide-react";

export function AreasTalhoesCiclosTab() {
  const { propriedade } = usePropriedade();
  const { areas = [] } = useAreas();
  const { talhoes = [] } = useTalhoes();
  const { cycles = [] } = useCycles();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MapPin className="h-4 w-4" /> Propriedade
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm">
          {propriedade ? (
            <div>
              <p className="font-medium">{propriedade.nome}</p>
              <p className="text-xs text-muted-foreground">
                {propriedade.area_total_hectares} ha — APP{" "}
                {propriedade.area_app_hectares} ha
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              Nenhuma propriedade cadastrada.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Layers className="h-4 w-4" /> Áreas e talhões existentes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-3">
          <p>
            Reaproveitando a estrutura territorial já cadastrada — vínculos
            financeiros usam estas referências, sem duplicar cadastros.
          </p>
          <div className="space-y-2">
            {areas.map((a) => {
              const ts = talhoes.filter((t) => t.area_id === a.id);
              return (
                <div key={a.id} className="rounded border p-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-foreground">{a.nome}</span>
                    <span>{Number(a.tamanho_hectares).toFixed(2)} ha</span>
                  </div>
                  <p className="text-[10px]">
                    {a.cultura_principal || "—"} · {a.status}
                  </p>
                  {ts.length > 0 && (
                    <div className="mt-1 pl-3 border-l text-[11px] space-y-0.5">
                      {ts.map((t) => (
                        <div key={t.id} className="flex justify-between">
                          <span>{t.nome}</span>
                          <span>{Number(t.area_total_hectares).toFixed(2)} ha</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
            {areas.length === 0 && <p>Nenhuma área cadastrada.</p>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Sprout className="h-4 w-4" /> Ciclos produtivos
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          {cycles.map((c) => {
            const area = areas.find((a) => a.id === c.area_id);
            return (
              <div
                key={c.id}
                className="flex items-center justify-between rounded border p-2"
              >
                <div>
                  <p className="font-medium">{c.cultura}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {area?.nome || "—"} · início{" "}
                    {new Date(c.data_inicio_plantio).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {c.status}
                </Badge>
              </div>
            );
          })}
          {cycles.length === 0 && (
            <p className="text-xs text-muted-foreground">
              Nenhum ciclo cadastrado. Use a página <strong>Áreas</strong> para
              criar ciclos produtivos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

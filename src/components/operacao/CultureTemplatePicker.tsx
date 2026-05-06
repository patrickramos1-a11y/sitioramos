import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, Clock, DollarSign, Loader2 } from "lucide-react";
import { useCultureTemplates, CultureTemplate } from "@/hooks/useCultureTemplates";

interface CultureTemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cycleId: string;
  areaId: string;
  talhaoId?: string | null;
  dataInicio: string;
  culturaSugerida?: string | null;
  onApplied?: () => void;
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

export function CultureTemplatePicker({
  open,
  onOpenChange,
  cycleId,
  areaId,
  talhaoId,
  dataInicio,
  culturaSugerida,
  onApplied,
}: CultureTemplatePickerProps) {
  const { templates, isLoading, applyTemplate } = useCultureTemplates();

  const sortedTemplates = [...templates].sort((a, b) => {
    if (culturaSugerida) {
      const aMatch = a.cultura.toLowerCase() === culturaSugerida.toLowerCase();
      const bMatch = b.cultura.toLowerCase() === culturaSugerida.toLowerCase();
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
    }
    return a.cultura.localeCompare(b.cultura);
  });

  const handleApply = (template: CultureTemplate) => {
    applyTemplate.mutate(
      { template, cycleId, areaId, talhaoId, dataInicio },
      {
        onSuccess: () => {
          onOpenChange(false);
          onApplied?.();
        },
      }
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Sprout className="h-5 w-5 text-primary" />
            Aplicar padrão de cultura
          </SheetTitle>
          <SheetDescription>
            Cria automaticamente as etapas e custos esperados para o ciclo.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 mt-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sortedTemplates.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhum padrão cadastrado.
            </p>
          ) : (
            sortedTemplates.map((tpl) => {
              const totalDias = tpl.etapas.reduce((s, e) => s + (e.duracao_dias || 0), 0);
              const totalCusto = tpl.etapas.reduce((s, e) => s + (e.custo_medio || 0), 0);
              const isSugerido =
                culturaSugerida && tpl.cultura.toLowerCase() === culturaSugerida.toLowerCase();
              return (
                <Card key={tpl.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">{tpl.cultura}</h3>
                        {isSugerido && <Badge variant="default" className="text-xs">Sugerido</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {tpl.etapas.length} etapa(s) padrão
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Custo/ha</p>
                      <p className="font-semibold text-sm">
                        {formatCurrency(Number(tpl.custo_estimado_por_ha))}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline" className="gap-1">
                      <Clock className="h-3 w-3" /> {totalDias} dias totais
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <DollarSign className="h-3 w-3" /> {formatCurrency(totalCusto)} estimado
                    </Badge>
                  </div>

                  <div className="space-y-1 text-xs text-muted-foreground border-t pt-2">
                    {tpl.etapas
                      .sort((a, b) => a.ordem - b.ordem)
                      .map((e, i) => (
                        <div key={i} className="flex justify-between">
                          <span>{i + 1}. {e.nome}</span>
                          <span>{e.duracao_dias}d · {formatCurrency(e.custo_medio)}</span>
                        </div>
                      ))}
                  </div>

                  <Button
                    className="w-full"
                    onClick={() => handleApply(tpl)}
                    disabled={applyTemplate.isPending}
                  >
                    {applyTemplate.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Aplicar este padrão
                  </Button>
                </Card>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

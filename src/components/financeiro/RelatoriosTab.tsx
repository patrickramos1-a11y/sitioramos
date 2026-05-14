import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function RelatoriosTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Construction className="h-4 w-4" /> Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>
          Relatórios DRE, fluxo previsto vs realizado, totais por área/ciclo e
          exportações chegam após a etapa de reclassificação dos lançamentos.
        </p>
      </CardContent>
    </Card>
  );
}

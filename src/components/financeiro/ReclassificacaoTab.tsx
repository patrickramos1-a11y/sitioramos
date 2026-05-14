import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export function ReclassificacaoTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Construction className="h-4 w-4" /> Reclassificação
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground space-y-2">
        <p>
          Esta tela permitirá vincular cada lançamento existente a uma natureza,
          categoria, centro de custo, área/talhão, ciclo e projeto de
          investimento — sem alterar nenhum dado original.
        </p>
        <p>
          A estrutura de banco já está pronta. A interface de reclassificação em
          massa será habilitada na próxima etapa.
        </p>
      </CardContent>
    </Card>
  );
}

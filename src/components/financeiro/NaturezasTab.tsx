import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  useFinNaturezas,
  useToggleNaturezaAtivo,
} from "@/hooks/financeiro/useFinNaturezas";

const tipoLabel: Record<string, string> = {
  entrada: "Entrada",
  saida: "Saída",
  ajuste: "Ajuste",
};

export function NaturezasTab() {
  const { data: items = [] } = useFinNaturezas();
  const toggle = useToggleNaturezaAtivo();

  return (
    <Card className="divide-y">
      <div className="p-3 text-xs text-muted-foreground">
        Naturezas financeiras estruturais — não podem ser excluídas, apenas
        ativadas/desativadas.
      </div>
      {items.map((n) => (
        <div key={n.id} className="flex items-center gap-3 px-3 py-3 text-sm">
          <div className="flex-1">
            <p className="font-medium">{n.nome}</p>
            {n.descricao && (
              <p className="text-xs text-muted-foreground">{n.descricao}</p>
            )}
          </div>
          <Badge variant="outline" className="text-[10px]">
            {tipoLabel[n.tipo]}
          </Badge>
          <Switch
            checked={n.ativo}
            onCheckedChange={(v) => toggle.mutate({ id: n.id, ativo: v })}
          />
        </div>
      ))}
    </Card>
  );
}

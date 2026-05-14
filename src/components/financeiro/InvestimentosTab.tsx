import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useFinProjetos,
  useUpsertProjeto,
  useDeleteProjeto,
  type FinProjeto,
} from "@/hooks/financeiro/useFinProjetos";
import { Pencil, Plus, Trash2 } from "lucide-react";

const TIPOS = [
  "infraestrutura",
  "equipamento",
  "ferramentas",
  "regularizacao",
  "energia",
  "agua",
  "transporte",
  "benfeitoria",
  "outros",
];
const STATUS = ["planejado", "em_andamento", "concluido", "pausado", "cancelado"];

export function InvestimentosTab() {
  const { data: items = [] } = useFinProjetos();
  const upsert = useUpsertProjeto();
  const del = useDeleteProjeto();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Partial<FinProjeto>>({});

  function openNew() {
    setEdit({ nome: "", tipo: "outros", status: "planejado", ativo: true });
    setOpen(true);
  }
  async function save() {
    if (!edit.nome) return;
    await upsert.mutateAsync(edit as any);
    setOpen(false);
  }

  const fmt = (n?: number | null) =>
    n != null
      ? n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      : "—";

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo projeto
        </Button>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((p) => (
          <Card key={p.id} className="p-3 space-y-1">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="font-medium text-sm truncate">{p.nome}</p>
                <p className="text-[10px] text-muted-foreground">{p.tipo}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {p.status}
              </Badge>
            </div>
            {p.descricao && (
              <p className="text-xs text-muted-foreground line-clamp-2">{p.descricao}</p>
            )}
            <p className="text-xs">Previsto: {fmt(p.valor_previsto)}</p>
            <div className="flex justify-end gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEdit(p);
                  setOpen(true);
                }}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  if (confirm(`Remover ${p.nome}?`)) del.mutate(p.id);
                }}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit.id ? "Editar" : "Novo"} projeto</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nome</Label>
              <Input
                value={edit.nome ?? ""}
                onChange={(e) => setEdit({ ...edit, nome: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Tipo</Label>
                <Select
                  value={edit.tipo ?? "outros"}
                  onValueChange={(v) => setEdit({ ...edit, tipo: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={edit.status ?? "planejado"}
                  onValueChange={(v) => setEdit({ ...edit, status: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Início</Label>
                <Input
                  type="date"
                  value={edit.data_inicio ?? ""}
                  onChange={(e) =>
                    setEdit({ ...edit, data_inicio: e.target.value || null })
                  }
                />
              </div>
              <div>
                <Label>Conclusão</Label>
                <Input
                  type="date"
                  value={edit.data_conclusao ?? ""}
                  onChange={(e) =>
                    setEdit({ ...edit, data_conclusao: e.target.value || null })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Valor previsto</Label>
              <Input
                type="number"
                step="0.01"
                value={edit.valor_previsto ?? ""}
                onChange={(e) =>
                  setEdit({
                    ...edit,
                    valor_previsto: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={edit.descricao ?? ""}
                onChange={(e) => setEdit({ ...edit, descricao: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

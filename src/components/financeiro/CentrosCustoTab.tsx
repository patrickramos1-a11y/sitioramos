import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  useFinCentrosCusto,
  useUpsertCentroCusto,
  useDeleteCentroCusto,
  type FinCentroCusto,
} from "@/hooks/financeiro/useFinCentrosCusto";
import { Pencil, Plus, Trash2 } from "lucide-react";

export function CentrosCustoTab() {
  const { data: items = [] } = useFinCentrosCusto();
  const upsert = useUpsertCentroCusto();
  const del = useDeleteCentroCusto();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Partial<FinCentroCusto>>({});

  function openNew() {
    setEdit({ codigo: "", nome: "", ativo: true, ordem: 99 });
    setOpen(true);
  }
  async function save() {
    if (!edit.nome || !edit.codigo) return;
    await upsert.mutateAsync(edit as any);
    setOpen(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Novo centro
        </Button>
      </div>
      <Card className="divide-y">
        {items.map((c) => (
          <div key={c.id} className="flex items-center gap-2 px-3 py-2 text-sm">
            <div className="flex-1">
              <p className="font-medium">{c.nome}</p>
              {c.descricao && (
                <p className="text-xs text-muted-foreground">{c.descricao}</p>
              )}
            </div>
            <span className="text-[10px] text-muted-foreground">{c.codigo}</span>
            {!c.ativo && <span className="text-[10px] text-amber-600">inativo</span>}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                setEdit(c);
                setOpen(true);
              }}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                if (confirm(`Remover ${c.nome}?`)) del.mutate(c.id);
              }}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit.id ? "Editar" : "Novo"} centro de custo</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Código</Label>
              <Input
                value={edit.codigo ?? ""}
                onChange={(e) => setEdit({ ...edit, codigo: e.target.value })}
              />
            </div>
            <div>
              <Label>Nome</Label>
              <Input
                value={edit.nome ?? ""}
                onChange={(e) => setEdit({ ...edit, nome: e.target.value })}
              />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                value={edit.descricao ?? ""}
                onChange={(e) => setEdit({ ...edit, descricao: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={edit.ativo ?? true}
                onCheckedChange={(v) => setEdit({ ...edit, ativo: v })}
              />
              <Label>Ativo</Label>
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

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  useFinCategorias,
  useUpsertCategoria,
  useDeleteCategoria,
  type FinCategoria,
} from "@/hooks/financeiro/useFinCategorias";
import { useFinNaturezas } from "@/hooks/financeiro/useFinNaturezas";
import { useFinCentrosCusto } from "@/hooks/financeiro/useFinCentrosCusto";
import { Pencil, Plus, Trash2 } from "lucide-react";

export function CategoriasTab() {
  const { data: items = [] } = useFinCategorias();
  const { data: naturezas = [] } = useFinNaturezas();
  const { data: centros = [] } = useFinCentrosCusto();
  const upsert = useUpsertCategoria();
  const del = useDeleteCategoria();
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState<Partial<FinCategoria>>({});

  const grouped = naturezas.map((n) => ({
    natureza: n,
    items: items.filter((i) => i.natureza_id === n.id),
  }));
  const orphans = items.filter((i) => !i.natureza_id);

  function openNew() {
    setEdit({ codigo: "", nome: "", ativo: true, ordem: 99 });
    setOpen(true);
  }
  function openEdit(c: FinCategoria) {
    setEdit(c);
    setOpen(true);
  }
  async function save() {
    if (!edit.nome || !edit.codigo) return;
    await upsert.mutateAsync(edit as any);
    setOpen(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={openNew}>
          <Plus className="h-4 w-4 mr-1" /> Nova categoria
        </Button>
      </div>
      {grouped.map(({ natureza, items }) => (
        <Card key={natureza.id} className="p-3">
          <h3 className="font-medium text-sm mb-2">{natureza.nome}</h3>
          <div className="divide-y">
            {items.length === 0 && (
              <p className="text-xs text-muted-foreground py-2">Nenhuma categoria.</p>
            )}
            {items.map((c) => (
              <div key={c.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="flex-1">{c.nome}</span>
                <span className="text-[10px] text-muted-foreground">{c.codigo}</span>
                {!c.ativo && (
                  <span className="text-[10px] text-amber-600">inativa</span>
                )}
                <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
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
          </div>
        </Card>
      ))}
      {orphans.length > 0 && (
        <Card className="p-3">
          <h3 className="font-medium text-sm mb-2">Sem natureza</h3>
          {orphans.map((c) => (
            <div key={c.id} className="flex items-center gap-2 py-2 text-sm border-b">
              <span className="flex-1">{c.nome}</span>
              <Button size="icon" variant="ghost" onClick={() => openEdit(c)}>
                <Pencil className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{edit.id ? "Editar" : "Nova"} categoria</DialogTitle>
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
              <Label>Natureza</Label>
              <Select
                value={edit.natureza_id ?? "__none__"}
                onValueChange={(v) =>
                  setEdit({ ...edit, natureza_id: v === "__none__" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— sem natureza —</SelectItem>
                  {naturezas.map((n) => (
                    <SelectItem key={n.id} value={n.id}>
                      {n.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Centro de custo</Label>
              <Select
                value={edit.centro_custo_id ?? "__none__"}
                onValueChange={(v) =>
                  setEdit({ ...edit, centro_custo_id: v === "__none__" ? null : v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">— sem centro —</SelectItem>
                  {centros.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={edit.ativo ?? true}
                onCheckedChange={(v) => setEdit({ ...edit, ativo: v })}
              />
              <Label>Ativa</Label>
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

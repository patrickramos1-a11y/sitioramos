import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Responsavel, useResponsaveis } from "@/hooks/useResponsaveis";

const PRESET_COLORS = [
  "#16a34a", "#ea580c", "#2563eb", "#dc2626", "#ca8a04",
  "#7c3aed", "#0891b2", "#db2777", "#65a30d", "#525252",
];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  responsavel?: Responsavel | null;
}

export function ResponsavelForm({ open, onOpenChange, responsavel }: Props) {
  const { create, update } = useResponsaveis(true);
  const [form, setForm] = useState({
    nome: "",
    apelido: "",
    cor: PRESET_COLORS[0],
    icone: "User",
    status: "ativo",
    observacoes: "",
  });

  useEffect(() => {
    if (responsavel) {
      setForm({
        nome: responsavel.nome,
        apelido: responsavel.apelido || "",
        cor: responsavel.cor,
        icone: responsavel.icone || "User",
        status: responsavel.status,
        observacoes: responsavel.observacoes || "",
      });
    } else {
      setForm({ nome: "", apelido: "", cor: PRESET_COLORS[0], icone: "User", status: "ativo", observacoes: "" });
    }
  }, [responsavel, open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      nome: form.nome,
      apelido: form.apelido || null,
      cor: form.cor,
      icone: form.icone || null,
      status: form.status,
      observacoes: form.observacoes || null,
    };
    if (responsavel) {
      await update.mutateAsync({ id: responsavel.id, ...payload } as any);
    } else {
      await create.mutateAsync(payload as any);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{responsavel ? "Editar Responsável" : "Novo Responsável"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label>Nome *</Label>
            <Input value={form.nome} onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))} required />
          </div>
          <div>
            <Label>Apelido</Label>
            <Input value={form.apelido} onChange={(e) => setForm((p) => ({ ...p, apelido: e.target.value }))} />
          </div>
          <div>
            <Label>Cor de identificação</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, cor: c }))}
                  className={`h-8 w-8 rounded-full ring-2 transition-all ${
                    form.cor === c ? "ring-foreground scale-110" : "ring-transparent"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
              <Input
                type="color"
                value={form.cor}
                onChange={(e) => setForm((p) => ({ ...p, cor: e.target.value }))}
                className="h-8 w-16 p-0"
              />
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label className="text-sm">Ativo</Label>
              <p className="text-xs text-muted-foreground">Disponível para novos vínculos</p>
            </div>
            <Switch
              checked={form.status === "ativo"}
              onCheckedChange={(c) => setForm((p) => ({ ...p, status: c ? "ativo" : "inativo" }))}
            />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={form.observacoes} onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit">{responsavel ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

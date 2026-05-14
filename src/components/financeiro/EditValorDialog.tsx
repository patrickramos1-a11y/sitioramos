import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCashTransactions, CashTransaction } from "@/hooks/useCashTransactions";
import { useToast } from "@/hooks/use-toast";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  transaction: CashTransaction | null;
}

export function EditValorDialog({ open, onOpenChange, transaction }: Props) {
  const { updateTransaction } = useCashTransactions();
  const { toast } = useToast();
  const [data, setData] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<"entrada" | "saida">("saida");

  useEffect(() => {
    if (transaction) {
      setData(transaction.data);
      setValor(String(transaction.valor));
      setDescricao(transaction.descricao || "");
      setTipo(transaction.tipo);
    }
  }, [transaction]);

  if (!transaction) return null;

  const handleSave = async () => {
    const v = Number(valor);
    if (!v || v <= 0) {
      toast({ title: "Valor inválido", variant: "destructive" });
      return;
    }
    try {
      await updateTransaction.mutateAsync({
        id: transaction.id,
        data,
        valor: v,
        descricao: descricao || null,
        tipo,
      } as any);
      toast({ title: "Lançamento atualizado" });
      onOpenChange(false);
    } catch (e: any) {
      toast({ title: "Erro ao salvar", description: e.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar lançamento</DialogTitle>
          <DialogDescription className="text-xs">
            Edite valor, data ou descrição. Para classificar (natureza, categoria, área, etc.) use a aba Reclassificação.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Tipo</Label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="entrada">Entrada</option>
                <option value="saida">Saída</option>
              </select>
            </div>
          </div>
          <div>
            <Label className="text-xs">Valor (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <Label className="text-xs">Descrição</Label>
            <Textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={updateTransaction.isPending}>
            {updateTransaction.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

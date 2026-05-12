import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContatoSelect } from "@/components/contatos/ContatoSelect";
import { CashTransaction } from "@/hooks/useCashTransactions";

interface AreaOpt { id: string; nome: string }
interface CycleOpt { id: string; cultura: string; area_id: string | null }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  transaction: CashTransaction | null;
  areas: AreaOpt[];
  cycles: CycleOpt[];
  onSave: (patch: { id: string; data: string; valor: number; descricao: string | null; area_id: string | null; cycle_id: string | null; contato_id: string | null; observacoes: string | null }) => void;
}

const NONE = "__none__";

export function EditTransactionDialog({ open, onOpenChange, transaction, areas, cycles, onSave }: Props) {
  const [data, setData] = useState("");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [areaId, setAreaId] = useState<string>(NONE);
  const [cycleId, setCycleId] = useState<string>(NONE);
  const [contatoId, setContatoId] = useState<string | null>(null);
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    if (transaction) {
      setData(transaction.data);
      setValor(String(transaction.valor));
      setDescricao(transaction.descricao || "");
      setAreaId(transaction.area_id || NONE);
      setCycleId(transaction.cycle_id || NONE);
      setContatoId(transaction.contato_id || null);
      setObservacoes(transaction.observacoes || "");
    }
  }, [transaction]);

  const availableCycles = areaId !== NONE ? cycles.filter((c) => c.area_id === areaId) : cycles;

  const handleSave = () => {
    if (!transaction) return;
    onSave({
      id: transaction.id,
      data,
      valor: Number(valor),
      descricao: descricao || null,
      area_id: areaId === NONE ? null : areaId,
      cycle_id: cycleId === NONE ? null : cycleId,
      contato_id: contatoId,
      observacoes: observacoes || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Movimentação</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div>
              <Label>Valor</Label>
              <Input type="number" step="0.01" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
          </div>
          <div>
            <Label>Descrição</Label>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Área</Label>
              <Select value={areaId} onValueChange={(v) => { setAreaId(v); setCycleId(NONE); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem área</SelectItem>
                  {areas.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ciclo</Label>
              <Select value={cycleId} onValueChange={setCycleId}>
                <SelectTrigger><SelectValue placeholder="Sem ciclo" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>Sem ciclo</SelectItem>
                  {availableCycles.map((c) => <SelectItem key={c.id} value={c.id}>{c.cultura}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Contato</Label>
            <ContatoSelect value={contatoId} onChange={setContatoId} />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} />
          </div>
          <p className="text-xs text-muted-foreground">
            Edições aqui afetam apenas o lançamento no caixa. Para alterar custos, receitas ou investimentos originais, use as abas correspondentes.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

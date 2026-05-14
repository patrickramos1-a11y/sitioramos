import { useState, ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Circle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCashTransactions } from "@/hooks/useCashTransactions";
import { useUpsertClassificacao } from "@/hooks/financeiro/useFinClassificacoes";
import { useFinNaturezas } from "@/hooks/financeiro/useFinNaturezas";
import { useFinCategorias } from "@/hooks/financeiro/useFinCategorias";
import { useFinCentrosCusto } from "@/hooks/financeiro/useFinCentrosCusto";
import { useFinProjetos } from "@/hooks/financeiro/useFinProjetos";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { useLoans } from "@/hooks/useLoans";
import { useResponsaveis } from "@/hooks/useResponsaveis";
import { toast } from "sonner";

type FieldKey =
  | "responsavel_id" | "natureza_id" | "categoria_id" | "centro_custo_id"
  | "area_id" | "cycle_id" | "projeto_investimento_id" | "loan_id" | "observacoes";

const ALL_FIELDS: FieldKey[] = [
  "responsavel_id", "natureza_id", "categoria_id", "centro_custo_id",
  "area_id", "cycle_id", "projeto_investimento_id", "loan_id", "observacoes",
];

export function NovoLancamentoDialog({ trigger }: { trigger?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { createTransaction } = useCashTransactions();
  const upsertClass = useUpsertClassificacao();
  const { data: naturezas = [] } = useFinNaturezas();
  const { data: categorias = [] } = useFinCategorias();
  const { data: centros = [] } = useFinCentrosCusto();
  const { data: projetos = [] } = useFinProjetos();
  const { areas = [] } = useAreas();
  const { cycles = [] } = useCycles();
  const { loans = [] } = useLoans();
  const { data: responsaveis = [] } = useResponsaveis();

  // mandatory base
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState<"entrada" | "saida">("saida");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");

  // optional with N/A
  const [na, setNa] = useState<Record<FieldKey, boolean>>({} as any);
  const [vals, setVals] = useState<Record<FieldKey, string>>({} as any);

  const setVal = (k: FieldKey, v: string) => setVals((s) => ({ ...s, [k]: v }));
  const toggleNa = (k: FieldKey) => setNa((s) => ({ ...s, [k]: !s[k] }));

  const reset = () => {
    setData(new Date().toISOString().slice(0, 10));
    setTipo("saida");
    setValor("");
    setDescricao("");
    setNa({} as any);
    setVals({} as any);
  };

  const validate = () => {
    if (!data) return "Informe a data";
    if (!valor || Number(valor) <= 0) return "Informe um valor maior que zero";
    if (!descricao.trim()) return "Informe uma descrição";
    for (const f of ALL_FIELDS) {
      if (!na[f] && !vals[f]) return `Preencha ou marque "Não se aplica" em ${labelOf(f)}`;
    }
    return null;
  };

  const submit = async () => {
    const err = validate();
    if (err) { toast.error(err); return; }
    try {
      const tx: any = await createTransaction.mutateAsync({
        data,
        tipo,
        categoria: tipo === "entrada" ? "outros_recebimentos" : "outros_pagamentos",
        valor: Number(valor),
        descricao: descricao.trim(),
        responsavel_id: na.responsavel_id ? null : (vals.responsavel_id || null),
        area_id: na.area_id ? null : (vals.area_id || null),
        cycle_id: na.cycle_id ? null : (vals.cycle_id || null),
        loan_id: na.loan_id ? null : (vals.loan_id || null),
        observacoes: na.observacoes ? null : (vals.observacoes || null),
      });

      const hasClass =
        !na.natureza_id || !na.categoria_id || !na.centro_custo_id ||
        !na.projeto_investimento_id || !na.area_id || !na.cycle_id || !na.loan_id;
      if (hasClass && tx?.id) {
        await upsertClass.mutateAsync({
          cash_transaction_id: tx.id,
          natureza_id: na.natureza_id ? null : (vals.natureza_id || null),
          categoria_id: na.categoria_id ? null : (vals.categoria_id || null),
          centro_custo_id: na.centro_custo_id ? null : (vals.centro_custo_id || null),
          projeto_investimento_id: na.projeto_investimento_id ? null : (vals.projeto_investimento_id || null),
          area_id: na.area_id ? null : (vals.area_id || null),
          cycle_id: na.cycle_id ? null : (vals.cycle_id || null),
          loan_id: na.loan_id ? null : (vals.loan_id || null),
          origem: "manual",
          revisado: true,
          confianca: "alta",
        });
      }
      reset();
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-1" /> Novo lançamento
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo lançamento</DialogTitle>
        </DialogHeader>

        <div className="grid gap-3 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <Label>Data *</Label>
              <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
            </div>
            <div>
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor (R$) *</Label>
              <Input type="number" step="0.01" min="0" value={valor} onChange={(e) => setValor(e.target.value)} />
            </div>
            <div className="col-span-2 md:col-span-1">
              <Label>Descrição *</Label>
              <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Obrigatório" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t">
            <FieldRow k="responsavel_id" label="Responsável" na={na} toggleNa={toggleNa}>
              <SelectField value={vals.responsavel_id} onChange={(v) => setVal("responsavel_id", v)} disabled={na.responsavel_id}>
                {responsaveis.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                ))}
              </SelectField>
            </FieldRow>

            <FieldRow k="natureza_id" label="Natureza" na={na} toggleNa={toggleNa}>
              <SelectField value={vals.natureza_id} onChange={(v) => setVal("natureza_id", v)} disabled={na.natureza_id}>
                {naturezas.map((n) => <SelectItem key={n.id} value={n.id}>{n.nome}</SelectItem>)}
              </SelectField>
            </FieldRow>

            <FieldRow k="categoria_id" label="Categoria" na={na} toggleNa={toggleNa}>
              <SelectField value={vals.categoria_id} onChange={(v) => setVal("categoria_id", v)} disabled={na.categoria_id}>
                {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectField>
            </FieldRow>

            <FieldRow k="centro_custo_id" label="Centro de custo" na={na} toggleNa={toggleNa}>
              <SelectField value={vals.centro_custo_id} onChange={(v) => setVal("centro_custo_id", v)} disabled={na.centro_custo_id}>
                {centros.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectField>
            </FieldRow>

            <FieldRow k="area_id" label="Área" na={na} toggleNa={toggleNa}>
              <SelectField value={vals.area_id} onChange={(v) => setVal("area_id", v)} disabled={na.area_id}>
                {areas.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
              </SelectField>
            </FieldRow>

            <FieldRow k="cycle_id" label="Ciclo" na={na} toggleNa={toggleNa}>
              <SelectField value={vals.cycle_id} onChange={(v) => setVal("cycle_id", v)} disabled={na.cycle_id}>
                {cycles.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.cultura}</SelectItem>)}
              </SelectField>
            </FieldRow>

            <FieldRow k="projeto_investimento_id" label="Projeto investimento" na={na} toggleNa={toggleNa}>
              <SelectField value={vals.projeto_investimento_id} onChange={(v) => setVal("projeto_investimento_id", v)} disabled={na.projeto_investimento_id}>
                {projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
              </SelectField>
            </FieldRow>

            <FieldRow k="loan_id" label="Empréstimo" na={na} toggleNa={toggleNa}>
              <SelectField value={vals.loan_id} onChange={(v) => setVal("loan_id", v)} disabled={na.loan_id}>
                {loans.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.origem_credor}</SelectItem>)}
              </SelectField>
            </FieldRow>

            <FieldRow k="observacoes" label="Observações" na={na} toggleNa={toggleNa} className="md:col-span-2">
              <Textarea
                value={vals.observacoes || ""}
                onChange={(e) => setVal("observacoes", e.target.value)}
                disabled={na.observacoes}
                rows={2}
              />
            </FieldRow>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={createTransaction.isPending}>
            Salvar lançamento
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function labelOf(k: FieldKey) {
  return ({
    responsavel_id: "Responsável",
    natureza_id: "Natureza",
    categoria_id: "Categoria",
    centro_custo_id: "Centro de custo",
    area_id: "Área",
    cycle_id: "Ciclo",
    projeto_investimento_id: "Projeto",
    loan_id: "Empréstimo",
    observacoes: "Observações",
  } as Record<FieldKey, string>)[k];
}

function FieldRow({
  k, label, na, toggleNa, children, className,
}: {
  k: FieldKey;
  label: string;
  na: Record<FieldKey, boolean>;
  toggleNa: (k: FieldKey) => void;
  children: ReactNode;
  className?: string;
}) {
  const isNa = !!na[k];
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between">
        <Label className={cn(isNa && "text-muted-foreground line-through")}>
          {label} {!isNa && "*"}
        </Label>
        <button
          type="button"
          onClick={() => toggleNa(k)}
          className={cn(
            "flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 transition-colors",
            isNa ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/50"
          )}
          title="Marcar como não se aplica"
        >
          {isNa ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
          N/A
        </button>
      </div>
      <div className={cn(isNa && "opacity-50 pointer-events-none")}>{children}</div>
    </div>
  );
}

function SelectField({
  value, onChange, disabled, children,
}: { value?: string; onChange: (v: string) => void; disabled?: boolean; children: ReactNode }) {
  return (
    <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder="Selecionar..." /></SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

import { useState, useEffect, ReactNode, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Circle, CheckCircle2, ArrowDownCircle, ArrowUpCircle, Calendar, FileText, Tags, Target, MapPin, Sprout, Briefcase, Landmark, User, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCashTransactions, CashTransaction } from "@/hooks/useCashTransactions";
import { useUpsertClassificacao, useFinClassificacoes } from "@/hooks/financeiro/useFinClassificacoes";
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

interface Props {
  trigger?: ReactNode;
  transaction?: CashTransaction | null;
  open?: boolean;
  onOpenChange?: (v: boolean) => void;
}

export function NovoLancamentoDialog({ trigger, transaction, open: openProp, onOpenChange }: Props) {
  const isEdit = !!transaction;
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternalOpen(v);
  };

  const { createTransaction, updateTransaction } = useCashTransactions();
  const upsertClass = useUpsertClassificacao();
  const { data: classifs = [] } = useFinClassificacoes();
  const { data: naturezas = [] } = useFinNaturezas();
  const { data: categorias = [] } = useFinCategorias();
  const { data: centros = [] } = useFinCentrosCusto();
  const { data: projetos = [] } = useFinProjetos();
  const { areas = [] } = useAreas();
  const { cycles = [] } = useCycles();
  const { loans = [] } = useLoans();
  const { data: responsaveis = [] } = useResponsaveis();

  const existingClass = useMemo(
    () => (transaction ? classifs.find((c) => c.cash_transaction_id === transaction.id) : null),
    [classifs, transaction]
  );

  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [tipo, setTipo] = useState<"entrada" | "saida">("saida");
  const [valorCents, setValorCents] = useState(0);
  const valor = (valorCents / 100).toString();
  const valorFormatted = (valorCents / 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, 12);
    setValorCents(digits ? parseInt(digits, 10) : 0);
  };
  const [descricao, setDescricao] = useState("");
  const [na, setNa] = useState<Record<FieldKey, boolean>>({} as any);
  const [vals, setVals] = useState<Record<FieldKey, string>>({} as any);

  // Seed state when opening / transaction changes
  useEffect(() => {
    if (!open) return;
    if (transaction) {
      setData(transaction.data);
      setTipo(transaction.tipo);
      setValorCents(Math.round(Number(transaction.valor) * 100));
      setDescricao(transaction.descricao || "");
      const tAny: any = transaction;
      const seed: Record<FieldKey, string> = {
        responsavel_id: tAny.responsavel_id || "",
        natureza_id: existingClass?.natureza_id || "",
        categoria_id: existingClass?.categoria_id || "",
        centro_custo_id: existingClass?.centro_custo_id || "",
        area_id: existingClass?.area_id || tAny.area_id || "",
        cycle_id: existingClass?.cycle_id || tAny.cycle_id || "",
        projeto_investimento_id: existingClass?.projeto_investimento_id || "",
        loan_id: existingClass?.loan_id || tAny.loan_id || "",
        observacoes: tAny.observacoes || "",
      };
      const seedNa: Record<FieldKey, boolean> = {} as any;
      ALL_FIELDS.forEach((k) => { seedNa[k] = !seed[k]; });
      setVals(seed);
      setNa(seedNa);
    } else {
      setData(new Date().toISOString().slice(0, 10));
      setTipo("saida");
      setValorCents(0);
      setDescricao("");
      setVals({} as any);
      setNa({} as any);
    }
  }, [open, transaction?.id, existingClass?.id]);

  const setVal = (k: FieldKey, v: string) => setVals((s) => ({ ...s, [k]: v }));
  const toggleNa = (k: FieldKey) => setNa((s) => ({ ...s, [k]: !s[k] }));

  // ============ Cascading filters ============
  // Natureza filtered by tipo (entrada/saida)
  const naturezasFiltradas = useMemo(
    () => naturezas.filter((n: any) => n.tipo === tipo),
    [naturezas, tipo]
  );
  // Reset natureza when tipo changes if mismatched
  useEffect(() => {
    if (vals.natureza_id) {
      const n: any = naturezas.find((x: any) => x.id === vals.natureza_id);
      if (n && n.tipo !== tipo) {
        setVals((s) => ({ ...s, natureza_id: "", categoria_id: "", centro_custo_id: "" }));
      }
    }
  }, [tipo]); // eslint-disable-line

  // Categorias filtered by natureza
  const categoriasFiltradas = useMemo(
    () => categorias.filter((c: any) => !vals.natureza_id || c.natureza_id === vals.natureza_id),
    [categorias, vals.natureza_id]
  );
  // Reset categoria if not in filtered list
  useEffect(() => {
    if (vals.categoria_id && !categoriasFiltradas.some((c: any) => c.id === vals.categoria_id)) {
      setVals((s) => ({ ...s, categoria_id: "", centro_custo_id: "" }));
    }
  }, [categoriasFiltradas]); // eslint-disable-line

  // Centro de custo: derived from selected categoria
  const categoriaSel: any = useMemo(
    () => categorias.find((c: any) => c.id === vals.categoria_id),
    [categorias, vals.categoria_id]
  );
  const centrosFiltrados = useMemo(() => {
    if (categoriaSel?.centro_custo_id) {
      return centros.filter((c: any) => c.id === categoriaSel.centro_custo_id);
    }
    return centros;
  }, [centros, categoriaSel]);
  // Auto-fill centro custo from categoria if defined
  useEffect(() => {
    if (categoriaSel?.centro_custo_id) {
      setVals((s) => ({ ...s, centro_custo_id: categoriaSel.centro_custo_id }));
      setNa((s) => ({ ...s, centro_custo_id: false }));
    }
  }, [categoriaSel?.id]); // eslint-disable-line

  // Progressive disclosure: only show next field when prior is filled or marked NA
  const naturezaReady = !!vals.natureza_id || na.natureza_id;
  const categoriaReady = naturezaReady && (!!vals.categoria_id || na.categoria_id);
  const centroReady = categoriaReady && (!!vals.centro_custo_id || na.centro_custo_id);

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
      const basePayload = {
        data,
        tipo,
        valor: Number(valor),
        descricao: descricao.trim(),
        responsavel_id: na.responsavel_id ? null : (vals.responsavel_id || null),
        area_id: na.area_id ? null : (vals.area_id || null),
        cycle_id: na.cycle_id ? null : (vals.cycle_id || null),
        loan_id: na.loan_id ? null : (vals.loan_id || null),
        observacoes: na.observacoes ? null : (vals.observacoes || null),
      };

      let txId: string | undefined;
      if (isEdit && transaction) {
        await updateTransaction.mutateAsync({ id: transaction.id, ...basePayload } as any);
        txId = transaction.id;
      } else {
        const tx: any = await createTransaction.mutateAsync({
          ...basePayload,
          categoria: tipo === "entrada" ? "receita" : "financeiro",
        } as any);
        txId = tx?.id;
      }

      if (txId) {
        await upsertClass.mutateAsync({
          cash_transaction_id: txId,
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
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const pending = createTransaction.isPending || updateTransaction.isPending || upsertClass.isPending;

  const isEntrada = tipo === "entrada";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isEdit && (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button size="sm" className="h-8">
              <Plus className="h-4 w-4 mr-1" /> Novo lançamento
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl w-[95vw] max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader
          className={cn(
            "px-6 py-4 border-b sticky top-0 z-10 backdrop-blur",
            isEntrada ? "bg-emerald-50/80 dark:bg-emerald-950/30" : "bg-rose-50/80 dark:bg-rose-950/30"
          )}
        >
          <DialogTitle className="flex items-center gap-2 text-lg">
            {isEntrada ? (
              <ArrowUpCircle className="h-5 w-5 text-emerald-600" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-rose-600" />
            )}
            {isEdit ? "Editar lançamento" : "Novo lançamento"}
            <span
              className={cn(
                "ml-2 text-xs font-medium px-2 py-0.5 rounded-full",
                isEntrada
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300"
              )}
            >
              {isEntrada ? "Entrada" : "Saída"}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-5 text-sm">
          {/* ===== Bloco 1: Dados básicos ===== */}
          <Section title="Informações básicas" icon={<FileText className="h-4 w-4" />} accent="primary">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
              <div className="md:col-span-3">
                <Label className="flex items-center gap-1 mb-1"><Calendar className="h-3.5 w-3.5" /> Data *</Label>
                <Input type="date" value={data} onChange={(e) => setData(e.target.value)} />
              </div>
              <div className="md:col-span-3">
                <Label className="mb-1 block">Tipo *</Label>
                <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">
                      <span className="flex items-center gap-2"><ArrowUpCircle className="h-4 w-4 text-emerald-600" /> Entrada</span>
                    </SelectItem>
                    <SelectItem value="saida">
                      <span className="flex items-center gap-2"><ArrowDownCircle className="h-4 w-4 text-rose-600" /> Saída</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-3">
                <Label className="mb-1 block">Valor (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className={cn("font-semibold", isEntrada ? "text-emerald-700" : "text-rose-700")}
                />
              </div>
              <div className="md:col-span-3">
                <Label className="mb-1 block">Descrição *</Label>
                <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Obrigatório" />
              </div>
            </div>
          </Section>

          {/* ===== Bloco 2: Classificação (cascata) ===== */}
          <Section title="Classificação" icon={<Tags className="h-4 w-4" />} accent="amber">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FieldRow k="natureza_id" label="Natureza" icon={<Tags className="h-3.5 w-3.5" />} na={na} toggleNa={toggleNa}>
                <SelectField
                  value={vals.natureza_id}
                  onChange={(v) => setVal("natureza_id", v)}
                  disabled={na.natureza_id}
                  placeholder={naturezasFiltradas.length ? "Selecionar natureza..." : "Sem opções para este tipo"}
                >
                  {naturezasFiltradas.map((n: any) => (
                    <SelectItem key={n.id} value={n.id}>{n.nome}</SelectItem>
                  ))}
                </SelectField>
              </FieldRow>

              <FieldRow
                k="categoria_id"
                label="Categoria"
                icon={<Tags className="h-3.5 w-3.5" />}
                na={na}
                toggleNa={toggleNa}
                hint={!naturezaReady ? "Selecione a natureza primeiro" : undefined}
              >
                <SelectField
                  value={vals.categoria_id}
                  onChange={(v) => setVal("categoria_id", v)}
                  disabled={na.categoria_id || !vals.natureza_id}
                  placeholder={vals.natureza_id ? "Selecionar categoria..." : "Aguardando natureza"}
                >
                  {categoriasFiltradas.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectField>
              </FieldRow>

              <FieldRow
                k="centro_custo_id"
                label="Centro de custo"
                icon={<Target className="h-3.5 w-3.5" />}
                na={na}
                toggleNa={toggleNa}
                hint={!categoriaReady ? "Selecione a categoria primeiro" : (categoriaSel?.centro_custo_id ? "Definido pela categoria" : undefined)}
              >
                <SelectField
                  value={vals.centro_custo_id}
                  onChange={(v) => setVal("centro_custo_id", v)}
                  disabled={na.centro_custo_id || !vals.categoria_id || !!categoriaSel?.centro_custo_id}
                  placeholder={vals.categoria_id ? "Selecionar centro..." : "Aguardando categoria"}
                >
                  {centrosFiltrados.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectField>
              </FieldRow>
            </div>
          </Section>

          {/* ===== Bloco 3: Vínculos ===== */}
          {centroReady && (
            <Section title="Vínculos operacionais" icon={<MapPin className="h-4 w-4" />} accent="emerald">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FieldRow k="area_id" label="Área" icon={<MapPin className="h-3.5 w-3.5" />} na={na} toggleNa={toggleNa}>
                  <SelectField value={vals.area_id} onChange={(v) => setVal("area_id", v)} disabled={na.area_id}>
                    {areas.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
                  </SelectField>
                </FieldRow>

                <FieldRow k="cycle_id" label="Ciclo" icon={<Sprout className="h-3.5 w-3.5" />} na={na} toggleNa={toggleNa}>
                  <SelectField value={vals.cycle_id} onChange={(v) => setVal("cycle_id", v)} disabled={na.cycle_id}>
                    {cycles.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.cultura}</SelectItem>)}
                  </SelectField>
                </FieldRow>

                <FieldRow k="projeto_investimento_id" label="Projeto investimento" icon={<Briefcase className="h-3.5 w-3.5" />} na={na} toggleNa={toggleNa}>
                  <SelectField value={vals.projeto_investimento_id} onChange={(v) => setVal("projeto_investimento_id", v)} disabled={na.projeto_investimento_id}>
                    {projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectField>
                </FieldRow>

                <FieldRow k="loan_id" label="Empréstimo" icon={<Landmark className="h-3.5 w-3.5" />} na={na} toggleNa={toggleNa}>
                  <SelectField value={vals.loan_id} onChange={(v) => setVal("loan_id", v)} disabled={na.loan_id}>
                    {loans.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.origem_credor}</SelectItem>)}
                  </SelectField>
                </FieldRow>

                <FieldRow k="responsavel_id" label="Responsável" icon={<User className="h-3.5 w-3.5" />} na={na} toggleNa={toggleNa}>
                  <SelectField value={vals.responsavel_id} onChange={(v) => setVal("responsavel_id", v)} disabled={na.responsavel_id}>
                    {responsaveis.map((r) => (
                      <SelectItem key={r.id} value={r.id}>{r.nome}</SelectItem>
                    ))}
                  </SelectField>
                </FieldRow>

                <FieldRow k="observacoes" label="Observações" icon={<StickyNote className="h-3.5 w-3.5" />} na={na} toggleNa={toggleNa}>
                  <Textarea
                    value={vals.observacoes || ""}
                    onChange={(e) => setVal("observacoes", e.target.value)}
                    disabled={na.observacoes}
                    rows={2}
                  />
                </FieldRow>
              </div>
            </Section>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t bg-muted/30 sticky bottom-0">
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={pending} className={cn(isEntrada ? "bg-emerald-600 hover:bg-emerald-700" : "bg-rose-600 hover:bg-rose-700", "text-white")}>
            {pending ? "Salvando..." : isEdit ? "Salvar alterações" : "Salvar lançamento"}
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

const ACCENTS: Record<string, string> = {
  primary: "border-l-primary bg-primary/5",
  amber: "border-l-amber-500 bg-amber-50/60 dark:bg-amber-950/20",
  emerald: "border-l-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/20",
};

function Section({ title, icon, accent, children }: { title: string; icon: ReactNode; accent: keyof typeof ACCENTS | string; children: ReactNode }) {
  return (
    <div className={cn("rounded-lg border border-l-4 p-4", ACCENTS[accent as string] || ACCENTS.primary)}>
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground/90">
        {icon}
        {title}
      </div>
      {children}
    </div>
  );
}

function FieldRow({
  k, label, icon, na, toggleNa, children, className, hint,
}: {
  k: FieldKey;
  label: string;
  icon?: ReactNode;
  na: Record<FieldKey, boolean>;
  toggleNa: (k: FieldKey) => void;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  const isNa = !!na[k];
  return (
    <div className={cn("space-y-1", className)}>
      <div className="flex items-center justify-between">
        <Label className={cn("flex items-center gap-1", isNa && "text-muted-foreground line-through")}>
          {icon}
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
      {hint && <p className="text-[11px] text-muted-foreground italic">{hint}</p>}
    </div>
  );
}

function SelectField({
  value, onChange, disabled, children, placeholder,
}: { value?: string; onChange: (v: string) => void; disabled?: boolean; children: ReactNode; placeholder?: string }) {
  return (
    <Select value={value || ""} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger><SelectValue placeholder={placeholder || "Selecionar..."} /></SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

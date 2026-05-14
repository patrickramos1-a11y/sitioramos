import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Sparkles, Trash2, X } from "lucide-react";
import { useCashTransactions } from "@/hooks/useCashTransactions";
import {
  useFinClassificacoes,
  useUpsertClassificacao,
  useDeleteClassificacao,
  useToggleRevisado,
  type FinClassificacao,
  type LoanEvent,
} from "@/hooks/financeiro/useFinClassificacoes";
import { useFinNaturezas } from "@/hooks/financeiro/useFinNaturezas";
import { useFinCategorias } from "@/hooks/financeiro/useFinCategorias";
import { useFinCentrosCusto } from "@/hooks/financeiro/useFinCentrosCusto";
import { useFinProjetos } from "@/hooks/financeiro/useFinProjetos";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { useLoans } from "@/hooks/useLoans";
import {
  detectLoanEventFromTx,
  loanEventLabel,
  suggestClassification,
} from "@/lib/financeiro/suggestionEngine";

const NONE = "__none__";

const LOAN_EVENTS: { value: LoanEvent; label: string }[] = [
  { value: "recebimento", label: "Recebimento" },
  { value: "pagamento_parcela", label: "Pagamento parcela" },
  { value: "amortizacao", label: "Amortização" },
  { value: "juros", label: "Juros" },
  { value: "tarifa", label: "Tarifa" },
  { value: "ajuste", label: "Ajuste" },
];

export function ReclassificacaoTab() {
  const { transactions: txs = [] } = useCashTransactions();
  const { data: classifs = [] } = useFinClassificacoes();
  const { data: naturezas = [] } = useFinNaturezas();
  const { data: categorias = [] } = useFinCategorias();
  const { data: centros = [] } = useFinCentrosCusto();
  const { data: projetos = [] } = useFinProjetos();
  const { areas = [] } = useAreas();
  const { cycles = [] } = useCycles();
  const { loans = [] } = useLoans();

  const upsert = useUpsertClassificacao();
  const del = useDeleteClassificacao();
  const toggleRev = useToggleRevisado();

  const classifByTx = useMemo(() => {
    const m = new Map<string, FinClassificacao>();
    classifs.forEach((c) => m.set(c.cash_transaction_id, c));
    return m;
  }, [classifs]);

  const natByCode = useMemo(() => new Map(naturezas.map((n) => [n.codigo, n])), [naturezas]);
  const catByCode = useMemo(() => new Map(categorias.map((c) => [c.codigo, c])), [categorias]);
  const ccByCode = useMemo(() => new Map(centros.map((c) => [c.codigo, c])), [centros]);

  const [view, setView] = useState<"unclassified" | "all" | "revisado">("unclassified");
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    return txs
      .filter((t) => {
        const cls = classifByTx.get(t.id);
        if (view === "unclassified" && cls) return false;
        if (view === "revisado" && !cls?.revisado) return false;
        if (q && !(t.descricao ?? "").toLowerCase().includes(q.toLowerCase())) return false;
        return true;
      })
      .slice(0, 200);
  }, [txs, classifByTx, view, q]);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div className="space-y-3">
      <Card className="p-3 flex flex-wrap gap-2 items-center text-xs">
        <Select value={view} onValueChange={(v: any) => setView(v)}>
          <SelectTrigger className="h-8 w-48 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="unclassified">Não classificados</SelectItem>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="revisado">Revisados</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder="Buscar descrição..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-8 max-w-xs"
        />
        <span className="text-muted-foreground">{list.length} lançamentos</span>
      </Card>

      <div className="space-y-3">
        {list.map((t) => {
          const cls = classifByTx.get(t.id);
          const sug = !cls ? suggestClassification(t.descricao, t.tipo) : null;
          return (
            <ClassificacaoRow
              key={t.id}
              tx={t}
              cls={cls}
              suggestion={sug}
              naturezas={naturezas}
              categorias={categorias}
              centros={centros}
              projetos={projetos}
              areas={areas}
              cycles={cycles}
              loans={loans}
              natByCode={natByCode}
              catByCode={catByCode}
              ccByCode={ccByCode}
              fmt={fmt}
              onSave={(payload) => upsert.mutate(payload)}
              onDelete={() => del.mutate(t.id)}
              onToggleRevisado={(id, rev) => toggleRev.mutate({ id, revisado: rev })}
            />
          );
        })}
        {list.length === 0 && (
          <Card className="p-6 text-center text-sm text-muted-foreground">
            Nenhum lançamento para exibir.
          </Card>
        )}
      </div>
    </div>
  );
}

function ClassificacaoRow({
  tx,
  cls,
  suggestion,
  naturezas,
  categorias,
  centros,
  projetos,
  areas,
  cycles,
  loans,
  natByCode,
  catByCode,
  ccByCode,
  fmt,
  onSave,
  onDelete,
  onToggleRevisado,
}: any) {
  const txAny = tx;
  // Auto-detect existing loan link from cash_transactions
  const autoLoanId = txAny.loan_id as string | null;
  const autoInstId = txAny.installment_id as string | null;
  const autoLoanEvent = detectLoanEventFromTx({
    loan_id: autoLoanId,
    installment_id: autoInstId,
    subcategoria: txAny.subcategoria ?? null,
    tipo: tx.tipo,
  });

  const [naturezaId, setNaturezaId] = useState<string>(
    cls?.natureza_id ?? (suggestion?.naturezaCodigo ? natByCode.get(suggestion.naturezaCodigo)?.id ?? NONE : NONE)
  );
  const [categoriaId, setCategoriaId] = useState<string>(
    cls?.categoria_id ?? (suggestion?.categoriaCodigo ? catByCode.get(suggestion.categoriaCodigo)?.id ?? NONE : NONE)
  );
  const [centroId, setCentroId] = useState<string>(
    cls?.centro_custo_id ?? (suggestion?.centroCustoCodigo ? ccByCode.get(suggestion.centroCustoCodigo)?.id ?? NONE : NONE)
  );
  const [areaId, setAreaId] = useState<string>(cls?.area_id ?? tx.area_id ?? NONE);
  const [cycleId, setCycleId] = useState<string>(cls?.cycle_id ?? tx.cycle_id ?? NONE);
  const [projetoId, setProjetoId] = useState<string>(cls?.projeto_investimento_id ?? NONE);
  const [loanId, setLoanId] = useState<string>(cls?.loan_id ?? autoLoanId ?? NONE);
  const [installmentId, setInstallmentId] = useState<string>(
    cls?.installment_id ?? autoInstId ?? NONE
  );
  const [loanEvent, setLoanEvent] = useState<string>(
    cls?.tipo_evento_emprestimo ?? suggestion?.loanEvent ?? autoLoanEvent ?? NONE
  );
  const [observacao, setObservacao] = useState<string>(cls?.observacao ?? "");

  const installments = useMemo(() => {
    if (loanId === NONE) return [];
    const l = loans.find((x: any) => x.id === loanId);
    return (l?.installments ?? []).sort(
      (a: any, b: any) => a.numero_parcela - b.numero_parcela
    );
  }, [loanId, loans]);

  const handleSave = () => {
    onSave({
      cash_transaction_id: tx.id,
      natureza_id: naturezaId === NONE ? null : naturezaId,
      categoria_id: categoriaId === NONE ? null : categoriaId,
      centro_custo_id: centroId === NONE ? null : centroId,
      area_id: areaId === NONE ? null : areaId,
      cycle_id: cycleId === NONE ? null : cycleId,
      projeto_investimento_id: projetoId === NONE ? null : projetoId,
      loan_id: loanId === NONE ? null : loanId,
      installment_id: installmentId === NONE ? null : installmentId,
      tipo_evento_emprestimo: loanEvent === NONE ? null : (loanEvent as LoanEvent),
      observacao: observacao || null,
      origem: "manual",
      confianca: suggestion ? suggestion.confianca : "alta",
    });
  };

  const applySuggestion = () => {
    if (!suggestion) return;
    if (suggestion.naturezaCodigo) {
      const n = natByCode.get(suggestion.naturezaCodigo);
      if (n) setNaturezaId(n.id);
    }
    if (suggestion.categoriaCodigo) {
      const c = catByCode.get(suggestion.categoriaCodigo);
      if (c) setCategoriaId(c.id);
    }
    if (suggestion.centroCustoCodigo) {
      const cc = ccByCode.get(suggestion.centroCustoCodigo);
      if (cc) setCentroId(cc.id);
    }
    if (suggestion.loanEvent) setLoanEvent(suggestion.loanEvent);
  };

  return (
    <Card className="p-3 space-y-2 text-xs">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-2 justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted-foreground">
              {new Date(tx.data).toLocaleDateString("pt-BR")}
            </span>
            <Badge variant={tx.tipo === "entrada" ? "default" : "secondary"} className="text-[10px]">
              {tx.tipo}
            </Badge>
            {(autoLoanId || autoInstId) && (
              <Badge variant="outline" className="text-[10px]">
                {loanEventLabel(autoLoanEvent)}
              </Badge>
            )}
            {cls?.revisado && <Badge className="text-[10px]">Revisado</Badge>}
          </div>
          <div className="font-medium mt-0.5">{tx.descricao || "(sem descrição)"}</div>
          {tx.subcategoria && (
            <div className="text-muted-foreground text-[11px]">cat. antiga: {tx.subcategoria}</div>
          )}
        </div>
        <div className={`text-sm font-semibold ${tx.tipo === "entrada" ? "text-emerald-600" : "text-rose-600"}`}>
          {fmt(Number(tx.valor))}
        </div>
      </div>

      {/* Suggestion banner */}
      {suggestion && (
        <div className="flex items-start gap-2 rounded border border-primary/30 bg-primary/5 p-2">
          <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5" />
          <div className="flex-1">
            <div className="text-[11px]">
              <strong>Sugestão ({suggestion.confianca}):</strong> {suggestion.motivo}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {suggestion.naturezaCodigo && `Natureza: ${natByCode.get(suggestion.naturezaCodigo)?.nome ?? suggestion.naturezaCodigo}`}
              {suggestion.categoriaCodigo && ` · Categoria: ${catByCode.get(suggestion.categoriaCodigo)?.nome ?? suggestion.categoriaCodigo}`}
              {suggestion.centroCustoCodigo && ` · ${ccByCode.get(suggestion.centroCustoCodigo)?.nome ?? suggestion.centroCustoCodigo}`}
              {suggestion.loanEvent && ` · ${loanEventLabel(suggestion.loanEvent)}`}
            </div>
          </div>
          <Button size="sm" variant="outline" className="h-7 text-[11px]" onClick={applySuggestion}>
            Aplicar sugestão
          </Button>
        </div>
      )}

      {/* Editor grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <Field label="Natureza">
          <PickSelect value={naturezaId} onChange={setNaturezaId} options={naturezas} />
        </Field>
        <Field label="Categoria">
          <PickSelect
            value={categoriaId}
            onChange={setCategoriaId}
            options={categorias.filter(
              (c: any) => naturezaId === NONE || !c.natureza_id || c.natureza_id === naturezaId
            )}
          />
        </Field>
        <Field label="Centro de custo">
          <PickSelect value={centroId} onChange={setCentroId} options={centros} />
        </Field>
        <Field label="Projeto investimento">
          <PickSelect value={projetoId} onChange={setProjetoId} options={projetos} />
        </Field>
        <Field label="Área">
          <PickSelect value={areaId} onChange={setAreaId} options={areas} />
        </Field>
        <Field label="Ciclo">
          <PickSelect
            value={cycleId}
            onChange={setCycleId}
            options={cycles.map((c: any) => ({ ...c, nome: c.cultura }))}
          />
        </Field>
        <Field label="Empréstimo">
          <Select value={loanId} onValueChange={(v) => { setLoanId(v); setInstallmentId(NONE); }}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {loans.map((l: any) => (
                <SelectItem key={l.id} value={l.id}>{l.origem_credor}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Parcela">
          <Select value={installmentId} onValueChange={setInstallmentId} disabled={loanId === NONE}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {installments.map((i: any) => (
                <SelectItem key={i.id} value={i.id}>
                  #{i.numero_parcela} · {new Date(i.data_vencimento).toLocaleDateString("pt-BR")} · {i.status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Evento de empréstimo">
          <Select value={loanEvent} onValueChange={setLoanEvent}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>—</SelectItem>
              {LOAN_EVENTS.map((e) => (
                <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <div className="col-span-2 md:col-span-3">
          <Field label="Observação">
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={1}
              className="text-xs min-h-[32px]"
            />
          </Field>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 justify-end pt-1">
        {cls && (
          <>
            <Button
              size="sm"
              variant="outline"
              className="h-7 text-[11px]"
              onClick={() => onToggleRevisado(cls.id, !cls.revisado)}
            >
              <Check className="h-3 w-3 mr-1" />
              {cls.revisado ? "Marcar não revisado" : "Marcar revisado"}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] text-rose-600"
              onClick={onDelete}
            >
              <Trash2 className="h-3 w-3 mr-1" /> Limpar classificação
            </Button>
          </>
        )}
        <Button size="sm" className="h-7 text-[11px]" onClick={handleSave}>
          <Check className="h-3 w-3 mr-1" /> Salvar
        </Button>
      </div>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
      {children}
    </div>
  );
}

function PickSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; nome: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>—</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>{o.nome}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

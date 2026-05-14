import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCashTransactions } from "@/hooks/useCashTransactions";
import { useFinClassificacoes } from "@/hooks/financeiro/useFinClassificacoes";
import { useFinNaturezas } from "@/hooks/financeiro/useFinNaturezas";
import { useFinCategorias } from "@/hooks/financeiro/useFinCategorias";
import { useFinCentrosCusto } from "@/hooks/financeiro/useFinCentrosCusto";
import { useFinProjetos } from "@/hooks/financeiro/useFinProjetos";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { useLoans } from "@/hooks/useLoans";
import { useResponsaveis } from "@/hooks/useResponsaveis";
import { NovoLancamentoDialog } from "./NovoLancamentoDialog";
import {
  detectLoanEventFromTx,
  loanEventLabel,
} from "@/lib/financeiro/suggestionEngine";

const ALL = "__all__";

export function LancamentosTab() {
  const { transactions: txs = [], isLoading } = useCashTransactions();
  const { data: classifs = [] } = useFinClassificacoes();
  const { data: naturezas = [] } = useFinNaturezas();
  const { data: categorias = [] } = useFinCategorias();
  const { data: centros = [] } = useFinCentrosCusto();
  const { data: projetos = [] } = useFinProjetos();
  const { areas = [] } = useAreas();
  const { cycles = [] } = useCycles();
  const { loans = [] } = useLoans();
  const { data: responsaveis = [] } = useResponsaveis();

  const classifByTx = useMemo(() => {
    const m = new Map<string, (typeof classifs)[number]>();
    classifs.forEach((c) => m.set(c.cash_transaction_id, c));
    return m;
  }, [classifs]);

  const natById = useMemo(() => new Map(naturezas.map((n) => [n.id, n])), [naturezas]);
  const catById = useMemo(() => new Map(categorias.map((c) => [c.id, c])), [categorias]);
  const ccById = useMemo(() => new Map(centros.map((c) => [c.id, c])), [centros]);
  const projById = useMemo(() => new Map(projetos.map((p) => [p.id, p])), [projetos]);
  const areaById = useMemo(() => new Map(areas.map((a: any) => [a.id, a])), [areas]);
  const cycleById = useMemo(() => new Map(cycles.map((c: any) => [c.id, c])), [cycles]);
  const loanById = useMemo(
    () => new Map<string, any>(loans.map((l: any) => [l.id, l])),
    [loans]
  );
  const installmentById = useMemo(() => {
    const m = new Map<string, any>();
    loans.forEach((l: any) =>
      (l.installments ?? []).forEach((i: any) => m.set(i.id, { ...i, loan: l }))
    );
    return m;
  }, [loans]);

  // filters
  const [q, setQ] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [tipo, setTipo] = useState<string>(ALL);
  const [naturezaId, setNaturezaId] = useState(ALL);
  const [categoriaId, setCategoriaId] = useState(ALL);
  const [centroId, setCentroId] = useState(ALL);
  const [areaId, setAreaId] = useState(ALL);
  const [cycleId, setCycleId] = useState(ALL);
  const [projetoId, setProjetoId] = useState(ALL);
  const [loanId, setLoanId] = useState(ALL);
  const [classifFilter, setClassifFilter] = useState(ALL); // all / classified / unclassified / revisado / nao_revisado

  const filtered = useMemo(() => {
    return txs.filter((t) => {
      const cls = classifByTx.get(t.id);
      if (q && !(t.descricao ?? "").toLowerCase().includes(q.toLowerCase()))
        return false;
      if (start && t.data < start) return false;
      if (end && t.data > end) return false;
      if (tipo !== ALL && t.tipo !== tipo) return false;
      if (naturezaId !== ALL && cls?.natureza_id !== naturezaId) return false;
      if (categoriaId !== ALL && cls?.categoria_id !== categoriaId) return false;
      if (centroId !== ALL && cls?.centro_custo_id !== centroId) return false;
      if (areaId !== ALL && cls?.area_id !== areaId && t.area_id !== areaId) return false;
      if (cycleId !== ALL && cls?.cycle_id !== cycleId && t.cycle_id !== cycleId) return false;
      if (projetoId !== ALL && cls?.projeto_investimento_id !== projetoId)
        return false;
      if (loanId !== ALL && cls?.loan_id !== loanId && (t as any).loan_id !== loanId)
        return false;
      if (classifFilter === "classified" && !cls) return false;
      if (classifFilter === "unclassified" && cls) return false;
      if (classifFilter === "revisado" && !cls?.revisado) return false;
      if (classifFilter === "nao_revisado" && cls?.revisado) return false;
      return true;
    });
  }, [
    txs, classifByTx, q, start, end, tipo, naturezaId, categoriaId, centroId,
    areaId, cycleId, projetoId, loanId, classifFilter,
  ]);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-3">
      {/* Filters */}
      <Card className="p-3 grid gap-2 grid-cols-2 md:grid-cols-4 lg:grid-cols-6 text-xs">
        <Input
          placeholder="Buscar descrição..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-8 col-span-2"
        />
        <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="h-8" />
        <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="h-8" />
        <FilterSelect value={tipo} onChange={setTipo} placeholder="Tipo">
          <SelectItem value="entrada">Entradas</SelectItem>
          <SelectItem value="saida">Saídas</SelectItem>
        </FilterSelect>
        <FilterSelect value={classifFilter} onChange={setClassifFilter} placeholder="Status">
          <SelectItem value="classified">Classificados</SelectItem>
          <SelectItem value="unclassified">Não classificados</SelectItem>
          <SelectItem value="revisado">Revisados</SelectItem>
          <SelectItem value="nao_revisado">Não revisados</SelectItem>
        </FilterSelect>
        <FilterSelect value={naturezaId} onChange={setNaturezaId} placeholder="Natureza">
          {naturezas.map((n) => <SelectItem key={n.id} value={n.id}>{n.nome}</SelectItem>)}
        </FilterSelect>
        <FilterSelect value={categoriaId} onChange={setCategoriaId} placeholder="Categoria">
          {categorias.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
        </FilterSelect>
        <FilterSelect value={centroId} onChange={setCentroId} placeholder="Centro custo">
          {centros.map((c) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
        </FilterSelect>
        <FilterSelect value={areaId} onChange={setAreaId} placeholder="Área">
          {areas.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>)}
        </FilterSelect>
        <FilterSelect value={cycleId} onChange={setCycleId} placeholder="Ciclo">
          {cycles.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.cultura}</SelectItem>)}
        </FilterSelect>
        <FilterSelect value={projetoId} onChange={setProjetoId} placeholder="Projeto">
          {projetos.map((p) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
        </FilterSelect>
        <FilterSelect value={loanId} onChange={setLoanId} placeholder="Empréstimo">
          {loans.map((l: any) => (
            <SelectItem key={l.id} value={l.id}>{l.origem_credor}</SelectItem>
          ))}
        </FilterSelect>
      </Card>

      <div className="text-xs text-muted-foreground">
        {filtered.length} de {txs.length} lançamentos
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-2 py-2">Data</th>
              <th className="px-2 py-2">Tipo</th>
              <th className="px-2 py-2">Descrição</th>
              <th className="px-2 py-2">Cat. antiga</th>
              <th className="px-2 py-2">Natureza</th>
              <th className="px-2 py-2">Categoria</th>
              <th className="px-2 py-2">Centro custo</th>
              <th className="px-2 py-2">Área</th>
              <th className="px-2 py-2">Ciclo</th>
              <th className="px-2 py-2">Projeto</th>
              <th className="px-2 py-2">Empréstimo</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2 text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.slice(0, 500).map((t) => {
              const cls = classifByTx.get(t.id);
              const txAny = t as any;
              const linkedLoan = cls?.loan_id
                ? loanById.get(cls.loan_id)
                : txAny.loan_id
                ? loanById.get(txAny.loan_id)
                : null;
              const linkedInst = cls?.installment_id
                ? installmentById.get(cls.installment_id)
                : txAny.installment_id
                ? installmentById.get(txAny.installment_id)
                : null;
              const loanEvent =
                cls?.tipo_evento_emprestimo ??
                detectLoanEventFromTx({
                  loan_id: txAny.loan_id ?? null,
                  installment_id: txAny.installment_id ?? null,
                  subcategoria: txAny.subcategoria ?? null,
                  tipo: t.tipo,
                });
              return (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {new Date(t.data).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-2 py-1.5">
                    <Badge variant={t.tipo === "entrada" ? "default" : "secondary"} className="text-[10px]">
                      {t.tipo}
                    </Badge>
                  </td>
                  <td className="px-2 py-1.5 max-w-[260px] truncate" title={t.descricao ?? ""}>
                    {t.descricao || <span className="text-muted-foreground">(sem descrição)</span>}
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground">
                    {(t as any).subcategoria || (t as any).categoria_legada || "—"}
                  </td>
                  <td className="px-2 py-1.5">{cls?.natureza_id ? natById.get(cls.natureza_id)?.nome : "—"}</td>
                  <td className="px-2 py-1.5">{cls?.categoria_id ? catById.get(cls.categoria_id)?.nome : "—"}</td>
                  <td className="px-2 py-1.5">{cls?.centro_custo_id ? ccById.get(cls.centro_custo_id)?.nome : "—"}</td>
                  <td className="px-2 py-1.5">
                    {cls?.area_id
                      ? (areaById.get(cls.area_id) as any)?.nome
                      : t.area_id
                      ? (areaById.get(t.area_id) as any)?.nome
                      : "—"}
                  </td>
                  <td className="px-2 py-1.5">
                    {cls?.cycle_id
                      ? (cycleById.get(cls.cycle_id) as any)?.cultura
                      : t.cycle_id
                      ? (cycleById.get(t.cycle_id) as any)?.cultura
                      : "—"}
                  </td>
                  <td className="px-2 py-1.5">{cls?.projeto_investimento_id ? projById.get(cls.projeto_investimento_id)?.nome : "—"}</td>
                  <td className="px-2 py-1.5">
                    {linkedLoan || linkedInst ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge className="text-[10px] w-fit" variant="outline">
                          {loanEventLabel(loanEvent)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {(linkedLoan?.origem_credor || linkedInst?.loan?.origem_credor) ?? ""}
                          {linkedInst ? ` · #${linkedInst.numero_parcela}` : ""}
                        </span>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-2 py-1.5">
                    {!cls ? (
                      <Badge variant="outline" className="text-[10px]">Não classificado</Badge>
                    ) : cls.revisado ? (
                      <Badge className="text-[10px]">Revisado</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Classificado</Badge>
                    )}
                  </td>
                  <td className={`px-2 py-1.5 text-right font-medium whitespace-nowrap ${
                    t.tipo === "entrada" ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {fmt(Number(t.valor))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filtered.length > 500 && (
          <div className="p-3 text-xs text-muted-foreground">
            Exibindo os primeiros 500 — refine os filtros para ver os demais.
          </div>
        )}
      </Card>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="h-8 text-xs">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>Todos · {placeholder}</SelectItem>
        {children}
      </SelectContent>
    </Select>
  );
}

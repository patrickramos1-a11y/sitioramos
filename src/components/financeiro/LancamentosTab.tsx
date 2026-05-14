import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Pencil,
  Search,
  X,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Calendar,
} from "lucide-react";
import type { CashTransaction } from "@/hooks/useCashTransactions";
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
import { ColumnFilter } from "@/components/caixa/ColumnFilter";
import { cn } from "@/lib/utils";

const NONE = "__none__";

type SortKey =
  | "data"
  | "tipo"
  | "valor"
  | "descricao"
  | "responsavel"
  | "natureza"
  | "categoria"
  | "centro"
  | "area"
  | "ciclo"
  | "projeto"
  | "emprestimo"
  | "status";

type SortState = { key: SortKey; dir: "asc" | "desc" };

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
  const respById = useMemo(() => new Map(responsaveis.map((r: any) => [r.id, r])), [responsaveis]);
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

  // global filters
  const [q, setQ] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [editingTx, setEditingTx] = useState<CashTransaction | null>(null);

  // column filters (multi-select)
  const [fTipo, setFTipo] = useState<string[]>([]);
  const [fStatus, setFStatus] = useState<string[]>([]);
  const [fNatureza, setFNatureza] = useState<string[]>([]);
  const [fCategoria, setFCategoria] = useState<string[]>([]);
  const [fCentro, setFCentro] = useState<string[]>([]);
  const [fArea, setFArea] = useState<string[]>([]);
  const [fCiclo, setFCiclo] = useState<string[]>([]);
  const [fProjeto, setFProjeto] = useState<string[]>([]);
  const [fEmprestimo, setFEmprestimo] = useState<string[]>([]);
  const [fResp, setFResp] = useState<string[]>([]);

  // sort
  const [sort, setSort] = useState<SortState>({ key: "data", dir: "desc" });

  // build enriched rows once
  const rows = useMemo(() => {
    return txs.map((t) => {
      const cls = classifByTx.get(t.id);
      const txAny = t as any;
      const natNome = cls?.natureza_id ? natById.get(cls.natureza_id)?.nome ?? "" : "";
      const catNome = cls?.categoria_id ? catById.get(cls.categoria_id)?.nome ?? "" : "";
      const ccNome = cls?.centro_custo_id ? ccById.get(cls.centro_custo_id)?.nome ?? "" : "";
      const areaIdResolved = cls?.area_id ?? t.area_id ?? null;
      const areaNome = areaIdResolved
        ? (areaById.get(areaIdResolved) as any)?.nome ?? ""
        : "";
      const cycleIdResolved = cls?.cycle_id ?? t.cycle_id ?? null;
      const cycleNome = cycleIdResolved
        ? (cycleById.get(cycleIdResolved) as any)?.cultura ?? ""
        : "";
      const projNome = cls?.projeto_investimento_id
        ? projById.get(cls.projeto_investimento_id)?.nome ?? ""
        : "";
      const loanIdResolved = cls?.loan_id ?? txAny.loan_id ?? null;
      const linkedLoan = loanIdResolved ? loanById.get(loanIdResolved) : null;
      const linkedInst = cls?.installment_id
        ? installmentById.get(cls.installment_id)
        : txAny.installment_id
        ? installmentById.get(txAny.installment_id)
        : null;
      const loanNome = linkedLoan?.origem_credor || linkedInst?.loan?.origem_credor || "";
      const respNome = txAny.responsavel_id
        ? (respById.get(txAny.responsavel_id) as any)?.nome ?? ""
        : "";
      const status = !cls
        ? "Não classificado"
        : cls.revisado
        ? "Revisado"
        : "Classificado";
      const loanEvent =
        cls?.tipo_evento_emprestimo ??
        detectLoanEventFromTx({
          loan_id: txAny.loan_id ?? null,
          installment_id: txAny.installment_id ?? null,
          subcategoria: txAny.subcategoria ?? null,
          tipo: t.tipo,
        });

      return {
        t,
        cls,
        txAny,
        natNome,
        catNome,
        ccNome,
        areaIdResolved,
        areaNome,
        cycleIdResolved,
        cycleNome,
        projNome,
        loanIdResolved,
        loanNome,
        linkedLoan,
        linkedInst,
        loanEvent,
        respNome,
        status,
      };
    });
  }, [
    txs, classifByTx, natById, catById, ccById, areaById, cycleById,
    projById, loanById, installmentById, respById,
  ]);

  const filtered = useMemo(() => {
    const qLower = q.trim().toLowerCase();
    return rows.filter((r) => {
      const { t, cls, txAny, areaIdResolved, cycleIdResolved, loanIdResolved } = r;

      if (start && t.data < start) return false;
      if (end && t.data > end) return false;

      // column filters
      if (fTipo.length && !fTipo.includes(t.tipo)) return false;
      if (fStatus.length && !fStatus.includes(r.status)) return false;
      if (fNatureza.length && !fNatureza.includes(cls?.natureza_id ?? NONE)) return false;
      if (fCategoria.length && !fCategoria.includes(cls?.categoria_id ?? NONE)) return false;
      if (fCentro.length && !fCentro.includes(cls?.centro_custo_id ?? NONE)) return false;
      if (fArea.length && !fArea.includes(areaIdResolved ?? NONE)) return false;
      if (fCiclo.length && !fCiclo.includes(cycleIdResolved ?? NONE)) return false;
      if (fProjeto.length && !fProjeto.includes(cls?.projeto_investimento_id ?? NONE)) return false;
      if (fEmprestimo.length && !fEmprestimo.includes(loanIdResolved ?? NONE)) return false;
      if (fResp.length && !fResp.includes(txAny.responsavel_id ?? NONE)) return false;

      if (!qLower) return true;
      // global search: descrição, valor, todos os nomes
      const valorStr = Number(t.valor).toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
      });
      const valorRaw = String(t.valor);
      const haystack = [
        t.descricao ?? "",
        valorStr,
        valorRaw,
        t.tipo,
        new Date(t.data).toLocaleDateString("pt-BR"),
        txAny.subcategoria ?? "",
        txAny.categoria_legada ?? "",
        r.respNome,
        r.natNome,
        r.catNome,
        r.ccNome,
        r.areaNome,
        r.cycleNome,
        r.projNome,
        r.loanNome,
        r.status,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(qLower);
    });
  }, [
    rows, q, start, end, fTipo, fStatus, fNatureza, fCategoria, fCentro,
    fArea, fCiclo, fProjeto, fEmprestimo, fResp,
  ]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    const cmp = (a: typeof arr[number], b: typeof arr[number]) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      const get = (r: typeof arr[number]): string | number => {
        switch (sort.key) {
          case "data": return r.t.data;
          case "tipo": return r.t.tipo;
          case "valor": return Number(r.t.valor);
          case "descricao": return (r.t.descricao ?? "").toLowerCase();
          case "responsavel": return r.respNome.toLowerCase();
          case "natureza": return r.natNome.toLowerCase();
          case "categoria": return r.catNome.toLowerCase();
          case "centro": return r.ccNome.toLowerCase();
          case "area": return r.areaNome.toLowerCase();
          case "ciclo": return r.cycleNome.toLowerCase();
          case "projeto": return r.projNome.toLowerCase();
          case "emprestimo": return r.loanNome.toLowerCase();
          case "status": return r.status;
        }
      };
      const av = get(a);
      const bv = get(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    };
    arr.sort(cmp);
    return arr;
  }, [filtered, sort]);

  const fmt = (n: number) =>
    n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  // build options for column filters from current data
  const buildOpts = (
    pairs: { id: string | null | undefined; label: string }[],
    includeNone = true
  ) => {
    const seen = new Map<string, string>();
    pairs.forEach(({ id, label }) => {
      const key = id ?? NONE;
      if (!seen.has(key)) seen.set(key, label || "(vazio)");
    });
    const opts = Array.from(seen.entries()).map(([value, label]) => ({ value, label }));
    opts.sort((a, b) => a.label.localeCompare(b.label));
    if (!includeNone) return opts.filter((o) => o.value !== NONE);
    return opts;
  };

  const optTipo = [
    { value: "entrada", label: "Entrada" },
    { value: "saida", label: "Saída" },
  ];
  const optStatus = [
    { value: "Não classificado", label: "Não classificado" },
    { value: "Classificado", label: "Classificado" },
    { value: "Revisado", label: "Revisado" },
  ];
  const optNatureza = buildOpts(rows.map((r) => ({ id: r.cls?.natureza_id, label: r.natNome || "(sem natureza)" })));
  const optCategoria = buildOpts(rows.map((r) => ({ id: r.cls?.categoria_id, label: r.catNome || "(sem categoria)" })));
  const optCentro = buildOpts(rows.map((r) => ({ id: r.cls?.centro_custo_id, label: r.ccNome || "(sem centro)" })));
  const optArea = buildOpts(rows.map((r) => ({ id: r.areaIdResolved, label: r.areaNome || "(sem área)" })));
  const optCiclo = buildOpts(rows.map((r) => ({ id: r.cycleIdResolved, label: r.cycleNome || "(sem ciclo)" })));
  const optProjeto = buildOpts(rows.map((r) => ({ id: r.cls?.projeto_investimento_id, label: r.projNome || "(sem projeto)" })));
  const optEmprestimo = buildOpts(rows.map((r) => ({ id: r.loanIdResolved, label: r.loanNome || "(sem empréstimo)" })));
  const optResp = buildOpts(rows.map((r) => ({ id: r.txAny.responsavel_id, label: r.respNome || "(sem responsável)" })));

  const activeFilterCount =
    (q ? 1 : 0) +
    (start ? 1 : 0) +
    (end ? 1 : 0) +
    fTipo.length + fStatus.length + fNatureza.length + fCategoria.length +
    fCentro.length + fArea.length + fCiclo.length + fProjeto.length +
    fEmprestimo.length + fResp.length;

  const clearAll = () => {
    setQ(""); setStart(""); setEnd("");
    setFTipo([]); setFStatus([]); setFNatureza([]); setFCategoria([]);
    setFCentro([]); setFArea([]); setFCiclo([]); setFProjeto([]);
    setFEmprestimo([]); setFResp([]);
  };

  const toggleSort = (key: SortKey) => {
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" }
    );
  };

  if (isLoading)
    return <p className="text-sm text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-3">
      {/* Search bar */}
      <Card className="p-4 bg-gradient-to-br from-primary/5 via-background to-accent/5 border-primary/20 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por descrição, valor, categoria, área, responsável..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="h-10 pl-9 pr-9 bg-background/80 border-primary/20 focus-visible:ring-primary/30"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Limpar busca"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="h-10 w-[150px] pl-8 bg-background/80"
                title="Data inicial"
              />
            </div>
            <span className="text-muted-foreground text-sm">→</span>
            <div className="relative">
              <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="h-10 w-[150px] pl-8 bg-background/80"
                title="Data final"
              />
            </div>
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="h-10 text-xs gap-1"
            >
              <X className="h-3.5 w-3.5" />
              Limpar ({activeFilterCount})
            </Button>
          )}
        </div>
      </Card>

      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{sorted.length}</span> de {txs.length} lançamentos
        </div>
        <NovoLancamentoDialog />
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/60 text-left sticky top-0">
            <tr>
              <th className="px-2 py-2 w-10"></th>
              <SortHeader label="Data" k="data" sort={sort} onSort={toggleSort} />
              <ThWithFilter
                label="Tipo" k="tipo" sort={sort} onSort={toggleSort}
                options={optTipo} selected={fTipo} onChange={setFTipo}
              />
              <SortHeader label="Valor" k="valor" sort={sort} onSort={toggleSort} align="right" />
              <SortHeader label="Descrição" k="descricao" sort={sort} onSort={toggleSort} />
              <ThWithFilter
                label="Responsável" k="responsavel" sort={sort} onSort={toggleSort}
                options={optResp} selected={fResp} onChange={setFResp}
              />
              <th className="px-2 py-2 text-muted-foreground">Cat. antiga</th>
              <ThWithFilter
                label="Natureza" k="natureza" sort={sort} onSort={toggleSort}
                options={optNatureza} selected={fNatureza} onChange={setFNatureza}
              />
              <ThWithFilter
                label="Categoria" k="categoria" sort={sort} onSort={toggleSort}
                options={optCategoria} selected={fCategoria} onChange={setFCategoria}
              />
              <ThWithFilter
                label="Centro custo" k="centro" sort={sort} onSort={toggleSort}
                options={optCentro} selected={fCentro} onChange={setFCentro}
              />
              <ThWithFilter
                label="Área" k="area" sort={sort} onSort={toggleSort}
                options={optArea} selected={fArea} onChange={setFArea}
              />
              <ThWithFilter
                label="Ciclo" k="ciclo" sort={sort} onSort={toggleSort}
                options={optCiclo} selected={fCiclo} onChange={setFCiclo}
              />
              <ThWithFilter
                label="Projeto" k="projeto" sort={sort} onSort={toggleSort}
                options={optProjeto} selected={fProjeto} onChange={setFProjeto}
              />
              <ThWithFilter
                label="Empréstimo" k="emprestimo" sort={sort} onSort={toggleSort}
                options={optEmprestimo} selected={fEmprestimo} onChange={setFEmprestimo}
              />
              <ThWithFilter
                label="Status" k="status" sort={sort} onSort={toggleSort}
                options={optStatus} selected={fStatus} onChange={setFStatus}
              />
            </tr>
          </thead>
          <tbody className="divide-y">
            {sorted.slice(0, 500).map((r) => {
              const { t, cls, linkedLoan, linkedInst, loanEvent } = r;
              return (
                <tr key={t.id} className="hover:bg-muted/30">
                  <td className="px-2 py-1.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => setEditingTx(t as CashTransaction)}
                      title="Editar lançamento"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {new Date(t.data).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-2 py-1.5">
                    <Badge variant={t.tipo === "entrada" ? "default" : "secondary"} className="text-[10px]">
                      {t.tipo}
                    </Badge>
                  </td>
                  <td className={`px-2 py-1.5 text-right font-medium whitespace-nowrap ${
                    t.tipo === "entrada" ? "text-emerald-600" : "text-rose-600"
                  }`}>
                    {fmt(Number(t.valor))}
                  </td>
                  <td className="px-2 py-1.5 max-w-[260px] truncate" title={t.descricao ?? ""}>
                    {t.descricao || <span className="text-muted-foreground">(sem descrição)</span>}
                  </td>
                  <td className="px-2 py-1.5">
                    {(() => {
                      const respId = (t as any).responsavel_id;
                      const rp = respId ? respById.get(respId) : null;
                      return rp ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: (rp as any).cor }} />
                          {(rp as any).nome}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>;
                    })()}
                  </td>
                  <td className="px-2 py-1.5 text-muted-foreground">
                    {(t as any).subcategoria || (t as any).categoria_legada || "—"}
                  </td>
                  <td className="px-2 py-1.5">{r.natNome || "—"}</td>
                  <td className="px-2 py-1.5">{r.catNome || "—"}</td>
                  <td className="px-2 py-1.5">{r.ccNome || "—"}</td>
                  <td className="px-2 py-1.5">{r.areaNome || "—"}</td>
                  <td className="px-2 py-1.5">{r.cycleNome || "—"}</td>
                  <td className="px-2 py-1.5">{r.projNome || "—"}</td>
                  <td className="px-2 py-1.5">
                    {linkedLoan || linkedInst ? (
                      <div className="flex flex-col gap-0.5">
                        <Badge className="text-[10px] w-fit" variant="outline">
                          {loanEventLabel(loanEvent)}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground">
                          {r.loanNome}
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
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length > 500 && (
          <div className="p-3 text-xs text-muted-foreground">
            Exibindo os primeiros 500 — refine os filtros para ver os demais.
          </div>
        )}
        {sorted.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">
            Nenhum lançamento encontrado com os filtros atuais.
          </div>
        )}
      </Card>

      <NovoLancamentoDialog
        open={!!editingTx}
        onOpenChange={(v) => !v && setEditingTx(null)}
        transaction={editingTx}
      />
    </div>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active) return <ArrowUpDown className="h-3 w-3 opacity-40" />;
  return dir === "asc"
    ? <ArrowUp className="h-3 w-3 text-primary" />
    : <ArrowDown className="h-3 w-3 text-primary" />;
}

function SortHeader({
  label, k, sort, onSort, align = "left",
}: {
  label: string;
  k: SortKey;
  sort: SortState;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const active = sort.key === k;
  return (
    <th className={cn("px-2 py-2", align === "right" && "text-right")}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1 hover:text-foreground transition-colors",
          align === "right" && "ml-auto",
          active ? "text-foreground font-semibold" : "text-muted-foreground"
        )}
      >
        {label}
        <SortIcon active={active} dir={sort.dir} />
      </button>
    </th>
  );
}

function ThWithFilter({
  label, k, sort, onSort, options, selected, onChange,
}: {
  label: string;
  k: SortKey;
  sort: SortState;
  onSort: (k: SortKey) => void;
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const active = sort.key === k;
  return (
    <th className="px-2 py-2">
      <div className="inline-flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onSort(k)}
          className={cn(
            "inline-flex items-center gap-1 hover:text-foreground transition-colors",
            active ? "text-foreground font-semibold" : "text-muted-foreground"
          )}
        >
          {label}
          <SortIcon active={active} dir={sort.dir} />
        </button>
        <ColumnFilter
          options={options}
          selected={selected}
          onChange={onChange}
          searchable
        />
      </div>
    </th>
  );
}

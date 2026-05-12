import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Trash2,
  Wallet,
  User,
  Pencil,
  Layers,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  cashCategoryConfig,
  CashCategory,
} from "@/lib/categoryConfig";
import { CashTransaction } from "@/hooks/useCashTransactions";
import { ColumnFilter } from "./ColumnFilter";
import {
  PeriodFilter,
  PeriodPreset,
  getPeriodRange,
} from "./PeriodFilter";

interface AreaOption {
  id: string;
  nome: string;
}

interface Props {
  transactions: CashTransaction[];
  areas: AreaOption[];
  onDelete: (id: string) => void;
  onEdit?: (t: CashTransaction) => void;
  onBulkEdit?: (ids: string[]) => void;
}

type SortKey = "data" | "valor" | "categoria" | "tipo" | "area" | "contato";
type SortDir = "asc" | "desc";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

export function CashTransactionsTable({
  transactions,
  areas,
  onDelete,
  onEdit,
  onBulkEdit,
}: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [period, setPeriod] = useState<PeriodPreset>("tudo");
  const [tipoSel, setTipoSel] = useState<string[]>([]);
  const [catSel, setCatSel] = useState<string[]>([]);
  const [areaSel, setAreaSel] = useState<string[]>([]);
  const [contatoSel, setContatoSel] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("data");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const periodRange = useMemo(() => getPeriodRange(period), [period]);

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (periodRange.start) list = list.filter((t) => t.data >= periodRange.start!);
    if (periodRange.end) list = list.filter((t) => t.data <= periodRange.end!);
    if (tipoSel.length) list = list.filter((t) => tipoSel.includes(t.tipo));
    if (catSel.length) list = list.filter((t) => catSel.includes(t.categoria));
    if (areaSel.length)
      list = list.filter((t) =>
        areaSel.includes(t.area_id || "__none__"),
      );
    if (contatoSel.length)
      list = list.filter((t) =>
        contatoSel.includes((t as any).contato_id || "__none__"),
      );

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.descricao?.toLowerCase().includes(q) ||
          t.observacoes?.toLowerCase().includes(q) ||
          t.areas?.nome?.toLowerCase().includes(q) ||
          (t as any).contatos?.nome?.toLowerCase().includes(q) ||
          cashCategoryConfig[t.categoria]?.label.toLowerCase().includes(q),
      );
    }

    list.sort((a, b) => {
      let av: any;
      let bv: any;
      switch (sortKey) {
        case "data":
          av = a.data;
          bv = b.data;
          break;
        case "valor":
          av = Number(a.valor);
          bv = Number(b.valor);
          break;
        case "categoria":
          av = cashCategoryConfig[a.categoria]?.label || a.categoria;
          bv = cashCategoryConfig[b.categoria]?.label || b.categoria;
          break;
        case "tipo":
          av = a.tipo;
          bv = b.tipo;
          break;
        case "area":
          av = a.areas?.nome || "";
          bv = b.areas?.nome || "";
          break;
        case "contato":
          av = (a as any).contatos?.nome || "";
          bv = (b as any).contatos?.nome || "";
          break;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [
    transactions,
    periodRange,
    tipoSel,
    catSel,
    areaSel,
    contatoSel,
    search,
    sortKey,
    sortDir,
  ]);

  const totals = useMemo(() => {
    const entradas = filtered
      .filter((t) => t.tipo === "entrada")
      .reduce((sum, t) => sum + Number(t.valor), 0);
    const saidas = filtered
      .filter((t) => t.tipo === "saida")
      .reduce((sum, t) => sum + Number(t.valor), 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [filtered]);

  const tipoOptions = [
    { value: "entrada", label: "Entrada" },
    { value: "saida", label: "Saída" },
  ];

  const categoriaOptions = useMemo(() => {
    const seen = new Set<string>();
    transactions.forEach((t) => seen.add(t.categoria));
    return Array.from(seen).map((c) => ({
      value: c,
      label: cashCategoryConfig[c as CashCategory]?.label || c,
    }));
  }, [transactions]);

  const areaOptions = useMemo(() => {
    const seen = new Map<string, string>();
    transactions.forEach((t) =>
      seen.set(t.area_id || "__none__", t.areas?.nome || "Sem área"),
    );
    return Array.from(seen.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [transactions]);

  const contatoOptions = useMemo(() => {
    const seen = new Map<string, string>();
    transactions.forEach((t) => {
      const id = (t as any).contato_id || "__none__";
      const nome = (t as any).contatos?.nome || "Sem contato";
      seen.set(id, nome);
    });
    return Array.from(seen.entries()).map(([value, label]) => ({
      value,
      label,
    }));
  }, [transactions]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ k }: { k: SortKey }) =>
    sortKey !== k ? (
      <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-40" />
    ) : sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 inline" />
    );

  return (
    <div className="space-y-4">
      {/* Toolbar simples: busca + período */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por descrição, área, contato..."
            className="pl-9 h-9"
          />
        </div>
        <PeriodFilter value={period} onChange={setPeriod} />
      </div>

      {/* Totais filtrados */}
      <div className="grid gap-2 grid-cols-3">
        <Card className="bg-success/5 border-success/30">
          <CardContent className="p-2 md:p-3">
            <div className="text-[10px] md:text-xs text-muted-foreground">Entradas</div>
            <div className="text-sm md:text-lg font-bold text-success leading-tight truncate">
              {formatCurrency(totals.entradas)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/30">
          <CardContent className="p-2 md:p-3">
            <div className="text-[10px] md:text-xs text-muted-foreground">Saídas</div>
            <div className="text-sm md:text-lg font-bold text-destructive leading-tight truncate">
              {formatCurrency(totals.saidas)}
            </div>
          </CardContent>
        </Card>
        <Card
          className={
            totals.saldo >= 0
              ? "bg-success/5 border-success/30"
              : "bg-destructive/5 border-destructive/30"
          }
        >
          <CardContent className="p-2 md:p-3">
            <div className="text-[10px] md:text-xs text-muted-foreground">Saldo</div>
            <div
              className={`text-sm md:text-lg font-bold leading-tight truncate ${
                totals.saldo >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {formatCurrency(totals.saldo)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between gap-2 p-4 border-b flex-wrap">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <span className="font-medium">Histórico de Movimentações</span>
              <Badge variant="secondary">
                {filtered.length} de {transactions.length}
              </Badge>
            </div>
            {selected.size > 0 && (
              <div className="flex items-center gap-2">
                <Badge>{selected.size} selecionada(s)</Badge>
                {onBulkEdit && (
                  <Button size="sm" variant="outline" onClick={() => onBulkEdit(Array.from(selected))} className="gap-1">
                    <Layers className="h-4 w-4" /> Editar em massa
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-3">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium">Nenhuma movimentação encontrada</h3>
              <p className="text-sm text-muted-foreground">
                Ajuste os filtros para ver outros resultados.
              </p>
            </div>
          ) : (
            <>
              {/* Mobile: card list */}
              <ul className="md:hidden divide-y">
                {filtered.map((t) => {
                  const c = cashCategoryConfig[t.categoria];
                  const Icon = c?.icon || Wallet;
                  const contato = (t as any).contatos as { nome: string } | null;
                  return (
                    <li key={t.id} className="p-3 flex gap-3 active:bg-muted/40">
                      <div
                        className={`rounded-xl p-2.5 h-fit ${
                          c?.bgColor || "bg-muted"
                        }`}
                      >
                        <Icon
                          className={`h-5 w-5 ${
                            c?.color || "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">
                              {c?.label || t.categoria}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {t.descricao || "Sem descrição"}
                            </p>
                          </div>
                          <div
                            className={`text-sm font-semibold whitespace-nowrap ${
                              t.tipo === "entrada"
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          >
                            {t.tipo === "entrada" ? "+" : "-"}
                            {formatCurrency(Number(t.valor))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap text-[11px] text-muted-foreground">
                          <span>
                            {format(new Date(t.data), "dd/MM/yy", {
                              locale: ptBR,
                            })}
                          </span>
                          {t.areas?.nome && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[100px]">
                                {t.areas.nome}
                              </span>
                            </>
                          )}
                          {contato && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 truncate max-w-[100px]">
                                <User className="h-3 w-3" />
                                {contato.nome}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => onDelete(t.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  );
                })}
              </ul>

              {/* Desktop: table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => toggleSort("data")}
                      >
                        Data <SortIcon k="data" />
                      </TableHead>
                      <TableHead>
                        <span
                          className="cursor-pointer select-none"
                          onClick={() => toggleSort("tipo")}
                        >
                          Tipo <SortIcon k="tipo" />
                        </span>
                        <ColumnFilter
                          options={tipoOptions}
                          selected={tipoSel}
                          onChange={setTipoSel}
                        />
                      </TableHead>
                      <TableHead>
                        <span
                          className="cursor-pointer select-none"
                          onClick={() => toggleSort("categoria")}
                        >
                          Categoria <SortIcon k="categoria" />
                        </span>
                        <ColumnFilter
                          options={categoriaOptions}
                          selected={catSel}
                          onChange={setCatSel}
                          searchable
                        />
                      </TableHead>
                      <TableHead>
                        <span
                          className="cursor-pointer select-none"
                          onClick={() => toggleSort("area")}
                        >
                          Área <SortIcon k="area" />
                        </span>
                        <ColumnFilter
                          options={areaOptions}
                          selected={areaSel}
                          onChange={setAreaSel}
                          searchable
                        />
                      </TableHead>
                      <TableHead>
                        <span
                          className="cursor-pointer select-none"
                          onClick={() => toggleSort("contato")}
                        >
                          Contato <SortIcon k="contato" />
                        </span>
                        <ColumnFilter
                          options={contatoOptions}
                          selected={contatoSel}
                          onChange={setContatoSel}
                          searchable
                        />
                      </TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead
                        className="text-right cursor-pointer select-none"
                        onClick={() => toggleSort("valor")}
                      >
                        Valor <SortIcon k="valor" />
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((t) => {
                      const c = cashCategoryConfig[t.categoria];
                      const Icon = c?.icon || Wallet;
                      const contato = (t as any).contatos as
                        | { nome: string }
                        | null;
                      return (
                        <TableRow key={t.id}>
                          <TableCell>
                            {format(new Date(t.data), "dd/MM/yyyy", {
                              locale: ptBR,
                            })}
                          </TableCell>
                          <TableCell>
                            {t.tipo === "entrada" ? (
                              <Badge className="bg-success/20 text-success hover:bg-success/30 border-0">
                                <ArrowUpCircle className="h-3 w-3 mr-1" />
                                Entrada
                              </Badge>
                            ) : (
                              <Badge className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-0">
                                <ArrowDownCircle className="h-3 w-3 mr-1" />
                                Saída
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div
                                className={`rounded-md p-1.5 ${
                                  c?.bgColor || "bg-muted"
                                }`}
                              >
                                <Icon
                                  className={`h-3.5 w-3.5 ${
                                    c?.color || "text-muted-foreground"
                                  }`}
                                />
                              </div>
                              <span className="text-sm">
                                {c?.label || t.categoria}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {t.areas?.nome || (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {contato ? (
                              <div className="flex items-center gap-1.5 text-sm">
                                <User className="h-3.5 w-3.5 text-muted-foreground" />
                                {contato.nome}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="max-w-[220px] truncate">
                            {t.descricao || "-"}
                          </TableCell>
                          <TableCell
                            className={`text-right font-medium ${
                              t.tipo === "entrada"
                                ? "text-success"
                                : "text-destructive"
                            }`}
                          >
                            {t.tipo === "entrada" ? "+" : "-"}
                            {formatCurrency(Number(t.valor))}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => onDelete(t.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

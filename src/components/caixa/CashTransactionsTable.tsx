import { useMemo, useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  Search,
  Trash2,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  cashCategoryConfig,
  CashCategory,
} from "@/lib/categoryConfig";
import { CashTransaction } from "@/hooks/useCashTransactions";

interface AreaOption {
  id: string;
  nome: string;
}

interface CycleOption {
  id: string;
  cultura: string;
  area_id: string;
}

interface Props {
  transactions: CashTransaction[];
  areas: AreaOption[];
  cycles: CycleOption[];
  onDelete: (id: string) => void;
}

type SortKey = "data" | "valor" | "categoria" | "tipo" | "area";
type SortDir = "asc" | "desc";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const ALL = "__all__";

export function CashTransactionsTable({
  transactions,
  areas,
  cycles,
  onDelete,
}: Props) {
  const [search, setSearch] = useState("");
  const [tipoFilter, setTipoFilter] = useState<string>(ALL);
  const [categoriaFilter, setCategoriaFilter] = useState<string>(ALL);
  const [areaFilter, setAreaFilter] = useState<string>(ALL);
  const [cycleFilter, setCycleFilter] = useState<string>(ALL);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("data");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const availableCycles = useMemo(
    () =>
      areaFilter !== ALL
        ? cycles.filter((c) => c.area_id === areaFilter)
        : cycles,
    [cycles, areaFilter],
  );

  const filtered = useMemo(() => {
    let list = [...transactions];

    if (tipoFilter !== ALL) list = list.filter((t) => t.tipo === tipoFilter);
    if (categoriaFilter !== ALL)
      list = list.filter((t) => t.categoria === categoriaFilter);
    if (areaFilter !== ALL)
      list = list.filter((t) => t.area_id === areaFilter);
    if (cycleFilter !== ALL)
      list = list.filter((t) => t.cycle_id === cycleFilter);
    if (startDate) list = list.filter((t) => t.data >= startDate);
    if (endDate) list = list.filter((t) => t.data <= endDate);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.descricao?.toLowerCase().includes(q) ||
          t.observacoes?.toLowerCase().includes(q) ||
          t.areas?.nome?.toLowerCase().includes(q) ||
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
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [
    transactions,
    tipoFilter,
    categoriaFilter,
    areaFilter,
    cycleFilter,
    startDate,
    endDate,
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

  const breakdownByCategoria = useMemo(() => {
    const map = new Map<CashCategory, number>();
    filtered.forEach((t) => {
      const sign = t.tipo === "entrada" ? 1 : -1;
      map.set(
        t.categoria,
        (map.get(t.categoria) || 0) + sign * Number(t.valor),
      );
    });
    return Array.from(map.entries())
      .map(([cat, total]) => ({ cat, total }))
      .sort((a, b) => Math.abs(b.total) - Math.abs(a.total));
  }, [filtered]);

  const breakdownByArea = useMemo(() => {
    const map = new Map<string, { nome: string; total: number }>();
    filtered.forEach((t) => {
      const id = t.area_id || "sem-area";
      const nome = t.areas?.nome || "Sem área";
      const sign = t.tipo === "entrada" ? 1 : -1;
      const prev = map.get(id) || { nome, total: 0 };
      prev.total += sign * Number(t.valor);
      map.set(id, prev);
    });
    return Array.from(map.values()).sort(
      (a, b) => Math.abs(b.total) - Math.abs(a.total),
    );
  }, [filtered]);

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
      <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-50" />
    ) : sortDir === "asc" ? (
      <ArrowUp className="ml-1 h-3 w-3 inline" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 inline" />
    );

  const hasActiveFilters =
    search ||
    tipoFilter !== ALL ||
    categoriaFilter !== ALL ||
    areaFilter !== ALL ||
    cycleFilter !== ALL ||
    startDate ||
    endDate;

  const clearAll = () => {
    setSearch("");
    setTipoFilter(ALL);
    setCategoriaFilter(ALL);
    setAreaFilter(ALL);
    setCycleFilter(ALL);
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-4">
      {/* Filters card */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="h-4 w-4" />
              Filtros
            </div>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="h-8 text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Descrição, área..."
                  className="pl-8 h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  <SelectItem value="entrada">Entradas</SelectItem>
                  <SelectItem value="saida">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select
                value={categoriaFilter}
                onValueChange={setCategoriaFilter}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {Object.entries(cashCategoryConfig).map(([key, c]) => (
                    <SelectItem key={key} value={key}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Área</Label>
              <Select
                value={areaFilter}
                onValueChange={(v) => {
                  setAreaFilter(v);
                  setCycleFilter(ALL);
                }}
              >
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todas</SelectItem>
                  {areas.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Ciclo</Label>
              <Select value={cycleFilter} onValueChange={setCycleFilter}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL}>Todos</SelectItem>
                  {availableCycles.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.cultura}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">De</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Até</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtered totals */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="bg-success/5 border-success/30">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              Entradas (filtrado)
            </div>
            <div className="text-xl font-bold text-success">
              {formatCurrency(totals.entradas)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/30">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              Saídas (filtrado)
            </div>
            <div className="text-xl font-bold text-destructive">
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
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">
              Saldo (filtrado)
            </div>
            <div
              className={`text-xl font-bold ${
                totals.saldo >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {formatCurrency(totals.saldo)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown */}
      {filtered.length > 0 && (
        <div className="grid gap-3 md:grid-cols-2">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium mb-3">
                Por categoria
              </div>
              <div className="space-y-2 max-h-48 overflow-auto">
                {breakdownByCategoria.map(({ cat, total }) => {
                  const c = cashCategoryConfig[cat];
                  const Icon = c?.icon || Wallet;
                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`rounded-md p-1 ${
                            c?.bgColor || "bg-muted"
                          }`}
                        >
                          <Icon
                            className={`h-3 w-3 ${
                              c?.color || "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <span>{c?.label || cat}</span>
                      </div>
                      <span
                        className={`font-medium ${
                          total >= 0 ? "text-success" : "text-destructive"
                        }`}
                      >
                        {formatCurrency(total)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium mb-3">Por área</div>
              <div className="space-y-2 max-h-48 overflow-auto">
                {breakdownByArea.map((row) => (
                  <div
                    key={row.nome}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{row.nome}</span>
                    <span
                      className={`font-medium ${
                        row.total >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {formatCurrency(row.total)}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              <span className="font-medium">Histórico de Movimentações</span>
              <Badge variant="secondary">
                {filtered.length} de {transactions.length}
              </Badge>
            </div>
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("data")}
                  >
                    Data <SortIcon k="data" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("tipo")}
                  >
                    Tipo <SortIcon k="tipo" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("categoria")}
                  >
                    Categoria <SortIcon k="categoria" />
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("area")}
                  >
                    Área <SortIcon k="area" />
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
                      <TableCell className="max-w-[240px] truncate">
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}

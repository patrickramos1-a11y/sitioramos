import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Wallet, Plus, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, Banknote, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCashTransactions, CashTransactionInsert, CashFilters } from "@/hooks/useCashTransactions";
import { useAreas } from "@/hooks/useAreas";
import { useLoans } from "@/hooks/useLoans";
import { useCycles } from "@/hooks/useCycles";
import { cashCategoryConfig, CashCategory } from "@/lib/categoryConfig";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const categoriaOptions = Object.entries(cashCategoryConfig).map(([value, config]) => ({
  value: value as CashCategory,
  label: config.label,
  tipo: config.tipo,
  icon: config.icon,
  color: config.color,
  bgColor: config.bgColor,
}));

export default function Caixa() {
  const [filters, setFilters] = useState<CashFilters>({});
  const { transactions, balance, filteredTotals, isLoading, createTransaction, deleteTransaction } = useCashTransactions(filters);
  const { areas } = useAreas();
  const { loans } = useLoans();
  const { cycles } = useCycles();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split("T")[0],
    categoria: "" as CashCategory | "",
    valor: "",
    descricao: "",
    loan_id: "",
    area_id: "",
    cycle_id: "",
    observacoes: "",
  });

  const saldoAtual = balance?.saldo_atual || 0;
  const hasFilters = filters.categoria || filters.areaId || filters.cycleId || filters.tipo;

  const handleSubmit = () => {
    if (!formData.categoria || !formData.valor) return;

    const categoriaInfo = cashCategoryConfig[formData.categoria as CashCategory];
    const tipo = categoriaInfo?.tipo || "saida";

    createTransaction.mutate({
      data: formData.data,
      tipo: tipo,
      categoria: formData.categoria as CashCategory,
      valor: Number(formData.valor),
      descricao: formData.descricao || null,
      loan_id: formData.loan_id || null,
      area_id: formData.area_id || null,
      cycle_id: formData.cycle_id || null,
      observacoes: formData.observacoes || null,
    });

    setFormOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      data: new Date().toISOString().split("T")[0],
      categoria: "",
      valor: "",
      descricao: "",
      loan_id: "",
      area_id: "",
      cycle_id: "",
      observacoes: "",
    });
  };

  const handleDeleteClick = (id: string) => {
    setTransactionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      deleteTransaction.mutate(transactionToDelete);
    }
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
  };

  const clearFilters = () => {
    setFilters({});
  };

  // Get available cycles for selected area
  const availableCycles = formData.area_id
    ? cycles.filter(c => c.area_id === formData.area_id)
    : cycles;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
            <p className="text-muted-foreground">
              Base financeira única - todas as movimentações
            </p>
          </div>
          <Button className="gap-2" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className={saldoAtual >= 0 ? "border-success/50 bg-success/5" : "border-destructive/50 bg-destructive/5"}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              <Banknote className={`h-5 w-5 ${saldoAtual >= 0 ? "text-success" : "text-destructive"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${saldoAtual >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(saldoAtual)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Calculado a partir de todas as movimentações
              </p>
            </CardContent>
          </Card>

          <Card className="bg-success/5 border-success/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {hasFilters ? "Entradas (filtrado)" : "Total Entradas"}
              </CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(hasFilters ? filteredTotals.totalEntradas : (balance?.total_entradas || 0))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-destructive/5 border-destructive/30">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">
                {hasFilters ? "Saídas (filtrado)" : "Total Saídas"}
              </CardTitle>
              <TrendingDown className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(hasFilters ? filteredTotals.totalSaidas : (balance?.total_saidas || 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtros
              </CardTitle>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
                  <X className="h-4 w-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={filters.tipo || "all"}
                  onValueChange={(value) => setFilters(f => ({ ...f, tipo: value === "all" ? undefined : value as "entrada" | "saida" }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="entrada">Entradas</SelectItem>
                    <SelectItem value="saida">Saídas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={filters.categoria || "all"}
                  onValueChange={(value) => setFilters(f => ({ ...f, categoria: value === "all" ? undefined : value as CashCategory }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categoriaOptions.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Área</Label>
                <Select
                  value={filters.areaId || "all"}
                  onValueChange={(value) => setFilters(f => ({ ...f, areaId: value === "all" ? undefined : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as áreas</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Ciclo</Label>
                <Select
                  value={filters.cycleId || "all"}
                  onValueChange={(value) => setFilters(f => ({ ...f, cycleId: value === "all" ? undefined : value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os ciclos</SelectItem>
                    {cycles.map((cycle: any) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.cultura} - {cycle.areas?.nome || "Área"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : transactions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Wallet className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">
                {hasFilters ? "Nenhuma movimentação encontrada" : "Nenhuma movimentação"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {hasFilters ? "Tente ajustar os filtros." : "Registre sua primeira movimentação de caixa."}
              </p>
              {!hasFilters && (
                <Button onClick={() => setFormOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Nova Movimentação
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Histórico de Movimentações
                <Badge variant="secondary" className="ml-2">
                  {transactions.length} registro{transactions.length !== 1 ? "s" : ""}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Área</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const categoryConfig = cashCategoryConfig[transaction.categoria];
                    const IconComponent = categoryConfig?.icon || Wallet;
                    
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {format(new Date(transaction.data), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          {transaction.tipo === "entrada" ? (
                            <Badge variant="default" className="bg-success/20 text-success hover:bg-success/30 border-0">
                              <ArrowUpCircle className="h-3 w-3 mr-1" />
                              Entrada
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-destructive/20 text-destructive hover:bg-destructive/30 border-0">
                              <ArrowDownCircle className="h-3 w-3 mr-1" />
                              Saída
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`rounded-md p-1.5 ${categoryConfig?.bgColor || 'bg-muted'}`}>
                              <IconComponent className={`h-3.5 w-3.5 ${categoryConfig?.color || 'text-muted-foreground'}`} />
                            </div>
                            <span className="text-sm">{categoryConfig?.label || transaction.categoria}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {transaction.areas?.nome || (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.descricao || "-"}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${transaction.tipo === "entrada" ? "text-success" : "text-destructive"}`}>
                          {transaction.tipo === "entrada" ? "+" : "-"}{formatCurrency(Number(transaction.valor))}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => handleDeleteClick(transaction.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nova Movimentação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="data">Data</Label>
                <Input
                  id="data"
                  type="date"
                  value={formData.data}
                  onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0,00"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoria">Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value as CashCategory })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__header_entrada__" disabled className="font-bold text-success">
                    ── ENTRADAS ──
                  </SelectItem>
                  {categoriaOptions
                    .filter(c => c.tipo === "entrada")
                    .map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${cat.color}`} />
                            {cat.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  <SelectItem value="__header_saida__" disabled className="font-bold text-destructive">
                    ── SAÍDAS ──
                  </SelectItem>
                  {categoriaOptions
                    .filter(c => c.tipo === "saida")
                    .map((cat) => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`h-4 w-4 ${cat.color}`} />
                            {cat.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                placeholder="Ex: Parcela 3/12 Banco do Brasil"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="area_id">Área (opcional)</Label>
                <Select
                  value={formData.area_id || "__none__"}
                  onValueChange={(value) => setFormData({ 
                    ...formData, 
                    area_id: value === "__none__" ? "" : value,
                    cycle_id: value === "__none__" ? "" : formData.cycle_id
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    {areas.map((area) => (
                      <SelectItem key={area.id} value={area.id}>
                        {area.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="cycle_id">Ciclo (opcional)</Label>
                <Select
                  value={formData.cycle_id || "__none__"}
                  onValueChange={(value) => setFormData({ ...formData, cycle_id: value === "__none__" ? "" : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {availableCycles.map((cycle: any) => (
                      <SelectItem key={cycle.id} value={cycle.id}>
                        {cycle.cultura}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="loan_id">Empréstimo (opcional)</Label>
              <Select
                value={formData.loan_id || "__none__"}
                onValueChange={(value) => setFormData({ ...formData, loan_id: value === "__none__" ? "" : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {loans.map((loan: any) => (
                    <SelectItem key={loan.id} value={loan.id}>
                      {loan.origem_credor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                placeholder="Observações adicionais..."
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.categoria || !formData.valor || createTransaction.isPending}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir movimentação?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A movimentação será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}

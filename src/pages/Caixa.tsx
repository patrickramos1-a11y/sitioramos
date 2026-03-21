import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Wallet, Plus, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, Banknote, Filter, X, DollarSign, FileText, Trash2, MoreVertical, Pencil } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCashTransactions, CashTransactionInsert, CashFilters } from "@/hooks/useCashTransactions";
import { useCosts, Cost, CostInsert } from "@/hooks/useCosts";
import { useInvestments, Investment, InvestmentInsert } from "@/hooks/useInvestments";
import { useRevenues, Revenue, RevenueInsert } from "@/hooks/useRevenues";
import { useAreas } from "@/hooks/useAreas";
import { useLoans } from "@/hooks/useLoans";
import { useCycles } from "@/hooks/useCycles";
import { cashCategoryConfig, CashCategory, costTypeConfig, investmentTypeConfig } from "@/lib/categoryConfig";
import { CostForm } from "@/components/costs/CostForm";
import { InvestmentForm } from "@/components/investments/InvestmentForm";
import { RevenueForm } from "@/components/revenues/RevenueForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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

const unidadeLabels: Record<string, string> = {
  kg: "kg",
  saca: "saca(s)",
  unidade: "un.",
  tonelada: "t",
};

export default function Caixa() {
  const [searchParams, setSearchParams] = useSearchParams();
  const areaFromUrl = searchParams.get("area");
  const tabFromUrl = searchParams.get("tab") || "todos";
  
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [filters, setFilters] = useState<CashFilters>(() => ({
    areaId: areaFromUrl || undefined,
  }));
  const { transactions, balance, filteredTotals, isLoading, createTransaction, deleteTransaction } = useCashTransactions(filters);
  const { costs, createCost, updateCost, deleteCost } = useCosts();
  const { investments, createInvestment, updateInvestment, deleteInvestment } = useInvestments();
  const { revenues, createRevenue, updateRevenue, deleteRevenue } = useRevenues();
  const { areas } = useAreas();
  const { loans } = useLoans();
  const { cycles } = useCycles();
  
  // Form states
  const [formOpen, setFormOpen] = useState(false);
  const [costFormOpen, setCostFormOpen] = useState(false);
  const [investmentFormOpen, setInvestmentFormOpen] = useState(false);
  const [revenueFormOpen, setRevenueFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [deleteType, setDeleteType] = useState<"transaction" | "cost" | "investment" | "revenue">("transaction");
  const [itemToDelete, setItemToDelete] = useState<any>(null);

  // Form state for direct cash entry
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

  // Sync URL params with tab
  useEffect(() => {
    if (tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const newParams = new URLSearchParams(searchParams);
    if (value === "todos") {
      newParams.delete("tab");
    } else {
      newParams.set("tab", value);
    }
    setSearchParams(newParams);
  };

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

  const handleDeleteClick = (id: string, type: "transaction" | "cost" | "investment" | "revenue" = "transaction", item?: any) => {
    setTransactionToDelete(id);
    setDeleteType(type);
    setItemToDelete(item);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (transactionToDelete) {
      if (deleteType === "transaction") {
        deleteTransaction.mutate(transactionToDelete);
      } else if (deleteType === "cost") {
        deleteCost.mutate(transactionToDelete);
      } else if (deleteType === "investment") {
        deleteInvestment.mutate(transactionToDelete);
      } else if (deleteType === "revenue") {
        deleteRevenue.mutate(transactionToDelete);
      }
    }
    setDeleteDialogOpen(false);
    setTransactionToDelete(null);
    setItemToDelete(null);
  };

  const clearFilters = () => {
    setFilters({});
    const newParams = new URLSearchParams();
    if (activeTab !== "todos") {
      newParams.set("tab", activeTab);
    }
    setSearchParams(newParams);
  };

  // Sync URL params with filters
  useEffect(() => {
    if (areaFromUrl && areaFromUrl !== filters.areaId) {
      setFilters(f => ({ ...f, areaId: areaFromUrl }));
    }
  }, [areaFromUrl]);

  const selectedArea = filters.areaId ? areas.find(a => a.id === filters.areaId) : null;

  const availableCycles = formData.area_id
    ? cycles.filter(c => c.area_id === formData.area_id)
    : cycles;

  // Filter data based on selected area
  const filteredCosts = filters.areaId 
    ? costs.filter((c: any) => c.area_id === filters.areaId)
    : costs;
  const filteredInvestments = filters.areaId
    ? investments.filter((i: any) => i.area_id === filters.areaId)
    : investments;
  const filteredRevenues = filters.areaId
    ? revenues.filter((r: any) => r.area_id === filters.areaId)
    : revenues;

  const totalCosts = filteredCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
  const totalInvestments = filteredInvestments.reduce((sum: number, i: any) => sum + Number(i.valor), 0);
  const totalRevenues = filteredRevenues.reduce((sum: number, r: any) => sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0);

  const handleCostSubmit = (data: CostInsert) => {
    if (editingCost) {
      updateCost.mutate({ ...data, id: editingCost.id });
    } else {
      createCost.mutate(data);
    }
    setCostFormOpen(false);
    setEditingCost(null);
  };

  const handleInvestmentSubmit = (data: InvestmentInsert) => {
    if (editingInvestment) {
      updateInvestment.mutate({ ...data, id: editingInvestment.id });
    } else {
      createInvestment.mutate(data);
    }
    setInvestmentFormOpen(false);
    setEditingInvestment(null);
  };

  const handleRevenueSubmit = (data: RevenueInsert) => {
    if (editingRevenue) {
      updateRevenue.mutate({ ...data, id: editingRevenue.id });
    } else {
      createRevenue.mutate(data);
    }
    setRevenueFormOpen(false);
    setEditingRevenue(null);
  };

  const getAddButton = () => {
    switch (activeTab) {
      case "custos":
        return (
          <Button className="gap-2" onClick={() => { setEditingCost(null); setCostFormOpen(true); }} disabled={areas.length === 0}>
            <Plus className="h-4 w-4" />
            Novo Custo
          </Button>
        );
      case "investimentos":
        return (
          <Button className="gap-2" onClick={() => { setEditingInvestment(null); setInvestmentFormOpen(true); }}>
            <Plus className="h-4 w-4" />
            Novo Custo de Implantação
          </Button>
        );
      case "receitas":
        return (
          <Button className="gap-2" onClick={() => { setEditingRevenue(null); setRevenueFormOpen(true); }} disabled={areas.length === 0}>
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
        );
      default:
        return (
          <Button className="gap-2" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Movimentação
          </Button>
        );
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {selectedArea ? `Caixa: ${selectedArea.nome}` : "Fluxo de Caixa"}
            </h1>
            <p className="text-muted-foreground">
              {selectedArea 
                ? `Movimentações da área ${selectedArea.nome} (${Number(selectedArea.tamanho_hectares).toFixed(2)} ha)`
                : "Base financeira única - todas as movimentações"
              }
            </p>
          </div>
          {getAddButton()}
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

        {/* Area Filter (if active) */}
        {hasFilters && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Filter className="h-3 w-3" />
              Filtrado por: {selectedArea?.nome || "Área"}
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Limpar filtros
            </Button>
          </div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="todos" className="gap-2">
              <Wallet className="h-4 w-4" />
              Todos
            </TabsTrigger>
            <TabsTrigger value="custos" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Custos
            </TabsTrigger>
            <TabsTrigger value="investimentos" className="gap-2">
              <FileText className="h-4 w-4" />
              Investimentos
            </TabsTrigger>
            <TabsTrigger value="receitas" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Receitas
            </TabsTrigger>
          </TabsList>

          {/* All Transactions Tab */}
          <TabsContent value="todos">
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
                  <h3 className="text-lg font-medium">Nenhuma movimentação</h3>
                  <p className="text-muted-foreground mb-4">Registre sua primeira movimentação de caixa.</p>
                  <Button onClick={() => setFormOpen(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Nova Movimentação
                  </Button>
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
                              {transaction.areas?.nome || <span className="text-muted-foreground">-</span>}
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
          </TabsContent>

          {/* Costs Tab */}
          <TabsContent value="custos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Custos Operacionais
                  <Badge variant="outline" className="ml-2 bg-destructive/10 text-destructive border-destructive/30">
                    Total: {formatCurrency(totalCosts)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredCosts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Nenhum custo registrado</h3>
                    <p className="text-muted-foreground mb-4">Registre seu primeiro custo operacional.</p>
                    <Button onClick={() => setCostFormOpen(true)} className="gap-2" disabled={areas.length === 0}>
                      <Plus className="h-4 w-4" />
                      Novo Custo
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Pagamento</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCosts.map((cost: any) => {
                        const typeConfig = costTypeConfig[cost.tipo];
                        const Icon = typeConfig?.icon || DollarSign;
                        
                        return (
                          <TableRow key={cost.id}>
                            <TableCell>{format(new Date(cost.data), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`rounded-md p-1.5 ${typeConfig?.bgColor || 'bg-muted'}`}>
                                  <Icon className={`h-3.5 w-3.5 ${typeConfig?.color || 'text-muted-foreground'}`} />
                                </div>
                                <span className="text-sm">{typeConfig?.label || cost.tipo}</span>
                              </div>
                            </TableCell>
                            <TableCell>{cost.areas?.nome}</TableCell>
                            <TableCell className="max-w-[200px] truncate">{cost.descricao || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={cost.forma_pagamento === "dinheiro" ? "secondary" : "destructive"}>
                                {cost.forma_pagamento === "dinheiro" ? "💰 Dinheiro" : "🏦 Empréstimo"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-medium text-destructive">
                              -{formatCurrency(Number(cost.valor))}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingCost(cost); setCostFormOpen(true); }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(cost.id, "cost", cost)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Investments Tab */}
          <TabsContent value="investimentos">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Investimentos
                  <Badge variant="outline" className="ml-2">
                    Total: {formatCurrency(totalInvestments)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredInvestments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Nenhum investimento registrado</h3>
                    <p className="text-muted-foreground mb-4">Registre seu primeiro investimento.</p>
                    <Button onClick={() => setInvestmentFormOpen(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Novo Investimento
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead>Rateado</TableHead>
                        <TableHead className="text-right">Valor</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredInvestments.map((investment: any) => {
                        const typeConfig = investmentTypeConfig[investment.tipo];
                        const Icon = typeConfig?.icon || FileText;
                        
                        return (
                          <TableRow key={investment.id}>
                            <TableCell>{format(new Date(investment.data), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`rounded-md p-1.5 ${typeConfig?.bgColor || 'bg-muted'}`}>
                                  <Icon className={`h-3.5 w-3.5 ${typeConfig?.color || 'text-muted-foreground'}`} />
                                </div>
                                <span className="text-sm">{typeConfig?.label || investment.tipo}</span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">{investment.descricao}</TableCell>
                            <TableCell>{investment.areas?.nome || "Geral"}</TableCell>
                            <TableCell>
                              {investment.rateado ? <Badge variant="secondary">Sim</Badge> : <span className="text-muted-foreground">Não</span>}
                            </TableCell>
                            <TableCell className="text-right font-medium text-destructive">
                              -{formatCurrency(Number(investment.valor))}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingInvestment(investment); setInvestmentFormOpen(true); }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(investment.id, "investment", investment)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenues Tab */}
          <TabsContent value="receitas">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Receitas
                  <Badge variant="outline" className="ml-2 bg-success/10 text-success border-success/30">
                    Total: {formatCurrency(totalRevenues)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredRevenues.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="rounded-full bg-muted p-4 mb-4">
                      <TrendingUp className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium">Nenhuma receita registrada</h3>
                    <p className="text-muted-foreground mb-4">Registre sua primeira receita.</p>
                    <Button onClick={() => setRevenueFormOpen(true)} className="gap-2" disabled={areas.length === 0}>
                      <Plus className="h-4 w-4" />
                      Nova Receita
                    </Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead>Área</TableHead>
                        <TableHead>Quantidade</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead className="w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRevenues.map((revenue: any) => {
                        const total = Number(revenue.quantidade) * Number(revenue.preco_unitario);
                        return (
                          <TableRow key={revenue.id}>
                            <TableCell>{format(new Date(revenue.data), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-success/10 text-success border-success/30">
                                🌱 {revenue.produto}
                              </Badge>
                            </TableCell>
                            <TableCell>{revenue.areas?.nome}</TableCell>
                            <TableCell>
                              {Number(revenue.quantidade).toLocaleString("pt-BR")} {unidadeLabels[revenue.unidade]}
                            </TableCell>
                            <TableCell>{formatCurrency(Number(revenue.preco_unitario))}</TableCell>
                            <TableCell className="max-w-[120px] truncate">{revenue.cliente || "-"}</TableCell>
                            <TableCell className="text-right font-medium text-success">
                              +{formatCurrency(total)}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => { setEditingRevenue(revenue); setRevenueFormOpen(true); }}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDeleteClick(revenue.id, "revenue", revenue)}
                                    className="text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Direct Cash Transaction Form */}
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

      {/* Cost Form */}
      <CostForm
        open={costFormOpen}
        onOpenChange={setCostFormOpen}
        cost={editingCost}
        areas={areas}
        cycles={cycles as any}
        onSubmit={handleCostSubmit}
        isSubmitting={createCost.isPending || updateCost.isPending}
      />

      {/* Investment Form */}
      <InvestmentForm
        open={investmentFormOpen}
        onOpenChange={setInvestmentFormOpen}
        investment={editingInvestment}
        areas={areas}
        onSubmit={handleInvestmentSubmit}
        isSubmitting={createInvestment.isPending || updateInvestment.isPending}
      />

      {/* Revenue Form */}
      <RevenueForm
        open={revenueFormOpen}
        onOpenChange={setRevenueFormOpen}
        revenue={editingRevenue}
        areas={areas}
        cycles={cycles as any}
        onSubmit={handleRevenueSubmit}
        isSubmitting={createRevenue.isPending || updateRevenue.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Excluir {deleteType === "cost" ? "custo" : deleteType === "investment" ? "investimento" : deleteType === "revenue" ? "receita" : "movimentação"}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O registro será removido permanentemente e o caixa será atualizado.
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

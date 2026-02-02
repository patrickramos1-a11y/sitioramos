import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Wallet, Plus, ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, Banknote } from "lucide-react";
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
import { useCashTransactions, CashTransactionInsert, categoriaLabels } from "@/hooks/useCashTransactions";
import { useAreas } from "@/hooks/useAreas";
import { useLoans } from "@/hooks/useLoans";
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

const categoriaOptions = [
  { value: "emprestimo_entrada", label: "Recebimento de Empréstimo", tipo: "entrada" },
  { value: "receita_venda", label: "Receita de Venda", tipo: "entrada" },
  { value: "aporte", label: "Aporte de Capital", tipo: "entrada" },
  { value: "custo_operacional", label: "Custo Operacional", tipo: "saida" },
  { value: "investimento", label: "Investimento", tipo: "saida" },
  { value: "parcela_emprestimo", label: "Pagamento de Parcela", tipo: "saida" },
  { value: "quitacao_emprestimo", label: "Quitação de Empréstimo", tipo: "saida" },
  { value: "despesa_financeira", label: "Despesa Financeira (Juros/Tarifas)", tipo: "saida" },
  { value: "transferencia", label: "Transferência entre Empréstimos", tipo: "saida" },
] as const;

export default function Caixa() {
  const { transactions, balance, isLoading, createTransaction, deleteTransaction } = useCashTransactions();
  const { areas } = useAreas();
  const { loans } = useLoans();
  const [formOpen, setFormOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    data: new Date().toISOString().split("T")[0],
    categoria: "" as CashTransactionInsert["categoria"] | "",
    valor: "",
    descricao: "",
    loan_id: "",
    area_id: "",
    observacoes: "",
  });

  const saldoAtual = balance?.saldo_atual || 0;
  const totalEntradas = balance?.total_entradas || 0;
  const totalSaidas = balance?.total_saidas || 0;

  const handleSubmit = () => {
    if (!formData.categoria || !formData.valor) return;

    const categoriaInfo = categoriaOptions.find(c => c.value === formData.categoria);
    const tipo = categoriaInfo?.tipo || "saida";

    createTransaction.mutate({
      data: formData.data,
      tipo: tipo as "entrada" | "saida",
      categoria: formData.categoria as CashTransactionInsert["categoria"],
      valor: Number(formData.valor),
      descricao: formData.descricao || null,
      loan_id: formData.loan_id || null,
      area_id: formData.area_id || null,
      observacoes: formData.observacoes || null,
    });

    setFormOpen(false);
    setFormData({
      data: new Date().toISOString().split("T")[0],
      categoria: "",
      valor: "",
      descricao: "",
      loan_id: "",
      area_id: "",
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Fluxo de Caixa</h1>
            <p className="text-muted-foreground">
              Controle de entradas e saídas
            </p>
          </div>
          <Button className="gap-2" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4" />
            Nova Movimentação
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className={saldoAtual >= 0 ? "border-success/50" : "border-destructive/50"}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
              <Banknote className={`h-5 w-5 ${saldoAtual >= 0 ? "text-success" : "text-destructive"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${saldoAtual >= 0 ? "text-success" : "text-destructive"}`}>
                {formatCurrency(saldoAtual)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Entradas</CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">
                {formatCurrency(totalEntradas)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Saídas</CardTitle>
              <TrendingDown className="h-5 w-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                {formatCurrency(totalSaidas)}
              </div>
            </CardContent>
          </Card>
        </div>

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
              <h3 className="text-lg font-medium">Nenhuma movimentação encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Registre sua primeira movimentação de caixa.
              </p>
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
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        {format(new Date(transaction.data), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {transaction.tipo === "entrada" ? (
                          <Badge variant="default" className="bg-success/20 text-success hover:bg-success/30">
                            <ArrowUpCircle className="h-3 w-3 mr-1" />
                            Entrada
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-destructive/20 text-destructive hover:bg-destructive/30">
                            <ArrowDownCircle className="h-3 w-3 mr-1" />
                            Saída
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {categoriaLabels[transaction.categoria]}
                        </Badge>
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
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
                onValueChange={(value) => setFormData({ ...formData, categoria: value as CashTransactionInsert["categoria"] })}
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
                    .map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  <SelectItem value="__header_saida__" disabled className="font-bold text-destructive">
                    ── SAÍDAS ──
                  </SelectItem>
                  {categoriaOptions
                    .filter(c => c.tipo === "saida")
                    .map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
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
                  value={formData.area_id}
                  onValueChange={(value) => setFormData({ ...formData, area_id: value === "__none__" ? "" : value })}
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
                <Label htmlFor="loan_id">Empréstimo (opcional)</Label>
                <Select
                  value={formData.loan_id}
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
            <Button variant="outline" onClick={() => setFormOpen(false)}>
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

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Landmark, Plus, Calendar, CheckCircle2, Banknote, TrendingDown, TrendingUp, ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoans, Loan } from "@/hooks/useLoans";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { LoanForm, LoanFormSubmitData } from "@/components/loans/LoanForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreVertical, Pencil, Trash2, Eye, CreditCard } from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
};

const frequenciaLabels: Record<string, string> = {
  mensal: "Mensal",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
  manual: "Manual",
};

export default function Emprestimos() {
  const { loans, isLoading, createLoan, updateLoan, deleteLoan, payInstallment, quitarEmprestimo } = useLoans();
  const { areas } = useAreas();
  const { cycles } = useCycles();
  const [formOpen, setFormOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState<Loan | null>(null);
  const [viewingLoan, setViewingLoan] = useState<any | null>(null);
  const [quitacaoDialogOpen, setQuitacaoDialogOpen] = useState(false);
  const [loanToQuitar, setLoanToQuitar] = useState<any | null>(null);
  const [valorQuitacao, setValorQuitacao] = useState("");
  const [dataQuitacao, setDataQuitacao] = useState(new Date().toISOString().split("T")[0]);

  // Summary metrics
  const totalContratado = loans.reduce((sum: number, loan: any) => sum + Number(loan.valor_principal || loan.valor_total), 0);
  const totalRecebido = loans.reduce((sum: number, loan: any) => sum + Number(loan.valor_recebido || loan.valor_principal || loan.valor_total), 0);
  const totalAPagar = loans.reduce((sum: number, loan: any) => sum + Number(loan.valor_total), 0);
  const totalPago = loans.reduce((sum: number, loan: any) => {
    const paidAmount = loan.installments?.filter((i: any) => i.status === "paga").reduce((s: number, i: any) => s + Number(i.valor), 0) || 0;
    return sum + paidAmount;
  }, 0);
  const saldoDevedor = totalAPagar - totalPago;

  const handleCreate = () => { setEditingLoan(null); setFormOpen(true); };
  const handleEdit = (loan: Loan) => { setEditingLoan(loan); setFormOpen(true); };
  const handleDeleteClick = (loan: Loan) => { setLoanToDelete(loan); setDeleteDialogOpen(true); };
  const handleConfirmDelete = () => { if (loanToDelete) deleteLoan.mutate(loanToDelete.id); setDeleteDialogOpen(false); setLoanToDelete(null); };

  const handleSubmit = (data: LoanFormSubmitData) => {
    if (editingLoan) {
      updateLoan.mutate({ ...data, id: editingLoan.id });
    } else {
      createLoan.mutate(data);
    }
    setFormOpen(false);
    setEditingLoan(null);
  };

  const handlePayInstallment = (installmentId: string) => {
    payInstallment.mutate({ id: installmentId, dataPagamento: new Date().toISOString().split('T')[0] });
  };

  const handleQuitarClick = (loan: any) => {
    const paidAmount = loan.installments?.filter((i: any) => i.status === "paga").reduce((s: number, i: any) => s + Number(i.valor), 0) || 0;
    setLoanToQuitar(loan);
    setValorQuitacao((Number(loan.valor_total) - paidAmount).toString());
    setDataQuitacao(new Date().toISOString().split("T")[0]);
    setQuitacaoDialogOpen(true);
  };

  const handleConfirmQuitacao = () => {
    if (loanToQuitar && valorQuitacao) {
      quitarEmprestimo.mutate({ loanId: loanToQuitar.id, valorQuitacao: Number(valorQuitacao), dataPagamento: dataQuitacao });
    }
    setQuitacaoDialogOpen(false);
    setLoanToQuitar(null);
    setValorQuitacao("");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Empréstimos</h1>
            <p className="text-muted-foreground">{loans.length} empréstimo{loans.length !== 1 ? "s" : ""} registrado{loans.length !== 1 ? "s" : ""}</p>
          </div>
          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Novo Empréstimo
          </Button>
        </div>

        {loans.length > 0 && (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Contratado</p>
                </div>
                <p className="text-xl font-bold">{formatCurrency(totalContratado)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-success" />
                  <p className="text-sm text-muted-foreground">Recebido</p>
                </div>
                <p className="text-xl font-bold text-success">{formatCurrency(totalRecebido)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <ArrowUpDown className="h-4 w-4 text-warning" />
                  <p className="text-sm text-muted-foreground">Total a Pagar</p>
                </div>
                <p className="text-xl font-bold text-warning">{formatCurrency(totalAPagar)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <p className="text-sm text-muted-foreground">Já Pago</p>
                </div>
                <p className="text-xl font-bold text-success">{formatCurrency(totalPago)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-muted-foreground">Pendente</p>
                </div>
                <p className="text-xl font-bold text-destructive">{formatCurrency(totalPendente)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        ) : loans.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Landmark className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhum empréstimo encontrado</h3>
              <p className="text-muted-foreground mb-4">Registre seu primeiro empréstimo.</p>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Empréstimo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {loans.map((loan: any) => {
              const valorPrincipal = Number(loan.valor_principal || loan.valor_total);
              const valorRecebido = Number(loan.valor_recebido || valorPrincipal);
              const valorTotalPagar = Number(loan.valor_total);
              const valorParcela = Number(loan.valor_parcela);
              const descontos = Number(loan.descontos_iniciais || 0);
              const juros = Number(loan.juros_percentual || 0);
              const frequencia = frequenciaLabels[loan.frequencia_parcela] || frequenciaLabels.mensal;
              
              const paidCount = loan.installments?.filter((i: any) => i.status === "paga").length || 0;
              const totalCount = loan.installments?.length || 0;
              const progress = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
              const isQuitado = loan.status === "quitado" || progress === 100;
              const paidAmount = loan.installments?.filter((i: any) => i.status === "paga").reduce((s: number, i: any) => s + Number(i.valor), 0) || 0;
              const pendingAmount = valorTotalPagar - paidAmount;
              const custoFinanceiro = valorTotalPagar - valorPrincipal;
              
              return (
                <Card key={loan.id} className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`rounded-lg p-2 ${isQuitado ? "bg-success/10" : "bg-warning/10"}`}>
                          <Landmark className={`h-4 w-4 ${isQuitado ? "text-success" : "text-warning"}`} />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{loan.origem_credor}</CardTitle>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <Badge variant={isQuitado ? "default" : "secondary"}>
                              {isQuitado ? "Quitado" : "Ativo"}
                            </Badge>
                            {juros > 0 && <Badge variant="outline">{juros}% juros</Badge>}
                            <Badge variant="outline">{frequencia}</Badge>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingLoan(loan)}>
                            <Eye className="mr-2 h-4 w-4" />Ver Parcelas
                          </DropdownMenuItem>
                          {!isQuitado && (
                            <DropdownMenuItem onClick={() => handleQuitarClick(loan)}>
                              <CreditCard className="mr-2 h-4 w-4" />Quitar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleEdit(loan)}>
                            <Pencil className="mr-2 h-4 w-4" />Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClick(loan)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" />Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(loan.data), "dd/MM/yyyy", { locale: ptBR })}</span>
                    </div>

                    <div className="rounded-lg bg-muted/50 p-3 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Contratado:</span>
                        <span className="font-semibold">{formatCurrency(valorPrincipal)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-success" />Recebido:
                        </span>
                        <span className="font-semibold text-success">{formatCurrency(valorRecebido)}</span>
                      </div>
                      {descontos > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <TrendingDown className="h-3 w-3 text-destructive" />Descontos:
                          </span>
                          <span className="font-semibold text-destructive">-{formatCurrency(descontos)}</span>
                        </div>
                      )}
                      <div className="border-t pt-2 flex justify-between">
                        <span className="text-muted-foreground">Valor Parcela:</span>
                        <span className="font-semibold">{formatCurrency(valorParcela)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total a Pagar:</span>
                        <span className="font-bold text-warning">{formatCurrency(valorTotalPagar)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Já Pago:</span>
                        <span className="font-semibold text-success">{formatCurrency(paidAmount)}</span>
                      </div>
                      {custoFinanceiro > 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Custo Financeiro:</span>
                          <span className="font-semibold text-destructive">{formatCurrency(custoFinanceiro)}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Parcelas pagas</span>
                        <span className="font-medium">{paidCount} de {totalCount}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>

                    {!isQuitado && (
                      <div className="flex justify-between text-sm pt-1">
                        <span className="text-muted-foreground">Saldo Pendente:</span>
                        <span className="font-bold text-destructive">{formatCurrency(pendingAmount)}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <LoanForm open={formOpen} onOpenChange={setFormOpen} loan={editingLoan} areas={areas} cycles={cycles as any} onSubmit={handleSubmit} isSubmitting={createLoan.isPending || updateLoan.isPending} />

      {/* View Installments */}
      <Dialog open={!!viewingLoan} onOpenChange={() => setViewingLoan(null)}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Parcelas — {viewingLoan?.origem_credor}</DialogTitle>
          </DialogHeader>
          <div className="text-sm text-muted-foreground mb-2">
            Frequência: {frequenciaLabels[(viewingLoan as any)?.frequencia_parcela] || "Mensal"}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº</TableHead>
                <TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewingLoan?.installments
                ?.sort((a: any, b: any) => a.numero_parcela - b.numero_parcela)
                .map((installment: any) => (
                <TableRow key={installment.id}>
                  <TableCell>{installment.numero_parcela}</TableCell>
                  <TableCell>{format(new Date(installment.data_vencimento), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>
                    {installment.data_pagamento 
                      ? format(new Date(installment.data_pagamento), "dd/MM/yyyy", { locale: ptBR })
                      : <span className="text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell>{formatCurrency(Number(installment.valor))}</TableCell>
                  <TableCell>
                    <Badge variant={installment.status === "paga" ? "default" : installment.status === "atrasada" ? "destructive" : "secondary"}>
                      {installment.status === "paga" ? "Paga" : installment.status === "atrasada" ? "Atrasada" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {installment.status !== "paga" && (
                      <Button size="sm" variant="outline" onClick={() => handlePayInstallment(installment.id)} className="gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        Pagar
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {viewingLoan && (() => {
            const paidAmt = viewingLoan.installments?.filter((i: any) => i.status === "paga").reduce((s: number, i: any) => s + Number(i.valor), 0) || 0;
            const remaining = Number(viewingLoan.valor_total) - paidAmt;
            return (
              <div className="flex justify-between items-center pt-3 border-t text-sm">
                <span className="text-muted-foreground">Pago: <strong className="text-success">{formatCurrency(paidAmt)}</strong></span>
                <span className="text-muted-foreground">Restante: <strong className="text-destructive">{formatCurrency(remaining)}</strong></span>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empréstimo?</AlertDialogTitle>
            <AlertDialogDescription>
              O empréstimo de "{loanToDelete?.origem_credor}", todas as parcelas e transações vinculadas serão removidos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Quitação Dialog */}
      <Dialog open={quitacaoDialogOpen} onOpenChange={setQuitacaoDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Quitar Empréstimo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Valor da Quitação (R$)</Label>
              <Input type="number" step="0.01" value={valorQuitacao} onChange={(e) => setValorQuitacao(e.target.value)} />
              <p className="text-xs text-muted-foreground">Valor total a ser pago para quitar</p>
            </div>
            <div className="space-y-2">
              <Label>Data do Pagamento</Label>
              <Input type="date" value={dataQuitacao} onChange={(e) => setDataQuitacao(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuitacaoDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmQuitacao}>Confirmar Quitação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

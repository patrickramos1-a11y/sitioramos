import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { FileText, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useInvestments, Investment, InvestmentInsert } from "@/hooks/useInvestments";
import { useAreas } from "@/hooks/useAreas";
import { InvestmentForm } from "@/components/investments/InvestmentForm";
import { investmentTypeConfig } from "@/lib/categoryConfig";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function Investimentos() {
  const { investments, isLoading, createInvestment, updateInvestment, deleteInvestment } = useInvestments();
  const { areas } = useAreas();
  const [formOpen, setFormOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [investmentToDelete, setInvestmentToDelete] = useState<Investment | null>(null);

  const totalInvestments = investments.reduce((sum: number, inv: any) => sum + Number(inv.valor), 0);

  const handleCreate = () => {
    setEditingInvestment(null);
    setFormOpen(true);
  };

  const handleEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setFormOpen(true);
  };

  const handleDeleteClick = (investment: Investment) => {
    setInvestmentToDelete(investment);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (investmentToDelete) {
      deleteInvestment.mutate(investmentToDelete.id);
    }
    setDeleteDialogOpen(false);
    setInvestmentToDelete(null);
  };

  const handleSubmit = (data: InvestmentInsert) => {
    if (editingInvestment) {
      updateInvestment.mutate({ ...data, id: editingInvestment.id });
    } else {
      createInvestment.mutate(data);
    }
    setFormOpen(false);
    setEditingInvestment(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Investimentos</h1>
            <p className="text-muted-foreground">
              {investments.length} registro{investments.length !== 1 ? "s" : ""} • Total: {formatCurrency(totalInvestments)}
            </p>
          </div>
          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Novo Investimento
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : investments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhum investimento encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Registre seu primeiro investimento.
              </p>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Investimento
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Registro de Investimentos
                <Badge variant="outline" className="ml-2 bg-destructive/10 text-destructive border-destructive/30">
                  Impacta o Caixa
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                  {investments.map((investment: any) => {
                    const typeConfig = investmentTypeConfig[investment.tipo];
                    const Icon = typeConfig?.icon || FileText;
                    
                    return (
                      <TableRow key={investment.id}>
                        <TableCell>
                          {format(new Date(investment.data), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`rounded-md p-1.5 ${typeConfig?.bgColor || 'bg-muted'}`}>
                              <Icon className={`h-3.5 w-3.5 ${typeConfig?.color || 'text-muted-foreground'}`} />
                            </div>
                            <span className="text-sm">{typeConfig?.label || investment.tipo}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {investment.descricao}
                        </TableCell>
                        <TableCell>{investment.areas?.nome || "Geral"}</TableCell>
                        <TableCell>
                          {investment.rateado ? (
                            <Badge variant="secondary">Sim</Badge>
                          ) : (
                            <span className="text-muted-foreground">Não</span>
                          )}
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
                              <DropdownMenuItem onClick={() => handleEdit(investment)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(investment)}
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
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Dialog */}
      <InvestmentForm
        open={formOpen}
        onOpenChange={setFormOpen}
        investment={editingInvestment}
        areas={areas}
        onSubmit={handleSubmit}
        isSubmitting={createInvestment.isPending || updateInvestment.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir investimento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O investimento será removido e o caixa atualizado.
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

import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useRevenues, Revenue, RevenueInsert } from "@/hooks/useRevenues";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { RevenueForm } from "@/components/revenues/RevenueForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

const unidadeLabels: Record<string, string> = {
  kg: "kg",
  saca: "saca(s)",
  unidade: "un.",
  tonelada: "t",
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function Receitas() {
  const { revenues, isLoading, createRevenue, updateRevenue, deleteRevenue } = useRevenues();
  const { areas } = useAreas();
  const { cycles } = useCycles();
  const [formOpen, setFormOpen] = useState(false);
  const [editingRevenue, setEditingRevenue] = useState<Revenue | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [revenueToDelete, setRevenueToDelete] = useState<Revenue | null>(null);

  const totalRevenues = revenues.reduce((sum: number, rev: any) => 
    sum + (Number(rev.quantidade) * Number(rev.preco_unitario)), 0
  );

  const handleCreate = () => {
    setEditingRevenue(null);
    setFormOpen(true);
  };

  const handleEdit = (revenue: Revenue) => {
    setEditingRevenue(revenue);
    setFormOpen(true);
  };

  const handleDeleteClick = (revenue: Revenue) => {
    setRevenueToDelete(revenue);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (revenueToDelete) {
      deleteRevenue.mutate(revenueToDelete.id);
    }
    setDeleteDialogOpen(false);
    setRevenueToDelete(null);
  };

  const handleSubmit = (data: RevenueInsert) => {
    if (editingRevenue) {
      updateRevenue.mutate({ ...data, id: editingRevenue.id });
    } else {
      createRevenue.mutate(data);
    }
    setFormOpen(false);
    setEditingRevenue(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Receitas</h1>
            <p className="text-muted-foreground">
              {revenues.length} registro{revenues.length !== 1 ? "s" : ""} • Total: {formatCurrency(totalRevenues)}
            </p>
          </div>
          <Button className="gap-2" onClick={handleCreate} disabled={areas.length === 0}>
            <Plus className="h-4 w-4" />
            Nova Receita
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : areas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Cadastre uma área primeiro</h3>
              <p className="text-muted-foreground text-center">
                Você precisa ter pelo menos uma área cadastrada para registrar receitas.
              </p>
            </CardContent>
          </Card>
        ) : revenues.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhuma receita encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Registre sua primeira receita.
              </p>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Receita
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Registro de Receitas
                <Badge variant="outline" className="ml-2 bg-success/10 text-success border-success/30">
                  Impacta o Caixa
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
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
                  {revenues.map((revenue: any) => {
                    const total = Number(revenue.quantidade) * Number(revenue.preco_unitario);
                    return (
                      <TableRow key={revenue.id}>
                        <TableCell>
                          {format(new Date(revenue.data), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
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
                        <TableCell className="max-w-[120px] truncate">
                          {revenue.cliente || "-"}
                        </TableCell>
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
                              <DropdownMenuItem onClick={() => handleEdit(revenue)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(revenue)}
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
      <RevenueForm
        open={formOpen}
        onOpenChange={setFormOpen}
        revenue={editingRevenue}
        areas={areas}
        cycles={cycles as any}
        onSubmit={handleSubmit}
        isSubmitting={createRevenue.isPending || updateRevenue.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir receita?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A receita será removida e o caixa atualizado.
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

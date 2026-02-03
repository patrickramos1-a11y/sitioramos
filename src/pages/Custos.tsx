import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DollarSign, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCosts, Cost, CostInsert } from "@/hooks/useCosts";
import { useAreas } from "@/hooks/useAreas";
import { useCycles } from "@/hooks/useCycles";
import { CostForm } from "@/components/costs/CostForm";
import { costTypeConfig } from "@/lib/categoryConfig";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

export default function Custos() {
  const { costs, isLoading, createCost, updateCost, deleteCost } = useCosts();
  const { areas } = useAreas();
  const { cycles } = useCycles();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [costToDelete, setCostToDelete] = useState<Cost | null>(null);
  const [tipoFilter, setTipoFilter] = useState("all");

  const filteredCosts = tipoFilter === "all" 
    ? costs 
    : costs.filter((cost: any) => cost.tipo === tipoFilter);

  const totalCosts = filteredCosts.reduce((sum: number, cost: any) => sum + Number(cost.valor), 0);

  const handleCreate = () => {
    setEditingCost(null);
    setFormOpen(true);
  };

  const handleEdit = (cost: Cost) => {
    setEditingCost(cost);
    setFormOpen(true);
  };

  const handleDeleteClick = (cost: Cost) => {
    setCostToDelete(cost);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (costToDelete) {
      deleteCost.mutate(costToDelete.id);
    }
    setDeleteDialogOpen(false);
    setCostToDelete(null);
  };

  const handleSubmit = (data: CostInsert) => {
    if (editingCost) {
      updateCost.mutate({ ...data, id: editingCost.id });
    } else {
      createCost.mutate(data);
    }
    setFormOpen(false);
    setEditingCost(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Custos</h1>
            <p className="text-muted-foreground">
              {filteredCosts.length} registro{filteredCosts.length !== 1 ? "s" : ""} • Total: {formatCurrency(totalCosts)}
            </p>
          </div>
          <Button className="gap-2" onClick={handleCreate} disabled={areas.length === 0}>
            <Plus className="h-4 w-4" />
            Novo Custo
          </Button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={tipoFilter} onValueChange={setTipoFilter}>
            <SelectTrigger className="w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              {Object.entries(costTypeConfig).map(([value, config]) => {
                const Icon = config.icon;
                return (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      {config.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
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
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Cadastre uma área primeiro</h3>
              <p className="text-muted-foreground text-center">
                Você precisa ter pelo menos uma área cadastrada para registrar custos.
              </p>
            </CardContent>
          </Card>
        ) : filteredCosts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <DollarSign className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhum custo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                {tipoFilter !== "all" ? "Tente mudar o filtro ou registre um novo custo." : "Registre seu primeiro custo."}
              </p>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Custo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Registro de Custos
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
                        <TableCell>
                          {format(new Date(cost.data), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`rounded-md p-1.5 ${typeConfig?.bgColor || 'bg-muted'}`}>
                              <Icon className={`h-3.5 w-3.5 ${typeConfig?.color || 'text-muted-foreground'}`} />
                            </div>
                            <span className="text-sm">{typeConfig?.label || cost.tipo}</span>
                          </div>
                        </TableCell>
                        <TableCell>{cost.areas?.nome}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {cost.descricao || "-"}
                        </TableCell>
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
                              <DropdownMenuItem onClick={() => handleEdit(cost)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeleteClick(cost)}
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
      <CostForm
        open={formOpen}
        onOpenChange={setFormOpen}
        cost={editingCost}
        areas={areas}
        cycles={cycles as any}
        onSubmit={handleSubmit}
        isSubmitting={createCost.isPending || updateCost.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir custo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O custo será removido e o caixa atualizado.
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

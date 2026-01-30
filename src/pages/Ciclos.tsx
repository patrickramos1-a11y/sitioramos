import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { RefreshCw, Plus, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useCycles, Cycle, CycleInsert } from "@/hooks/useCycles";
import { useAreas } from "@/hooks/useAreas";
import { CycleForm } from "@/components/cycles/CycleForm";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  planejamento: { label: "Planejamento", variant: "secondary" },
  ativo: { label: "Ativo", variant: "default" },
  finalizado: { label: "Finalizado", variant: "outline" },
};

export default function Ciclos() {
  const { cycles, isLoading, createCycle, updateCycle, deleteCycle } = useCycles();
  const { areas } = useAreas();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCycle, setEditingCycle] = useState<Cycle | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cycleToDelete, setCycleToDelete] = useState<Cycle | null>(null);

  const handleCreate = () => {
    setEditingCycle(null);
    setFormOpen(true);
  };

  const handleEdit = (cycle: Cycle) => {
    setEditingCycle(cycle);
    setFormOpen(true);
  };

  const handleDeleteClick = (cycle: Cycle) => {
    setCycleToDelete(cycle);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (cycleToDelete) {
      deleteCycle.mutate(cycleToDelete.id);
    }
    setDeleteDialogOpen(false);
    setCycleToDelete(null);
  };

  const handleSubmit = (data: CycleInsert) => {
    if (editingCycle) {
      updateCycle.mutate({ ...data, id: editingCycle.id });
    } else {
      createCycle.mutate(data);
    }
    setFormOpen(false);
    setEditingCycle(null);
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ciclos Produtivos</h1>
            <p className="text-muted-foreground">
              {cycles.length} ciclo{cycles.length !== 1 ? "s" : ""} cadastrado{cycles.length !== 1 ? "s" : ""}
            </p>
          </div>
          <Button className="gap-2" onClick={handleCreate} disabled={areas.length === 0}>
            <Plus className="h-4 w-4" />
            Novo Ciclo
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : areas.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <RefreshCw className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Cadastre uma área primeiro</h3>
              <p className="text-muted-foreground text-center">
                Você precisa ter pelo menos uma área cadastrada para criar um ciclo produtivo.
              </p>
            </CardContent>
          </Card>
        ) : cycles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="rounded-full bg-muted p-4 mb-4">
                <RefreshCw className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Nenhum ciclo encontrado</h3>
              <p className="text-muted-foreground mb-4">
                Cadastre seu primeiro ciclo produtivo.
              </p>
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Ciclo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cycles.map((cycle: any) => {
              const status = statusConfig[cycle.status] || statusConfig.planejamento;
              return (
                <Card key={cycle.id} className="transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="rounded-lg bg-primary/10 p-2">
                          <RefreshCw className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{cycle.cultura}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {cycle.areas?.nome}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(cycle)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(cycle)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>
                        Plantio: {format(new Date(cycle.data_inicio_plantio), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </div>

                    {cycle.data_prevista_colheita && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Previsão: {format(new Date(cycle.data_prevista_colheita), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <CycleForm
        open={formOpen}
        onOpenChange={setFormOpen}
        cycle={editingCycle}
        areas={areas}
        onSubmit={handleSubmit}
        isSubmitting={createCycle.isPending || updateCycle.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir ciclo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O ciclo "{cycleToDelete?.cultura}" será removido permanentemente.
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

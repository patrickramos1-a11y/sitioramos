import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MapPin, Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAreas, Area, AreaInsert } from "@/hooks/useAreas";
import { AreaCard } from "@/components/areas/AreaCard";
import { AreaForm } from "@/components/areas/AreaForm";

const statusOptions = [
  { value: "all", label: "Todos os status" },
  { value: "planejamento", label: "Planejamento" },
  { value: "preparo", label: "Em preparo" },
  { value: "plantada", label: "Plantada" },
  { value: "producao", label: "Em produção" },
  { value: "colhida", label: "Colhida" },
];

export default function Areas() {
  const { areas, isLoading, createArea, updateArea, deleteArea } = useAreas();
  const [formOpen, setFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState<Area | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredAreas = statusFilter === "all" 
    ? areas 
    : areas.filter(area => area.status === statusFilter);

  const handleCreate = () => {
    setEditingArea(null);
    setFormOpen(true);
  };

  const handleEdit = (area: Area) => {
    setEditingArea(area);
    setFormOpen(true);
  };

  const handleDeleteClick = (area: Area) => {
    setAreaToDelete(area);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (areaToDelete) {
      deleteArea.mutate(areaToDelete.id);
    }
    setDeleteDialogOpen(false);
    setAreaToDelete(null);
  };

  const handleSubmit = (data: AreaInsert) => {
    if (editingArea) {
      updateArea.mutate({ ...data, id: editingArea.id });
    } else {
      createArea.mutate(data);
    }
    setFormOpen(false);
    setEditingArea(null);
  };

  const totalHectares = areas.reduce((sum, area) => sum + Number(area.tamanho_hectares), 0);

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Áreas</h1>
            <p className="text-muted-foreground">
              {areas.length} área{areas.length !== 1 ? "s" : ""} cadastrada{areas.length !== 1 ? "s" : ""} • {totalHectares.toFixed(2)} ha total
            </p>
          </div>
          <Button className="gap-2" onClick={handleCreate}>
            <Plus className="h-4 w-4" />
            Nova Área
          </Button>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 rounded-xl" />
            ))}
          </div>
        ) : filteredAreas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">Nenhuma área encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {statusFilter !== "all" 
                ? "Tente mudar o filtro ou cadastre uma nova área." 
                : "Cadastre sua primeira área para começar."}
            </p>
            <Button onClick={handleCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Nova Área
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAreas.map((area) => (
              <AreaCard
                key={area.id}
                area={area}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <AreaForm
        open={formOpen}
        onOpenChange={setFormOpen}
        area={editingArea}
        onSubmit={handleSubmit}
        isSubmitting={createArea.isPending || updateArea.isPending}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir área?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A área "{areaToDelete?.nome}" será removida permanentemente.
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

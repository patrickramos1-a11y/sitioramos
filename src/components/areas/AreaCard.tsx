import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MapPin, MoreVertical, Pencil, Trash2, Calendar, Sprout } from "lucide-react";
import { Area } from "@/hooks/useAreas";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  planejamento: { label: "Planejamento", variant: "secondary" },
  preparo: { label: "Em preparo", variant: "outline" },
  plantada: { label: "Plantada", variant: "default" },
  producao: { label: "Em produção", variant: "default" },
  colhida: { label: "Colhida", variant: "secondary" },
};

interface AreaCardProps {
  area: Area;
  onEdit: (area: Area) => void;
  onDelete: (area: Area) => void;
}

export function AreaCard({ area, onEdit, onDelete }: AreaCardProps) {
  const status = statusConfig[area.status] || statusConfig.planejamento;

  return (
    <Card className="transition-all hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{area.nome}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {Number(area.tamanho_hectares).toFixed(2)} hectares
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
              <DropdownMenuItem onClick={() => onEdit(area)}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDelete(area)}
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
        
        {area.cultura_principal && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sprout className="h-4 w-4" />
            <span>{area.cultura_principal}</span>
          </div>
        )}
        
        {area.data_inicio && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Início: {format(new Date(area.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
            </span>
          </div>
        )}

        {area.observacoes && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {area.observacoes}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { MapPin, MoreVertical, Pencil, Trash2, Calendar, Sprout, Wallet, Eye, RefreshCw, DollarSign, TrendingUp } from "lucide-react";
import { Area } from "@/hooks/useAreas";
import { useCosts } from "@/hooks/useCosts";
import { useRevenues } from "@/hooks/useRevenues";
import { useCycles } from "@/hooks/useCycles";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  planejamento: { label: "Planejamento", variant: "secondary" },
  preparo: { label: "Em preparo", variant: "outline" },
  plantada: { label: "Plantada", variant: "default" },
  producao: { label: "Em produção", variant: "default" },
  colhida: { label: "Colhida", variant: "secondary" },
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

interface AreaCardProps {
  area: Area;
  onEdit: (area: Area) => void;
  onDelete: (area: Area) => void;
}

export function AreaCard({ area, onEdit, onDelete }: AreaCardProps) {
  const navigate = useNavigate();
  const { costs } = useCosts();
  const { revenues } = useRevenues();
  const { cycles } = useCycles();

  const status = statusConfig[area.status] || statusConfig.planejamento;

  // Calculate financials for this area
  const areaCosts = costs.filter((c: any) => c.area_id === area.id);
  const areaRevenues = revenues.filter((r: any) => r.area_id === area.id);
  const areaCycles = cycles.filter((c: any) => c.area_id === area.id);

  const totalCustos = areaCosts.reduce((sum: number, c: any) => sum + Number(c.valor), 0);
  const totalReceitas = areaRevenues.reduce((sum: number, r: any) => 
    sum + (Number(r.quantidade) * Number(r.preco_unitario)), 0
  );
  const activeCyclesCount = areaCycles.filter((c: any) => c.status === "ativo").length;

  const handleViewDetails = () => {
    navigate(`/areas/${area.id}`);
  };

  const handleViewCaixa = () => {
    navigate(`/caixa?area=${area.id}`);
  };

  return (
    <Card className="transition-all hover:shadow-md cursor-pointer" onClick={handleViewDetails}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{area.nome}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {Number(area.tamanho_hectares).toFixed(2)} ha
              </p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewDetails(); }}>
                <Eye className="mr-2 h-4 w-4" />
                Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleViewCaixa(); }}>
                <Wallet className="mr-2 h-4 w-4" />
                Ver Fluxo de Caixa
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(area); }}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(area); }}
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
          {activeCyclesCount > 0 && (
            <Badge variant="outline" className="gap-1">
              <RefreshCw className="h-3 w-3" />
              {activeCyclesCount} ciclo{activeCyclesCount !== 1 ? "s" : ""} ativo{activeCyclesCount !== 1 ? "s" : ""}
            </Badge>
          )}
        </div>
        
        {area.cultura_principal && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sprout className="h-4 w-4" />
            <span>{area.cultura_principal}</span>
          </div>
        )}

        {/* Financial Summary */}
        <div className="pt-2 border-t space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <DollarSign className="h-3 w-3" /> Custos:
            </span>
            <span className="font-medium text-destructive">{formatCurrency(totalCustos)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <TrendingUp className="h-3 w-3" /> Receitas:
            </span>
            <span className="font-medium text-success">{formatCurrency(totalReceitas)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="pt-2 flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); handleViewDetails(); }}
          >
            <Eye className="h-3 w-3 mr-1" />
            Detalhes
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={(e) => { e.stopPropagation(); handleViewCaixa(); }}
          >
            <Wallet className="h-3 w-3 mr-1" />
            Caixa
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

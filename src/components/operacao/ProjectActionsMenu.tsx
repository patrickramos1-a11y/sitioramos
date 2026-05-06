import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, FolderPlus, ListPlus, CheckSquare, Pencil, Trash2, Link2, Copy } from "lucide-react";

export interface ProjectActions {
  onAddSubproject?: () => void;
  onAddSubdemand?: () => void;
  onAddSubtask?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onLink?: () => void;
  onDuplicate?: () => void;
}

interface Props extends ProjectActions {
  level: number; // 0 = projeto raiz; >0 sub
  variant?: "icon" | "ghost";
}

export function ProjectActionsMenu({
  onAddSubproject, onAddSubdemand, onAddSubtask, onEdit,
  onDelete, onLink, onDuplicate, level, variant = "icon",
}: Props) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant === "icon" ? "ghost" : "outline"}
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 z-50 bg-popover" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel className="text-xs">Adicionar dentro</DropdownMenuLabel>
        {onAddSubproject && (
          <DropdownMenuItem onClick={onAddSubproject}>
            <FolderPlus className="h-4 w-4 mr-2" /> Subprojeto
          </DropdownMenuItem>
        )}
        {onAddSubdemand && (
          <DropdownMenuItem onClick={onAddSubdemand}>
            <ListPlus className="h-4 w-4 mr-2" /> Subdemanda
          </DropdownMenuItem>
        )}
        {onAddSubtask && (
          <DropdownMenuItem onClick={onAddSubtask}>
            <CheckSquare className="h-4 w-4 mr-2" /> Subtarefa
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator />

        {onEdit && (
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="h-4 w-4 mr-2" /> Editar
          </DropdownMenuItem>
        )}
        {onLink && (
          <DropdownMenuItem onClick={onLink}>
            <Link2 className="h-4 w-4 mr-2" /> Vincular a outro projeto
          </DropdownMenuItem>
        )}
        {onDuplicate && (
          <DropdownMenuItem onClick={onDuplicate}>
            <Copy className="h-4 w-4 mr-2" /> Duplicar
          </DropdownMenuItem>
        )}
        {onDelete && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

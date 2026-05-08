import { useState, useEffect, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Plus, ChevronDown, ChevronUp, Check } from "lucide-react";

interface CollapsibleFieldProps {
  label: string;
  value: string;
  hasContent?: boolean;
  children: ReactNode;
  defaultOpen?: boolean;
}

/**
 * Campo recolhido por padrão. Mostra "+ Adicionar X" quando vazio,
 * ou um indicador "X preenchida" quando há conteúdo. Ao clicar, expande
 * para mostrar o textarea/input filho.
 */
export function CollapsibleField({
  label, value, hasContent, children, defaultOpen,
}: CollapsibleFieldProps) {
  const filled = hasContent ?? Boolean(value && value.trim().length > 0);
  const [open, setOpen] = useState<boolean>(defaultOpen ?? filled === false ? false : false);

  useEffect(() => {
    // Quando abre/fecha o modal pai, se já houver conteúdo, mantém recolhido com indicação.
    setOpen(defaultOpen ?? false);
  }, [defaultOpen]);

  if (!open) {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className="w-full justify-start h-8 px-2 text-xs text-muted-foreground hover:text-foreground border border-dashed border-muted-foreground/20 hover:border-muted-foreground/40 rounded-md"
      >
        {filled ? (
          <>
            <Check className="h-3.5 w-3.5 mr-1.5 text-success" />
            <span className="font-medium text-foreground">{label} preenchida</span>
            <span className="ml-1 truncate text-muted-foreground/80">— {value.slice(0, 40)}{value.length > 40 ? "…" : ""}</span>
            <ChevronDown className="h-3 w-3 ml-auto" />
          </>
        ) : (
          <>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Adicionar {label.toLowerCase()}
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-6 px-1.5 text-[11px] text-muted-foreground"
          onClick={() => setOpen(false)}
        >
          <ChevronUp className="h-3 w-3 mr-1" /> Recolher
        </Button>
      </div>
      {children}
    </div>
  );
}

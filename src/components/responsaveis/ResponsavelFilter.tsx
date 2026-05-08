import { useResponsaveis } from "@/hooks/useResponsaveis";
import { cn } from "@/lib/utils";
import { Users, UserX } from "lucide-react";

export type ResponsavelFilterValue = "all" | "none" | string;

interface Props {
  value: ResponsavelFilterValue;
  onChange: (v: ResponsavelFilterValue) => void;
  className?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
}

export function ResponsavelFilter({ value, onChange, className, size = "sm", showLabel = false }: Props) {
  const { data = [] } = useResponsaveis();

  const baseChip =
    size === "md"
      ? "h-9 px-3 text-sm"
      : "h-7 px-2.5 text-xs";

  const Chip = ({
    active,
    onClick,
    children,
    color,
    title,
  }: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
    color?: string;
    title?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border transition-colors whitespace-nowrap",
        baseChip,
        active
          ? "border-primary bg-primary/10 text-foreground font-medium"
          : "border-border bg-background hover:bg-muted text-muted-foreground"
      )}
      style={active && color ? { borderColor: color, backgroundColor: `${color}20` } : undefined}
    >
      {color && (
        <span
          className="inline-block h-2 w-2 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
      )}
      {children}
    </button>
  );

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)}>
      {showLabel && (
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1 mr-1">
          <Users className="h-3.5 w-3.5" /> Responsável:
        </span>
      )}
      <Chip active={value === "all"} onClick={() => onChange("all")}>
        Todos
      </Chip>
      {data.map((r) => (
        <Chip
          key={r.id}
          active={value === r.id}
          onClick={() => onChange(r.id)}
          color={r.cor}
          title={r.nome}
        >
          {r.apelido || r.nome}
        </Chip>
      ))}
      <Chip active={value === "none"} onClick={() => onChange("none")}>
        <UserX className="h-3 w-3" /> Sem resp.
      </Chip>
    </div>
  );
}

/**
 * Helpers para aplicar o filtro de responsável em arrays.
 */
export function matchesResponsavel(
  filter: ResponsavelFilterValue,
  responsavelId: string | null | undefined
): boolean {
  if (filter === "all") return true;
  if (filter === "none") return !responsavelId;
  return responsavelId === filter;
}

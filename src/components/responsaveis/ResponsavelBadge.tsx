import { useResponsaveis } from "@/hooks/useResponsaveis";
import { cn } from "@/lib/utils";

interface Props {
  responsavelId?: string | null;
  size?: "xs" | "sm" | "md";
  showName?: boolean;
  className?: string;
}

export function ResponsavelBadge({ responsavelId, size = "sm", showName = true, className }: Props) {
  const { data } = useResponsaveis(true);
  if (!responsavelId) return null;
  const r = data?.find((x) => x.id === responsavelId);
  if (!r) return null;

  const dot = size === "xs" ? "h-2 w-2" : size === "md" ? "h-3 w-3" : "h-2.5 w-2.5";
  const text = size === "xs" ? "text-[10px]" : size === "md" ? "text-sm" : "text-xs";

  return (
    <span className={cn("inline-flex items-center gap-1.5", text, className)}>
      <span
        className={cn("rounded-full ring-1 ring-background shadow-sm shrink-0", dot)}
        style={{ backgroundColor: r.cor }}
        aria-label={r.nome}
      />
      {showName && <span className="truncate font-medium">{r.apelido || r.nome}</span>}
    </span>
  );
}

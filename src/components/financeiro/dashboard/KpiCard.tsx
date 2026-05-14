import { Card } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";
import { ReactNode } from "react";

type Props = {
  icon?: ReactNode;
  label: string;
  value: string;
  hint?: string;
  accentColor?: string;
  warn?: boolean;
  /** compact = small mobile card (used in MobileKpiRow) */
  compact?: boolean;
};

export function KpiCard({ icon, label, value, hint, accentColor, warn, compact }: Props) {
  if (compact) {
    return (
      <Card
        className={`relative overflow-hidden shrink-0 w-[155px] snap-start ${warn ? "ring-1 ring-amber-300" : ""}`}
        style={accentColor ? { borderLeftWidth: 3, borderLeftColor: accentColor } : undefined}
      >
        <div className="p-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted-foreground font-medium leading-tight truncate">
              <span style={accentColor ? { color: accentColor } : undefined}>{icon}</span>
              <span className="truncate">{label}</span>
            </span>
            {hint && (
              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-muted-foreground/60 hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                    <Info className="h-3 w-3" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" className="w-60 text-[11px] p-2.5">{hint}</PopoverContent>
              </Popover>
            )}
          </div>
          <p className="text-base font-semibold tabular-nums leading-tight truncate" title={value}>{value}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`relative overflow-hidden ${warn ? "border-amber-300" : ""}`}
      style={accentColor ? { borderLeftWidth: 4, borderLeftColor: accentColor } : undefined}
    >
      <div className="p-3 space-y-1">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 font-medium">
          <span style={accentColor ? { color: accentColor } : undefined}>{icon}</span>
          {label}
        </div>
        <p className="text-lg font-semibold tabular-nums leading-tight">{value}</p>
        {hint && <p className="text-[10px] text-muted-foreground truncate" title={hint}>{hint}</p>}
      </div>
    </Card>
  );
}

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type PeriodPreset = "tudo" | "hoje" | "7dias" | "mes" | "ano";

interface Props {
  value: PeriodPreset;
  onChange: (v: PeriodPreset) => void;
}

const presets: { value: PeriodPreset; label: string }[] = [
  { value: "tudo", label: "Tudo" },
  { value: "hoje", label: "Hoje" },
  { value: "7dias", label: "7 dias" },
  { value: "mes", label: "Mês" },
  { value: "ano", label: "Ano" },
];

export function PeriodFilter({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-md border bg-card p-0.5">
      {presets.map((p) => (
        <Button
          key={p.value}
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => onChange(p.value)}
          className={cn(
            "h-7 px-3 text-xs",
            value === p.value && "bg-primary text-primary-foreground hover:bg-primary/90",
          )}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}

export function getPeriodRange(preset: PeriodPreset): {
  start?: string;
  end?: string;
} {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "hoje":
      return { start: fmt(today), end: fmt(today) };
    case "7dias": {
      const start = new Date(today);
      start.setDate(start.getDate() - 6);
      return { start: fmt(start), end: fmt(today) };
    }
    case "mes":
      return {
        start: fmt(new Date(now.getFullYear(), now.getMonth(), 1)),
        end: fmt(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
      };
    case "ano":
      return {
        start: fmt(new Date(now.getFullYear(), 0, 1)),
        end: fmt(new Date(now.getFullYear(), 11, 31)),
      };
    default:
      return {};
  }
}

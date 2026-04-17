import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Filter } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ColumnFilterOption {
  value: string;
  label: string;
}

interface Props {
  options: ColumnFilterOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  searchable?: boolean;
}

export function ColumnFilter({
  options,
  selected,
  onChange,
  searchable = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const active = selected.length > 0;

  const filtered = search.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  const toggle = (v: string) => {
    onChange(
      selected.includes(v)
        ? selected.filter((s) => s !== v)
        : [...selected, v],
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-6 w-6 ml-1",
            active && "text-primary bg-primary/10",
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <Filter className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-2"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Filtrar</span>
            {active && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onChange([])}
              >
                Limpar
              </Button>
            )}
          </div>
          {searchable && options.length > 6 && (
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="h-8 text-xs"
            />
          )}
          <div className="max-h-60 overflow-auto space-y-1">
            {filtered.length === 0 ? (
              <div className="text-xs text-muted-foreground py-2 text-center">
                Sem opções
              </div>
            ) : (
              filtered.map((o) => (
                <label
                  key={o.value}
                  className="flex items-center gap-2 text-sm py-1 px-1 rounded hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={selected.includes(o.value)}
                    onCheckedChange={() => toggle(o.value)}
                  />
                  <span className="truncate">{o.label}</span>
                </label>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

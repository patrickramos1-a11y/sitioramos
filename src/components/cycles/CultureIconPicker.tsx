import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CULTURE_GALLERY, CULTURE_COLORS } from "@/lib/cycles/cultureGallery";
import { Sprout, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CultureIconPickerProps {
  icone: string | null;
  cor: string | null;
  onChange: (next: { icone: string | null; cor: string | null }) => void;
}

export function CultureIconPicker({ icone, cor, onChange }: CultureIconPickerProps) {
  const [search, setSearch] = useState("");
  const list = CULTURE_GALLERY.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.nome.toLowerCase().includes(q) ||
      c.keywords.some((k) => k.includes(q))
    );
  });
  const corAtual = cor || "#22c55e";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-12 p-0 text-xl"
          style={{ borderColor: corAtual, color: corAtual }}
          title="Escolher ícone e cor"
        >
          {icone || <Sprout className="h-4 w-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3 space-y-3" align="start">
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5">Cor</div>
          <div className="flex flex-wrap gap-1.5">
            {CULTURE_COLORS.map((c) => (
              <button
                key={c.hex}
                type="button"
                title={c.nome}
                onClick={() => onChange({ icone, cor: c.hex })}
                className={cn(
                  "h-7 w-7 rounded-full border-2 transition-all",
                  corAtual === c.hex ? "ring-2 ring-offset-1 ring-foreground/40 scale-110" : "border-transparent",
                )}
                style={{ background: c.hex }}
              >
                {corAtual === c.hex && <Check className="h-3.5 w-3.5 text-white mx-auto" />}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground mb-1.5">Ícone (frutas e hortaliças)</div>
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm mb-2"
          />
          <div className="grid grid-cols-7 gap-1 max-h-56 overflow-y-auto">
            <button
              type="button"
              title="Sem ícone"
              onClick={() => onChange({ icone: null, cor })}
              className={cn(
                "h-9 w-9 rounded-md border text-xs flex items-center justify-center hover:bg-muted",
                !icone && "ring-2 ring-primary",
              )}
            >
              —
            </button>
            {list.map((c) => (
              <button
                key={c.emoji}
                type="button"
                title={c.nome}
                onClick={() => onChange({ icone: c.emoji, cor })}
                className={cn(
                  "h-9 w-9 rounded-md border text-xl flex items-center justify-center hover:bg-muted transition-colors",
                  icone === c.emoji && "ring-2 ring-primary",
                )}
              >
                {c.emoji}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

import { useState } from "react";
import { FinanceiroFilters } from "./FinanceiroFilters";
import { defaultFilters, type FinFilters } from "@/hooks/financeiro/useFinanceiroAnalytics";
import { VisaoGeralSubTab } from "./dashboard/VisaoGeralSubTab";
import { PorAreaSubTab } from "./dashboard/PorAreaSubTab";
import { PorCicloSubTab } from "./dashboard/PorCicloSubTab";
import { PorCategoriaSubTab } from "./dashboard/PorCategoriaSubTab";
import { InvestimentosSubTab } from "./dashboard/InvestimentosSubTab";
import { EmprestimosSubTab } from "./dashboard/EmprestimosSubTab";
import { LayoutDashboard, MapPin, Sprout, Tag, Hammer, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

const SUB = [
  { value: "overview",     label: "Visão Geral",  short: "Geral",   icon: LayoutDashboard, color: "hsl(190 80% 45%)", comp: VisaoGeralSubTab },
  { value: "por-area",     label: "Por Área",     short: "Áreas",   icon: MapPin,          color: "hsl(142 65% 45%)", comp: PorAreaSubTab },
  { value: "por-ciclo",    label: "Por Ciclo",    short: "Ciclos",  icon: Sprout,          color: "hsl(28 75% 50%)",  comp: PorCicloSubTab },
  { value: "por-categoria",label: "Por Categoria",short: "Categ.",  icon: Tag,             color: "hsl(265 65% 58%)", comp: PorCategoriaSubTab },
  { value: "investimentos",label: "Investimentos",short: "Invest.", icon: Hammer,          color: "hsl(45 90% 50%)",  comp: InvestimentosSubTab },
  { value: "emprestimos",  label: "Empréstimos",  short: "Empr.",   icon: Landmark,        color: "hsl(355 65% 55%)", comp: EmprestimosSubTab },
];

export function DashboardTab() {
  const [filters, setFilters] = useState<FinFilters>(defaultFilters);
  const [view, setView] = useState("overview");
  const Active = SUB.find((s) => s.value === view)?.comp ?? VisaoGeralSubTab;
  const activeColor = SUB.find((s) => s.value === view)?.color;

  return (
    <div className="space-y-3 md:space-y-4">
      <FinanceiroFilters value={filters} onChange={setFilters} />

      {/* Colored chip nav — horizontal scroll on mobile */}
      <div className="flex gap-1.5 overflow-x-auto -mx-1 px-1 pb-1 scrollbar-thin md:flex-wrap md:overflow-visible">
        {SUB.map((s) => {
          const Icon = s.icon;
          const active = view === s.value;
          return (
            <button
              key={s.value}
              onClick={() => setView(s.value)}
              className={cn(
                "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all",
                active
                  ? "text-white shadow-sm"
                  : "bg-card text-foreground border-border hover:border-foreground/20"
              )}
              style={active ? { background: s.color, borderColor: s.color } : undefined}
            >
              <Icon className="h-3.5 w-3.5" style={!active ? { color: s.color } : undefined} />
              <span className="md:hidden">{s.short}</span>
              <span className="hidden md:inline">{s.label}</span>
            </button>
          );
        })}
      </div>

      <div
        className="rounded-md"
        style={activeColor ? { boxShadow: `inset 3px 0 0 0 ${activeColor}` } : undefined}
      >
        <div className="pl-1 md:pl-2">
          <Active filters={filters} />
        </div>
      </div>
    </div>
  );
}
